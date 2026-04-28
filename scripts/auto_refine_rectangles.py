#!/usr/bin/env python3

import argparse
import json
import math
from pathlib import Path

import cv2
import numpy as np


BOARD_WIDTH_UM = 44.0
BOARD_HEIGHT_UM = 60.0


def parse_args():
    parser = argparse.ArgumentParser(description="Refine fixed terrain rectangles against a board image")
    parser.add_argument("--config", required=True, help="Input JSON config")
    parser.add_argument("--out", required=True, help="Output JSON config")
    parser.add_argument("--passes", type=int, default=3, help="Refinement passes")
    return parser.parse_args()


def load_config(path_str):
    return json.loads(Path(path_str).read_text())


def load_board_image(image_path, board_rect):
    image_bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise RuntimeError(f"Could not read image {image_path}")
    x, y, w, h = board_rect["x"], board_rect["y"], board_rect["width"], board_rect["height"]
    return image_bgr[y : y + h, x : x + w].copy()


def um_to_px_x(value_um, board_rect):
    return (value_um / BOARD_WIDTH_UM) * board_rect["width"]


def um_to_px_y(value_um, board_rect):
    return (value_um / BOARD_HEIGHT_UM) * board_rect["height"]


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


def frange(start, stop, step):
    values = []
    current = start
    while current <= stop + 1e-9:
        values.append(current)
        current += step
    return values


def rotate_points(points, angle_deg):
    angle_rad = math.radians(angle_deg)
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    rotated = []
    for x_value, y_value in points:
        rotated.append((x_value * cos_a - y_value * sin_a, x_value * sin_a + y_value * cos_a))
    return rotated


def rectangle_corners(center_x_px, center_y_px, width_px, height_px, rotation_deg):
    half_w = width_px / 2
    half_h = height_px / 2
    base = [(-half_w, -half_h), (half_w, -half_h), (half_w, half_h), (-half_w, half_h)]
    rotated = rotate_points(base, rotation_deg)
    return np.array(
        [[center_x_px + point_x, center_y_px + point_y] for point_x, point_y in rotated],
        dtype=np.float32,
    )


def sample_grid(width_px, height_px, cols, rows, inset):
    samples = []
    for row in range(rows):
        local_y = ((row + 0.5) / rows - 0.5) * height_px * inset
        for col in range(cols):
            local_x = ((col + 0.5) / cols - 0.5) * width_px * inset
            samples.append((local_x, local_y))
    return samples


def sample_border(width_px, height_px, segments, inner_scale):
    half_w = width_px / 2
    half_h = height_px / 2
    inner_w = half_w * inner_scale
    inner_h = half_h * inner_scale
    points = []
    for index in range(segments):
        t = (index + 0.5) / segments
        x_value = -half_w + t * width_px
        points.append((x_value, -half_h))
        points.append((x_value, half_h))
        inner_x = -inner_w + t * inner_w * 2
        points.append((inner_x, -inner_h))
        points.append((inner_x, inner_h))
    for index in range(segments):
        t = (index + 0.5) / segments
        y_value = -half_h + t * height_px
        points.append((-half_w, y_value))
        points.append((half_w, y_value))
        inner_y = -inner_h + t * inner_h * 2
        points.append((-inner_w, inner_y))
        points.append((inner_w, inner_y))
    return points


def build_feature_maps(board_bgr):
    board_rgb = cv2.cvtColor(board_bgr, cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(board_rgb, cv2.COLOR_RGB2HSV)
    hue = hsv[:, :, 0].astype(np.float32)
    sat = hsv[:, :, 1].astype(np.float32)
    val = hsv[:, :, 2].astype(np.float32)

    gray_score = (
        (sat <= 72).astype(np.float32) *
        (val >= 85).astype(np.float32) *
        (val <= 235).astype(np.float32)
    )

    dark_score = (
        (val <= 95).astype(np.float32) *
        (sat <= 110).astype(np.float32)
    )

    green_score = (
        (hue >= 35).astype(np.float32) *
        (hue <= 95).astype(np.float32) *
        (sat >= 45).astype(np.float32) *
        (val >= 40).astype(np.float32)
    )

    yellow_score = (
        (hue >= 10).astype(np.float32) *
        (hue <= 35).astype(np.float32) *
        (sat >= 50).astype(np.float32) *
        (val >= 40).astype(np.float32)
    )

    color_score = np.clip(green_score + yellow_score, 0.0, 1.0)

    deploy_penalty = (
        (
            ((hue <= 5) | (hue >= 170)).astype(np.float32) *
            (sat >= 90).astype(np.float32) *
            (val >= 80).astype(np.float32)
        ) +
        (
            (hue >= 95).astype(np.float32) *
            (hue <= 125).astype(np.float32) *
            (sat >= 70).astype(np.float32) *
            (val >= 60).astype(np.float32)
        )
    )

    edges = cv2.Canny(cv2.cvtColor(board_bgr, cv2.COLOR_BGR2GRAY), 50, 140).astype(np.float32) / 255.0

    return {
        "gray": gray_score,
        "dark": dark_score,
        "color": color_score,
        "deploy": np.clip(deploy_penalty, 0.0, 1.0),
        "edges": edges,
        "height": board_bgr.shape[0],
        "width": board_bgr.shape[1],
    }


def sample_feature(feature_map, points, center_x_px, center_y_px, rotation_deg):
    rotated = rotate_points(points, rotation_deg)
    total = 0.0
    count = 0
    height = feature_map.shape[0]
    width = feature_map.shape[1]

    for local_x, local_y in rotated:
        px = int(round(center_x_px + local_x))
        py = int(round(center_y_px + local_y))
        if 0 <= px < width and 0 <= py < height:
            total += float(feature_map[py, px])
            count += 1

    return total / count if count else 0.0


def overlap_penalty(candidate_center_px, candidate_radius_px, occupied_items):
    if not occupied_items:
        return 0.0
    penalty = 0.0
    for center_x_px, center_y_px, radius_px in occupied_items:
        distance = math.hypot(candidate_center_px[0] - center_x_px, candidate_center_px[1] - center_y_px)
        overlap_ratio = (candidate_radius_px + radius_px - distance) / max(candidate_radius_px + radius_px, 1e-6)
        if overlap_ratio > 0:
            penalty = max(penalty, overlap_ratio)
    return penalty


def build_piece_score(feature_maps, piece, center_x_um, center_y_um, rotation_deg, occupied_items):
    board_rect = piece["_board_rect"]
    width_um = piece["width"]
    height_um = piece["height"]
    preset = piece["preset"]

    center_x_px = um_to_px_x(center_x_um, board_rect)
    center_y_px = um_to_px_y(center_y_um, board_rect)
    width_px = um_to_px_x(width_um, board_rect)
    height_px = um_to_px_y(height_um, board_rect)

    inner_points = sample_grid(width_px, height_px, 8, 10, 0.78)
    full_points = sample_grid(width_px, height_px, 10, 12, 0.96)
    border_points = sample_border(width_px, height_px, 6, 0.72)

    gray_inner = sample_feature(feature_maps["gray"], inner_points, center_x_px, center_y_px, rotation_deg)
    color_inner = sample_feature(feature_maps["color"], inner_points, center_x_px, center_y_px, rotation_deg)
    deploy_inner = sample_feature(feature_maps["deploy"], full_points, center_x_px, center_y_px, rotation_deg)
    dark_border = sample_feature(feature_maps["dark"], border_points, center_x_px, center_y_px, rotation_deg)
    edge_border = sample_feature(feature_maps["edges"], border_points, center_x_px, center_y_px, rotation_deg)

    if "line" in preset.lower():
        score = (
            color_inner * 1.8 +
            dark_border * 1.25 +
            edge_border * 1.1 +
            gray_inner * 0.4 -
            deploy_inner * 1.7
        )
    else:
        score = (
            gray_inner * 1.55 +
            dark_border * 1.3 +
            edge_border * 0.9 +
            color_inner * 0.65 -
            deploy_inner * 1.5
        )

    corners = rectangle_corners(center_x_px, center_y_px, width_px, height_px, rotation_deg)
    radius_px = math.hypot(width_px / 2, height_px / 2) * 0.82
    overlap = overlap_penalty((center_x_px, center_y_px), radius_px, occupied_items)
    score -= overlap * 3.2

    return score, {
        "gray_inner": gray_inner,
        "color_inner": color_inner,
        "dark_border": dark_border,
        "edge_border": edge_border,
        "deploy_inner": deploy_inner,
        "overlap": overlap,
        "corners": corners,
        "center_x_px": center_x_px,
        "center_y_px": center_y_px,
        "radius_px": radius_px,
    }


def refine_piece(piece, feature_maps, occupied_items):
    base_x = piece["x"]
    base_y = piece["y"]
    base_rotation = piece.get("rotation", 0.0)

    best_score, best_metrics = build_piece_score(feature_maps, piece, base_x, base_y, base_rotation, occupied_items)
    best = {
        "x": base_x,
        "y": base_y,
        "rotation": base_rotation,
        "score": best_score,
        "metrics": best_metrics,
    }

    stages = [
        {"delta_um": 1.0, "step_um": 0.25, "delta_rot": 8.0, "step_rot": 2.0},
        {"delta_um": 0.25, "step_um": 0.1, "delta_rot": 2.0, "step_rot": 1.0},
    ]

    for stage in stages:
        current_best = dict(best)
        x_values = frange(current_best["x"] - stage["delta_um"], current_best["x"] + stage["delta_um"], stage["step_um"])
        y_values = frange(current_best["y"] - stage["delta_um"], current_best["y"] + stage["delta_um"], stage["step_um"])
        rotation_values = frange(
            current_best["rotation"] - stage["delta_rot"],
            current_best["rotation"] + stage["delta_rot"],
            stage["step_rot"],
        )

        for x_value in x_values:
            for y_value in y_values:
                for rotation_value in rotation_values:
                    score, metrics = build_piece_score(
                        feature_maps,
                        piece,
                        x_value,
                        y_value,
                        normalize_rotation(rotation_value),
                        occupied_items,
                    )
                    if score > best["score"]:
                        best = {
                            "x": round(x_value, 3),
                            "y": round(y_value, 3),
                            "rotation": round(normalize_rotation(rotation_value), 3),
                            "score": score,
                            "metrics": metrics,
                        }

    refined = dict(piece)
    refined["x"] = best["x"]
    refined["y"] = best["y"]
    refined["rotation"] = best["rotation"]
    refined["_score"] = round(best["score"], 4)
    refined["_gray"] = round(best["metrics"]["gray_inner"], 4)
    refined["_color"] = round(best["metrics"]["color_inner"], 4)
    refined["_border"] = round(best["metrics"]["dark_border"], 4)
    refined["_edge"] = round(best["metrics"]["edge_border"], 4)
    return refined, best["metrics"]


def piece_sort_key(piece):
    return (
        -(piece["width"] * piece["height"]),
        0 if "line" not in piece["preset"].lower() else 1,
        piece["y"],
        piece["x"],
    )


def refine_config(config, passes):
    board_rect = config["image"]["boardRectPx"]
    board_bgr = load_board_image(config["image"]["src"], board_rect)
    feature_maps = build_feature_maps(board_bgr)

    terrain = [dict(piece, _board_rect=board_rect) for piece in config["terrain"]]

    for _ in range(passes):
        ordered = sorted(terrain, key=piece_sort_key)
        occupied_items = []
        refined_lookup = {}

        for piece in ordered:
            refined_piece, metrics = refine_piece(piece, feature_maps, occupied_items)
            occupied_items.append((metrics["center_x_px"], metrics["center_y_px"], metrics["radius_px"]))
            refined_piece["_board_rect"] = board_rect
            refined_lookup[piece["id"]] = refined_piece

        terrain = [refined_lookup[piece["id"]] for piece in terrain]

    for piece in terrain:
        piece.pop("_board_rect", None)

    refined_config = dict(config)
    refined_config["terrain"] = terrain
    return refined_config


def main():
    args = parse_args()
    config = load_config(args.config)
    refined = refine_config(config, args.passes)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(refined, indent=2) + "\n")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
