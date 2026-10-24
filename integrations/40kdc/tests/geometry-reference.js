// Frozen pre-optimization geometry used as a correctness oracle.
import { pointSegmentDistance } from "../terrain-links.js";

function rotatePoint(point, angleDegrees) {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function toTerrainLocalPoint(point, terrain) {
  const translated = {
    x: point.x - terrain.x,
    y: point.y - terrain.y,
  };

  return rotatePoint(translated, -(terrain.rotation || 0));
}

function getTerrainLocalShapePoints(terrain) {
  return terrain.polygon?.length >= 3
    ? terrain.polygon
    : [
        { x: -terrain.width / 2, y: -terrain.height / 2 },
        { x: terrain.width / 2, y: -terrain.height / 2 },
        { x: terrain.width / 2, y: terrain.height / 2 },
        { x: -terrain.width / 2, y: terrain.height / 2 },
      ];
}

function getTerrainLocalShapePolygons(terrain) {
  return terrain.polygons ?? [getTerrainLocalShapePoints(terrain)];
}

function pointInsideTerrain(localPoint, terrain) {
  if (terrain.polygons) return terrain.polygons.some(polygon =>
    pointInPolygon(localPoint, polygon) || (terrain.seamTolerance && polygon.some((p,i) =>
      pointSegmentDistance(localPoint, p, polygon[(i+1)%polygon.length]) <= terrain.seamTolerance))
  );
  if (terrain.polygon?.length >= 3) {
    return pointInPolygon(localPoint, terrain.polygon);
  }

  return (
    Math.abs(localPoint.x) <= terrain.width / 2 &&
    Math.abs(localPoint.y) <= terrain.height / 2
  );
}

function pointInPolygon(point, polygon) {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function segmentsIntersect(a, b, c, d) {
  const denominator = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  const epsilon = 1e-9;

  if (Math.abs(denominator) < epsilon) {
    return false;
  }

  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / denominator;
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / denominator;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function segmentIntersectsTerrain(start, end, terrain) {
  const localStart = toTerrainLocalPoint(start, terrain);
  const localEnd = toTerrainLocalPoint(end, terrain);

  if (pointInsideTerrain(localStart, terrain) || pointInsideTerrain(localEnd, terrain)) {
    return true;
  }

  for (const corners of getTerrainLocalShapePolygons(terrain)) {
    for (let index = 0; index < corners.length; index += 1) {
      const edgeStart = corners[index];
      const edgeEnd = corners[(index + 1) % corners.length];
      if (segmentsIntersect(localStart, localEnd, edgeStart, edgeEnd)) return true;
    }
  }

  return false;
}

function isPointInsideTerrain(point, terrain) {
  return pointInsideTerrain(toTerrainLocalPoint(point, terrain), terrain);
}
export { isPointInsideTerrain, segmentIntersectsTerrain };
