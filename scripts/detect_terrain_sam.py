#!/usr/bin/env python3

import argparse
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw
from segment_anything import SamAutomaticMaskGenerator, sam_model_registry


BOARD_WIDTH_UM = 44.0
BOARD_HEIGHT_UM = 60.0
TERRAIN_PRESETS = {
    "large": (7.0, 11.5),
    "largeXL": (8.0, 11.5),
    "medium": (6.0, 4.0),
    "longLine": (10.0, 2.5),
    "shortLine": (6.0, 2.0),
}
PRESET_QUOTAS = {
    "large": 4,
    "largeXL": 1,
    "medium": 4,
    "longLine": 2,
    "shortLine": 4,
}


def parse_args():
    parser = argparse.ArgumentParser(description="Detect terrain rectangles with Segment Anything")
    parser.add_argument("--config", required=True, help="Input map JSON config")
    parser.add_argument("--checkpoint", required=True, help="SAM checkpoint path")
    parser.add_argument("--out-json", required=True, help="Output detected config JSON")
    parser.add_argument("--out-preview", required=True, help="Output preview PNG")
    parser.add_argument("--device", default="cpu", help="Torch device, e.g. cpu or mps")
    return parser.parse_args()


def load_config(path_str):
    return json.loads(Path(path_str).read_text())


def load_board_rgb(image_path, board_rect):
    image_bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise RuntimeError(f"Could not read image {image_path}")
    x, y, w, h = board_rect["x"], board_rect["y"], board_rect["width"], board_rect["height"]
    board_bgr = image_bgr[y : y + h, x : x + w].copy()
    return cv2.cvtColor(board_bgr, cv2.COLOR_BGR2RGB)


def make_box_mask(shape, box_points):
    mask = np.zeros(shape[:2], dtype=np.uint8)
    cv2.fillPoly(mask, [np.array(box_points, dtype=np.int32)], 255)
    return mask


def shrink_box(box_points, factor):
    points = np.array(box_points, dtype=np.float32)
    center = points.mean(axis=0)
    return ((points - center) * factor + center).tolist()


def compute_visual_metrics(board_rgb, box_points):
    hsv = cv2.cvtColor(board_rgb, cv2.COLOR_RGB2HSV)
    value = hsv[:, :, 2]
    saturation = hsv[:, :, 1]
    hue = hsv[:, :, 0]

    full_mask = make_box_mask(board_rgb.shape, box_points)
    inner_box = shrink_box(box_points, 0.76)
    inner_mask = make_box_mask(board_rgb.shape, inner_box)
    border_mask = cv2.subtract(full_mask, inner_mask)

    full_pixels = full_mask > 0
    inner_pixels = inner_mask > 0
    border_pixels = border_mask > 0

    if not np.any(full_pixels):
        return {
            "gray_ratio": 0.0,
            "dark_border_ratio": 0.0,
            "color_detail_ratio": 0.0,
            "visual_score": 0.0,
        }

    gray_ratio = np.mean(
        (saturation[full_pixels] <= 70) &
        (value[full_pixels] >= 95) &
        (value[full_pixels] <= 240)
    )

    dark_border_ratio = 0.0
    if np.any(border_pixels):
        dark_border_ratio = np.mean(
            (value[border_pixels] <= 95) &
            (saturation[border_pixels] <= 95)
        )

    color_detail_ratio = 0.0
    if np.any(inner_pixels):
        green_pixels = (
            (hue[inner_pixels] >= 35) &
            (hue[inner_pixels] <= 95) &
            (saturation[inner_pixels] >= 45)
        )
        yellow_pixels = (
            (hue[inner_pixels] >= 10) &
            (hue[inner_pixels] <= 35) &
            (saturation[inner_pixels] >= 50)
        )
        color_detail_ratio = np.mean(green_pixels | yellow_pixels)

    visual_score = (
        gray_ratio * 1.8 +
        dark_border_ratio * 1.6 +
        color_detail_ratio * 0.9
    )

    return {
        "gray_ratio": float(gray_ratio),
        "dark_border_ratio": float(dark_border_ratio),
        "color_detail_ratio": float(color_detail_ratio),
        "visual_score": float(visual_score),
    }


def build_generator(checkpoint_path, device):
    sam = sam_model_registry["vit_b"](checkpoint=checkpoint_path)
    sam.to(device=device)
    return SamAutomaticMaskGenerator(
        model=sam,
        points_per_side=32,
        pred_iou_thresh=0.86,
        stability_score_thresh=0.92,
        crop_n_layers=1,
        crop_n_points_downscale_factor=2,
        min_mask_region_area=1500,
    )


def px_to_um_x(value_px, board_rect):
    return (value_px / board_rect["width"]) * BOARD_WIDTH_UM


def px_to_um_y(value_px, board_rect):
    return (value_px / board_rect["height"]) * BOARD_HEIGHT_UM


def normalize_rotation(angle):
    while angle <= -90:
        angle += 180
    while angle > 90:
        angle -= 180
    return angle


def mask_to_candidate(mask, board_rect, board_rgb):
    segmentation = mask["segmentation"].astype(np.uint8) * 255
    contours, _ = cv2.findContours(segmentation, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    contour = max(contours, key=cv2.contourArea)
    rect = cv2.minAreaRect(contour)
    (cx, cy), (w, h), angle = rect
    if w < 15 or h < 15:
        return None

    box = cv2.boxPoints(rect)
    rect_area = max(w * h, 1.0)
    contour_area = cv2.contourArea(contour)
    fill_ratio = contour_area / rect_area
    if fill_ratio < 0.42:
        return None

    width_um = px_to_um_x(w, board_rect)
    height_um = px_to_um_y(h, board_rect)
    visual_metrics = compute_visual_metrics(board_rgb, box)
    return {
        "cx_px": float(cx),
        "cy_px": float(cy),
        "w_px": float(w),
        "h_px": float(h),
        "angle": float(angle),
        "box": box.tolist(),
        "contour_area": float(contour_area),
        "fill_ratio": float(fill_ratio),
        "width_um": float(width_um),
        "height_um": float(height_um),
        "pred_iou": float(mask.get("predicted_iou", 0.0)),
        "stability": float(mask.get("stability_score", 0.0)),
        **visual_metrics,
    }


def classify_candidate(candidate):
    width_um = candidate["width_um"]
    height_um = candidate["height_um"]
    best = None
    scores = {}

    for preset_name, (preset_w, preset_h) in TERRAIN_PRESETS.items():
        score_a = abs(width_um - preset_w) + abs(height_um - preset_h)
        score_b = abs(width_um - preset_h) + abs(height_um - preset_w)
        score = min(score_a, score_b)
        swapped = score_b < score_a
        scores[preset_name] = score

        if best is None or score < best["score"]:
            best = {"preset": preset_name, "score": score, "swapped": swapped}

    best["scores"] = scores
    best["large_family_score"] = min(scores["large"], scores["largeXL"])
    return best


def polygon_iou(box_a, box_b, canvas_shape):
    mask_a = np.zeros(canvas_shape, dtype=np.uint8)
    mask_b = np.zeros(canvas_shape, dtype=np.uint8)
    cv2.fillPoly(mask_a, [np.array(box_a, dtype=np.int32)], 255)
    cv2.fillPoly(mask_b, [np.array(box_b, dtype=np.int32)], 255)
    inter = np.count_nonzero(cv2.bitwise_and(mask_a, mask_b))
    union = np.count_nonzero(cv2.bitwise_or(mask_a, mask_b))
    return inter / union if union else 0.0


def select_rectangles(candidates, board_rect):
    enriched = []
    for candidate in candidates:
        classification = classify_candidate(candidate)
        if classification["score"] > 5.5 and classification["large_family_score"] > 3.5:
            continue
        if candidate["visual_score"] < 0.58:
            continue
        enriched.append({**candidate, **classification})

    selected = []
    canvas_shape = (board_rect["height"], board_rect["width"])

    def overlaps_selected(candidate):
        for chosen in selected:
            if polygon_iou(candidate["box"], chosen["box"], canvas_shape) > 0.18:
                return True
        return False

    large_family = [candidate for candidate in enriched if candidate["large_family_score"] <= 3.5]
    board_center_x = board_rect["width"] / 2
    board_center_y = board_rect["height"] / 2

    large_family.sort(
        key=lambda item: (
            item["large_family_score"],
            -item["visual_score"],
            -item["contour_area"],
            -item["dark_border_ratio"],
            -item["gray_ratio"],
            abs(item["cx_px"] - board_center_x) + abs(item["cy_px"] - board_center_y),
            -(item["pred_iou"] + item["stability"]),
        )
    )

    large_family_selected = []
    for candidate in large_family:
        if overlaps_selected(candidate):
            continue
        duplicate = False
        for chosen in large_family_selected:
            if polygon_iou(candidate["box"], chosen["box"], canvas_shape) > 0.25:
                duplicate = True
                break
        if duplicate:
            continue
        large_family_selected.append(candidate)
        selected.append(candidate)
        if len(large_family_selected) >= PRESET_QUOTAS["large"] + PRESET_QUOTAS["largeXL"]:
            break

    if large_family_selected:
        xl_candidate = min(
            large_family_selected,
            key=lambda item: (
                abs(item["cx_px"] - board_center_x) + abs(item["cy_px"] - board_center_y),
                item["scores"]["largeXL"],
                -item["visual_score"],
            ),
        )
        for candidate in large_family_selected:
            candidate["preset"] = "largeXL" if candidate is xl_candidate else "large"
            candidate["score"] = candidate["scores"][candidate["preset"]]

    for preset in ("medium", "longLine", "shortLine"):
        preset_candidates = [candidate for candidate in enriched if candidate["preset"] == preset]
        preset_candidates.sort(
            key=lambda item: (
                item["score"],
                -item["visual_score"],
                -item["dark_border_ratio"],
                -item["gray_ratio"],
                -(item["pred_iou"] + item["stability"]),
                -item["contour_area"],
            )
        )

        picked = 0
        for candidate in preset_candidates:
            if overlaps_selected(candidate):
                continue
            selected.append(candidate)
            picked += 1
            if picked >= PRESET_QUOTAS[preset]:
                break

    return selected


def selected_to_terrain(selected, board_rect):
    terrain = []
    for index, candidate in enumerate(selected, start=1):
        preset_name = candidate["preset"]
        preset_w, preset_h = TERRAIN_PRESETS[preset_name]
        rotation = candidate["angle"]
        if candidate["swapped"]:
            rotation += 90
        rotation = normalize_rotation(rotation)

        kind = "barricade" if "line" in preset_name.lower() else "ruin"
        if preset_name == "medium":
            kind = "ruin"

        terrain.append(
            {
                "id": f"sam-t{index}",
                "name": f"SAM {index}",
                "kind": kind,
                "preset": preset_name,
                "x": round(px_to_um_x(candidate["cx_px"], board_rect), 3),
                "y": round(px_to_um_y(candidate["cy_px"], board_rect), 3),
                "width": preset_w,
                "height": preset_h,
                "rotation": round(rotation, 3),
                "_score": round(candidate["score"], 3),
                "_fill_ratio": round(candidate["fill_ratio"], 3),
                "_visual_score": round(candidate["visual_score"], 3),
            }
        )
    return terrain


def draw_preview(board_rgb, selected):
    image = Image.fromarray(board_rgb)
    draw = ImageDraw.Draw(image, "RGBA")
    for index, candidate in enumerate(selected, start=1):
        color = (255, 170, 60, 120) if "line" in candidate["preset"].lower() else (255, 244, 120, 105)
        outline = (255, 120, 40, 255) if "line" in candidate["preset"].lower() else (255, 235, 80, 255)
        box = [(float(x), float(y)) for x, y in candidate["box"]]
        draw.polygon(box, fill=color, outline=outline)
        label = f"{index}:{candidate['preset']}:{candidate['visual_score']:.2f}"
        draw.text((candidate["cx_px"], candidate["cy_px"]), label, fill=(255, 255, 255, 255), anchor="mm")
    return image


def main():
    args = parse_args()
    config = load_config(args.config)
    board_rect = config["image"]["boardRectPx"]
    board_rgb = load_board_rgb(Path(config["image"]["src"]), board_rect)
    generator = build_generator(args.checkpoint, args.device)
    masks = generator.generate(board_rgb)
    candidates = []
    for mask in masks:
        candidate = mask_to_candidate(mask, board_rect, board_rgb)
        if candidate:
            candidates.append(candidate)

    selected = select_rectangles(candidates, board_rect)
    terrain = selected_to_terrain(selected, board_rect)

    out_config = {
        "id": config["id"],
        "name": config["name"],
        "image": config["image"],
        "terrain": terrain,
    }

    Path(args.out_json).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out_json).write_text(json.dumps(out_config, indent=2) + "\n")

    preview = draw_preview(board_rgb, selected)
    Path(args.out_preview).parent.mkdir(parents=True, exist_ok=True)
    preview.save(args.out_preview)

    print(f"Generated {len(masks)} raw masks")
    print(f"Selected {len(terrain)} terrain rectangles")
    print(f"Wrote {args.out_json}")
    print(f"Wrote {args.out_preview}")


if __name__ == "__main__":
    main()
