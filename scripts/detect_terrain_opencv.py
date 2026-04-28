#!/usr/bin/env python3

import argparse
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw


BOARD_WIDTH_UM = 44.0
BOARD_HEIGHT_UM = 60.0
TERRAIN_PRESETS = {
    "large": (7.0, 11.5),
    "largeXL": (8.0, 11.5),
    "medium": (6.0, 4.0),
    "longLine": (10.0, 2.5),
    "shortLine": (6.0, 2.0),
}


def parse_args():
    parser = argparse.ArgumentParser(description="Detect terrain rectangles from a Warhammer map image")
    parser.add_argument("--config", required=True, help="Map JSON config with image + boardRectPx")
    parser.add_argument("--out-json", required=True, help="Detected terrain output JSON")
    parser.add_argument("--out-preview", required=True, help="Debug preview PNG")
    return parser.parse_args()


def load_config(path_str):
    return json.loads(Path(path_str).read_text())


def crop_board(image_path, board_rect):
    image = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if image is None:
        raise RuntimeError(f"Could not read image {image_path}")
    x = board_rect["x"]
    y = board_rect["y"]
    w = board_rect["width"]
    h = board_rect["height"]
    return image[y : y + h, x : x + w].copy()


def build_mask(board_bgr):
    hsv = cv2.cvtColor(board_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(board_bgr, cv2.COLOR_BGR2GRAY)
    lab = cv2.cvtColor(board_bgr, cv2.COLOR_BGR2LAB)

    # Board pieces differ from the white grid both in darkness and texture.
    dark_mask = cv2.inRange(gray, 0, 212)
    sat_mask = cv2.inRange(hsv[:, :, 1], 28, 255)

    # Green/gold details are strong markers that terrain exists here.
    green_mask = cv2.inRange(hsv, np.array([35, 35, 35]), np.array([105, 255, 210]))
    gold_mask = cv2.inRange(hsv, np.array([10, 35, 35]), np.array([38, 255, 235]))

    # LAB distance from pale board floor.
    floor_color = np.median(lab.reshape(-1, 3), axis=0)
    distance = np.linalg.norm(lab.astype(np.float32) - floor_color.astype(np.float32), axis=2)
    distance_mask = np.where(distance > 18, 255, 0).astype(np.uint8)

    combined = cv2.bitwise_or(dark_mask, sat_mask)
    combined = cv2.bitwise_or(combined, green_mask)
    combined = cv2.bitwise_or(combined, gold_mask)
    combined = cv2.bitwise_or(combined, distance_mask)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel, iterations=2)
    combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel, iterations=1)

    return combined


def contour_candidates(mask):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 1200:
            continue

        rect = cv2.minAreaRect(contour)
        (cx, cy), (w, h), angle = rect
        if min(w, h) < 20:
            continue

        if w < h:
            angle = angle + 90
            w, h = h, w

        candidates.append(
            {
                "cx_px": float(cx),
                "cy_px": float(cy),
                "w_px": float(w),
                "h_px": float(h),
                "angle": float(angle),
                "area": float(area),
                "box": cv2.boxPoints(rect).tolist(),
            }
        )

    return candidates


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


def score_candidate(candidate, preset_name, board_rect):
    preset_w, preset_h = TERRAIN_PRESETS[preset_name]
    width_um = px_to_um_x(candidate["w_px"], board_rect)
    height_um = px_to_um_y(candidate["h_px"], board_rect)

    score_a = abs(width_um - preset_w) + abs(height_um - preset_h)
    score_b = abs(width_um - preset_h) + abs(height_um - preset_w)

    if score_b < score_a:
        return score_b, True
    return score_a, False


def polygon_iou(box_a, box_b, canvas_shape):
    mask_a = np.zeros(canvas_shape, dtype=np.uint8)
    mask_b = np.zeros(canvas_shape, dtype=np.uint8)
    cv2.fillPoly(mask_a, [np.array(box_a, dtype=np.int32)], 255)
    cv2.fillPoly(mask_b, [np.array(box_b, dtype=np.int32)], 255)
    inter = np.count_nonzero(cv2.bitwise_and(mask_a, mask_b))
    union = np.count_nonzero(cv2.bitwise_or(mask_a, mask_b))
    return inter / union if union else 0.0


def select_candidates(candidates, board_rect, existing_count):
    scored = []
    for candidate in candidates:
      for preset_name in TERRAIN_PRESETS:
        fit_score, swapped = score_candidate(candidate, preset_name, board_rect)
        scored.append(
            {
                "candidate": candidate,
                "preset": preset_name,
                "fit_score": fit_score,
                "swapped": swapped,
            }
        )

    scored.sort(key=lambda item: (item["fit_score"], -item["candidate"]["area"]))
    selected = []

    for item in scored:
        if item["fit_score"] > 3.4:
            continue

        overlaps = False
        for chosen in selected:
            iou = polygon_iou(
                item["candidate"]["box"],
                chosen["candidate"]["box"],
                (board_rect["height"], board_rect["width"]),
            )
            if iou > 0.2:
                overlaps = True
                break

        if overlaps:
            continue

        selected.append(item)
        if len(selected) >= existing_count:
            break

    return selected


def selected_to_config(selected, board_rect):
    terrain = []

    for index, item in enumerate(selected, start=1):
        candidate = item["candidate"]
        preset_name = item["preset"]
        preset_w, preset_h = TERRAIN_PRESETS[preset_name]
        rotation = normalize_rotation(candidate["angle"])

        width_um = px_to_um_x(candidate["w_px"], board_rect)
        height_um = px_to_um_y(candidate["h_px"], board_rect)
        if abs(width_um - preset_h) + abs(height_um - preset_w) < abs(width_um - preset_w) + abs(height_um - preset_h):
            rotation = normalize_rotation(rotation + 90)

        kind = "barricade" if "Line" in preset_name or "line" in preset_name else "ruin"
        if preset_name == "medium":
            kind = "ruin"

        terrain.append(
            {
                "id": f"auto-t{index}",
                "name": f"Detected {index}",
                "kind": kind,
                "preset": preset_name,
                "x": round(px_to_um_x(candidate["cx_px"], board_rect), 3),
                "y": round(px_to_um_y(candidate["cy_px"], board_rect), 3),
                "width": preset_w,
                "height": preset_h,
                "rotation": round(rotation, 3),
                "_fit_score": round(item["fit_score"], 3),
            }
        )

    return terrain


def draw_preview(board_bgr, selected):
    image = Image.fromarray(cv2.cvtColor(board_bgr, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(image, "RGBA")

    for index, item in enumerate(selected, start=1):
        box = item["candidate"]["box"]
        preset = item["preset"]
        color = (255, 190, 70, 120) if "line" in preset.lower() else (255, 240, 120, 110)
        outline = (255, 120, 40, 255) if "line" in preset.lower() else (255, 235, 90, 255)
        draw.polygon([(x, y) for x, y in box], fill=color, outline=outline)
        cx = item["candidate"]["cx_px"]
        cy = item["candidate"]["cy_px"]
        draw.text((cx, cy), f"{index}:{preset}", fill=(255, 255, 255, 255), anchor="mm")

    return image


def main():
    args = parse_args()
    config = load_config(args.config)
    board_rect = config["image"]["boardRectPx"]
    board = crop_board(Path(config["image"]["src"]), board_rect)
    mask = build_mask(board)
    candidates = contour_candidates(mask)
    selected = select_candidates(candidates, board_rect, max(len(config.get("terrain", [])), 12))
    terrain = selected_to_config(selected, board_rect)

    out_json = {
        "id": config["id"],
        "name": config["name"],
        "image": config["image"],
        "terrain": terrain,
    }

    Path(args.out_json).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out_json).write_text(json.dumps(out_json, indent=2) + "\n")

    preview = draw_preview(board, selected)
    Path(args.out_preview).parent.mkdir(parents=True, exist_ok=True)
    preview.save(args.out_preview)

    print(f"Detected {len(terrain)} terrain rectangles")
    print(f"Wrote {args.out_json}")
    print(f"Wrote {args.out_preview}")


if __name__ == "__main__":
    main()
