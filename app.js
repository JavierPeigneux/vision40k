import { BOARD_HEIGHT_UM, BOARD_WIDTH_UM, mapConfigs } from "./map-configs.js";

const MM_PER_INCH = 25.4;
const MIN_BASE_MM = 25;
const MAX_BASE_MM = 160;
const SUPPORT_BANNER_STORAGE_KEY = "vision40k-support-banner-dismissed";
const VISITOR_COUNTER_ENDPOINT = "/api/visits";

const state = {
  currentMapId: mapConfigs[0].id,
  units: [],
  selectedUnitIds: [],
  nextUnitId: 1,
  drag: null,
  suppressClick: false,
};

const elements = {
  mapSelect: document.querySelector("#map-select"),
  boardTitle: document.querySelector("#board-title"),
  boardImage: document.querySelector("#board-image"),
  boardFrame: document.querySelector(".board-frame"),
  board: document.querySelector("#board"),
  terrainLayer: document.querySelector("#terrain-layer"),
  unitsLayer: document.querySelector("#units-layer"),
  baseSize: document.querySelector("#base-size"),
  baseSizeOutput: document.querySelector("#base-size-output"),
  unitName: document.querySelector("#unit-name"),
  addBlue: document.querySelector("#add-blue"),
  addRed: document.querySelector("#add-red"),
  showTerrainOverlay: document.querySelector("#show-terrain-overlay"),
  selectionDetails: document.querySelector("#selection-details"),
  mapConfigDetails: document.querySelector("#map-config-details"),
  clearSelection: document.querySelector("#clear-selection"),
  losLine: document.querySelector("#los-line"),
  losLabel: document.querySelector("#los-label"),
  losLabelBg: document.querySelector("#los-label-bg"),
  supportBanner: document.querySelector("#support-banner"),
  dismissSupportBanner: document.querySelector("#dismiss-support-banner"),
  visitorCount: document.querySelector("#visitor-count"),
};

let boardResizeObserver;

function mmToBoardUnits(mm) {
  return mm / MM_PER_INCH;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCurrentMap() {
  return mapConfigs.find((map) => map.id === state.currentMapId) ?? mapConfigs[0];
}

function setBaseSizeOutput() {
  elements.baseSizeOutput.value = `${elements.baseSize.value} mm`;
}

function populateMapSelect() {
  mapConfigs.forEach((map) => {
    const option = document.createElement("option");
    option.value = map.id;
    option.textContent = map.name;
    elements.mapSelect.append(option);
  });
}

function updateMapConfigPanel() {
  const currentMap = getCurrentMap();
  const { boardRectPx, originalSizePx } = currentMap.image;

  elements.mapConfigDetails.textContent =
    `Imagen original: ${originalSizePx.width}x${originalSizePx.height} px\n` +
    `Rectangulo del tablero: x=${boardRectPx.x}, y=${boardRectPx.y}, ` +
    `w=${boardRectPx.width}, h=${boardRectPx.height}\n` +
    `Elementos de escenografia configurados: ${currentMap.terrain.length}`;
}

function createSvgElement(tagName) {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function renderTerrainOverlay() {
  const currentMap = getCurrentMap();
  elements.terrainLayer.replaceChildren();
  elements.terrainLayer.classList.toggle("is-visible", elements.showTerrainOverlay.checked);

  currentMap.terrain.forEach((piece, index) => {
    const group = createSvgElement("g");
    group.setAttribute("transform", `translate(${piece.x} ${piece.y}) rotate(${piece.rotation || 0})`);

    const rect = createSvgElement("rect");
    rect.setAttribute("x", `${-piece.width / 2}`);
    rect.setAttribute("y", `${-piece.height / 2}`);
    rect.setAttribute("width", `${piece.width}`);
    rect.setAttribute("height", `${piece.height}`);
    rect.setAttribute("class", `terrain-rect terrain-${piece.kind}`);
    group.append(rect);

    const label = createSvgElement("text");
    label.setAttribute("x", "0");
    label.setAttribute("y", "0");
    label.setAttribute("class", "terrain-rect-label");
    label.textContent = `${index + 1}`;
    group.append(label);

    elements.terrainLayer.append(group);
  });
}

function sizeBoardToFrame() {
  const frameRect = elements.boardFrame.getBoundingClientRect();
  const mobileViewport = window.innerWidth <= 980;
  const frameWidth = frameRect.width - (mobileViewport ? 8 : 16);
  const frameHeight = frameRect.height - (mobileViewport ? 8 : 16);

  if (frameWidth <= 0 || frameHeight <= 0) {
    return;
  }

  const boardRatio = BOARD_WIDTH_UM / BOARD_HEIGHT_UM;
  let boardWidth = frameWidth;
  let boardHeight = boardWidth / boardRatio;

  if (boardHeight > frameHeight) {
    boardHeight = frameHeight;
    boardWidth = boardHeight * boardRatio;
  }

  elements.board.style.width = `${boardWidth}px`;
  elements.board.style.height = `${boardHeight}px`;
}

function renderBoard() {
  const currentMap = getCurrentMap();
  const { boardRectPx, originalSizePx, src } = currentMap.image;
  const widthScale = originalSizePx.width / boardRectPx.width;
  const heightScale = originalSizePx.height / boardRectPx.height;

  elements.boardImage.src = src;
  elements.boardImage.style.width = `${widthScale * 100}%`;
  elements.boardImage.style.height = `${heightScale * 100}%`;
  elements.boardImage.style.left = `${-(boardRectPx.x / boardRectPx.width) * 100}%`;
  elements.boardImage.style.top = `${-(boardRectPx.y / boardRectPx.height) * 100}%`;
  elements.boardTitle.textContent = currentMap.name;
  elements.mapSelect.value = currentMap.id;
  updateMapConfigPanel();
  renderTerrainOverlay();
}

function unitsForCurrentMap() {
  return state.units.filter((unit) => unit.mapId === state.currentMapId);
}

function createUnit(team) {
  const sizeMm = clamp(Number(elements.baseSize.value), MIN_BASE_MM, MAX_BASE_MM);
  const sizeUm = mmToBoardUnits(sizeMm);
  const defaultName = elements.unitName.value.trim() || `Peana ${state.nextUnitId}`;
  const spawnX = team === "blue" ? 8 : BOARD_WIDTH_UM - 8;
  const spawnY = BOARD_HEIGHT_UM / 2;

  const unit = {
    id: `unit-${state.nextUnitId}`,
    mapId: state.currentMapId,
    team,
    name: defaultName,
    sizeMm,
    sizeUm,
    x: spawnX,
    y: spawnY,
  };

  state.units.push(unit);
  state.nextUnitId += 1;
  renderUnits();
}

function deleteUnit(unitId) {
  state.units = state.units.filter((unit) => unit.id !== unitId);
  state.selectedUnitIds = state.selectedUnitIds.filter((id) => id !== unitId);
  renderUnits();
}

function formatDistance(um) {
  return `${um.toFixed(1)} um`;
}

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

function pointInsideTerrain(localPoint, terrain) {
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

  const corners = terrain.polygon?.length >= 3
    ? terrain.polygon
    : [
        { x: -terrain.width / 2, y: -terrain.height / 2 },
        { x: terrain.width / 2, y: -terrain.height / 2 },
        { x: terrain.width / 2, y: terrain.height / 2 },
        { x: -terrain.width / 2, y: terrain.height / 2 },
      ];

  for (let index = 0; index < corners.length; index += 1) {
    const edgeStart = corners[index];
    const edgeEnd = corners[(index + 1) % corners.length];

    if (segmentsIntersect(localStart, localEnd, edgeStart, edgeEnd)) {
      return true;
    }
  }

  return false;
}

function lineBlockedByTerrain(start, end) {
  const currentMap = getCurrentMap();
  return currentMap.terrain.some((terrain) => segmentIntersectsTerrain(start, end, terrain));
}

function isPointInsideTerrain(point, terrain) {
  return pointInsideTerrain(toTerrainLocalPoint(point, terrain), terrain);
}

function getUnitPerimeterPoints(unit, sampleCount = 24) {
  const radius = unit.sizeUm / 2;
  const points = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const angle = (index / sampleCount) * Math.PI * 2;
    points.push({
      x: unit.x + Math.cos(angle) * radius,
      y: unit.y + Math.sin(angle) * radius,
    });
  }

  return points;
}

function getUnitTerrainState(unit, terrain) {
  const perimeter = getUnitPerimeterPoints(unit, 20);
  const centerInside = isPointInsideTerrain({ x: unit.x, y: unit.y }, terrain);
  const insideCount = perimeter.filter((point) => isPointInsideTerrain(point, terrain)).length;
  const fullyInside = centerInside && insideCount === perimeter.length;
  const partiallyInside = (centerInside || insideCount > 0) && !fullyInside;

  return { fullyInside, partiallyInside };
}

function getIgnoredTerrainsForSource(unit) {
  const ignored = new Set();

  for (const terrain of getCurrentMap().terrain) {
    const state = getUnitTerrainState(unit, terrain);
    if (state.fullyInside) {
      ignored.add(terrain.id);
    }
  }

  return ignored;
}

function getIgnoredTerrainsForTarget(unit) {
  const ignored = new Set();

  for (const terrain of getCurrentMap().terrain) {
    const state = getUnitTerrainState(unit, terrain);
    if (state.fullyInside || state.partiallyInside) {
      ignored.add(terrain.id);
    }
  }

  return ignored;
}

function lineBlockedByTerrainWithIgnores(start, end, ignoredTerrainIds) {
  return getCurrentMap().terrain.some((terrain) => {
    if (ignoredTerrainIds.has(terrain.id)) {
      return false;
    }
    return segmentIntersectsTerrain(start, end, terrain);
  });
}

function createUnitPerimeterPoints(unit, angleOffset = 0, sampleCount = 24) {
  const radius = unit.sizeUm / 2;
  const points = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const angle = angleOffset + (index / sampleCount) * Math.PI * 2;
    points.push({
      x: unit.x + Math.cos(angle) * radius,
      y: unit.y + Math.sin(angle) * radius,
    });
  }

  return points;
}

function findLineOfSightPath(a, b, ignoredTerrainIds = new Set()) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const centerDistance = Math.hypot(dx, dy);

  if (centerDistance === 0) {
    return null;
  }

  const unitVectorX = dx / centerDistance;
  const unitVectorY = dy / centerDistance;
  const aRadius = a.sizeUm / 2;
  const bRadius = b.sizeUm / 2;
  const nearestStart = {
    x: a.x + unitVectorX * aRadius,
    y: a.y + unitVectorY * aRadius,
  };
  const nearestEnd = {
    x: b.x - unitVectorX * bRadius,
    y: b.y - unitVectorY * bRadius,
  };

  if (!lineBlockedByTerrainWithIgnores(nearestStart, nearestEnd, ignoredTerrainIds)) {
    return { start: nearestStart, end: nearestEnd, blocked: false };
  }

  const axisAngle = Math.atan2(dy, dx);
  const aCandidates = createUnitPerimeterPoints(a, axisAngle);
  const bCandidates = createUnitPerimeterPoints(b, axisAngle + Math.PI);

  const candidatePairs = [];
  for (const start of aCandidates) {
    for (const end of bCandidates) {
      candidatePairs.push({
        start,
        end,
        score: Math.hypot(end.x - start.x, end.y - start.y),
      });
    }
  }

  candidatePairs.sort((left, right) => left.score - right.score);

  for (const candidate of candidatePairs) {
    if (!lineBlockedByTerrainWithIgnores(candidate.start, candidate.end, ignoredTerrainIds)) {
      return { ...candidate, blocked: false };
    }
  }

  return { start: nearestStart, end: nearestEnd, blocked: true };
}

function getLineOfSightIgnores(sourceUnit, targetUnit) {
  return new Set([
    ...getIgnoredTerrainsForSource(sourceUnit),
    ...getIgnoredTerrainsForTarget(targetUnit),
  ]);
}

function updateSelectionPanel() {
  const selectedUnits = state.selectedUnitIds
    .map((id) => state.units.find((unit) => unit.id === id))
    .filter(Boolean);

  if (selectedUnits.length === 0) {
    elements.selectionDetails.className = "selection-empty";
    elements.selectionDetails.textContent =
      "Selecciona una o dos peanas para ver datos y la linea de vision.";
    return;
  }

  const description = selectedUnits
    .map((unit) => {
      const side = unit.team === "blue" ? "Azul" : "Rojo";
      return `${unit.name} · ${side} · ${unit.sizeMm} mm · (${unit.x.toFixed(1)}, ${unit.y.toFixed(1)}) um`;
    })
    .join("\n");

  if (selectedUnits.length < 2) {
    elements.selectionDetails.className = "";
    elements.selectionDetails.textContent = description;
    return;
  }

  const [a, b] = selectedUnits;
  const distance = Math.hypot(b.x - a.x, b.y - a.y);
  const edgeToEdge = Math.max(distance - a.sizeUm / 2 - b.sizeUm / 2, 0);
  const aToBVisible = !findLineOfSightPath(a, b, getLineOfSightIgnores(a, b))?.blocked;
  const bToAVisible = !findLineOfSightPath(b, a, getLineOfSightIgnores(b, a))?.blocked;

  elements.selectionDetails.className = "";
  elements.selectionDetails.textContent =
    `${description}\nCentro a centro: ${formatDistance(distance)}\nBorde a borde: ${formatDistance(edgeToEdge)}\n` +
    `${a.name} ve a ${b.name}: ${aToBVisible ? "si" : "no"}\n` +
    `${b.name} ve a ${a.name}: ${bToAVisible ? "si" : "no"}`;
}

function updateLosLine() {
  const selectedUnits = state.selectedUnitIds
    .map((id) => state.units.find((unit) => unit.id === id))
    .filter(Boolean);

  if (selectedUnits.length !== 2 || selectedUnits.some((unit) => unit.mapId !== state.currentMapId)) {
    elements.losLine.style.opacity = "0";
    elements.losLabel.style.opacity = "0";
    elements.losLabelBg.style.opacity = "0";
    return;
  }

  const [a, b] = selectedUnits;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const centerDistance = Math.hypot(dx, dy);

  if (centerDistance === 0) {
    elements.losLine.style.opacity = "0";
    elements.losLabel.style.opacity = "0";
    elements.losLabelBg.style.opacity = "0";
    return;
  }

  const aRadius = a.sizeUm / 2;
  const bRadius = b.sizeUm / 2;
  const edgeDistance = Math.max(centerDistance - aRadius - bRadius, 0);
  const pathAToB = findLineOfSightPath(a, b, getLineOfSightIgnores(a, b));
  const pathBToA = findLineOfSightPath(b, a, getLineOfSightIgnores(b, a));
  const aToBVisible = pathAToB && !pathAToB.blocked;
  const bToAVisible = pathBToA && !pathBToA.blocked;
  const losPath = pathAToB && !pathAToB.blocked
    ? pathAToB
    : pathBToA && !pathBToA.blocked
      ? { start: pathBToA.end, end: pathBToA.start, blocked: false }
      : pathAToB;

  if (!losPath) {
    elements.losLine.style.opacity = "0";
    elements.losLabel.style.opacity = "0";
    elements.losLabelBg.style.opacity = "0";
    return;
  }

  const startX = losPath.start.x;
  const startY = losPath.start.y;
  const endX = losPath.end.x;
  const endY = losPath.end.y;
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const labelText = `${edgeDistance.toFixed(1)} um`;
  const blocked = !aToBVisible && !bToAVisible;

  let lineColor = "rgba(34, 34, 34, 0.98)";
  let labelStroke = "rgba(34, 34, 34, 0.65)";

  if (aToBVisible && bToAVisible) {
    lineColor = "rgba(58, 179, 87, 0.98)";
    labelStroke = "rgba(58, 179, 87, 0.65)";
  } else if (aToBVisible) {
    lineColor = a.team === "blue"
      ? "rgba(62, 142, 208, 0.98)"
      : "rgba(217, 84, 77, 0.98)";
    labelStroke = a.team === "blue"
      ? "rgba(62, 142, 208, 0.65)"
      : "rgba(217, 84, 77, 0.65)";
  } else if (bToAVisible) {
    lineColor = b.team === "blue"
      ? "rgba(62, 142, 208, 0.98)"
      : "rgba(217, 84, 77, 0.98)";
    labelStroke = b.team === "blue"
      ? "rgba(62, 142, 208, 0.65)"
      : "rgba(217, 84, 77, 0.65)";
  }

  elements.losLine.setAttribute("x1", startX);
  elements.losLine.setAttribute("y1", startY);
  elements.losLine.setAttribute("x2", endX);
  elements.losLine.setAttribute("y2", endY);
  elements.losLine.style.stroke = lineColor;

  elements.losLabel.textContent = labelText;
  elements.losLabel.setAttribute("x", midX);
  elements.losLabel.setAttribute("y", midY);

  const approxWidth = Math.max(labelText.length * 0.52, 3.2);
  const labelHeight = 1.4;
  elements.losLabelBg.setAttribute("x", `${midX - approxWidth / 2}`);
  elements.losLabelBg.setAttribute("y", `${midY - labelHeight * 0.72}`);
  elements.losLabelBg.setAttribute("width", `${approxWidth}`);
  elements.losLabelBg.setAttribute("height", `${labelHeight}`);
  elements.losLabelBg.style.stroke = labelStroke;

  elements.losLine.style.opacity = "1";
  elements.losLabel.style.opacity = "1";
  elements.losLabelBg.style.opacity = "1";
}

function toggleSelection(unitId) {
  if (state.selectedUnitIds.includes(unitId)) {
    state.selectedUnitIds = state.selectedUnitIds.filter((id) => id !== unitId);
  } else {
    state.selectedUnitIds = [...state.selectedUnitIds.slice(-1), unitId];
  }

  renderUnits();
}

function renderUnits() {
  elements.unitsLayer.replaceChildren();

  unitsForCurrentMap().forEach((unit) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `unit unit-${unit.team}`;
    if (state.selectedUnitIds.includes(unit.id)) {
      node.classList.add("selected");
    }

    node.dataset.unitId = unit.id;
    node.style.width = `${(unit.sizeUm / BOARD_WIDTH_UM) * 100}%`;
    node.style.left = `${(unit.x / BOARD_WIDTH_UM) * 100}%`;
    node.style.top = `${(unit.y / BOARD_HEIGHT_UM) * 100}%`;
    node.setAttribute("aria-label", `${unit.name}, ${unit.sizeMm} mm`);

    const label = document.createElement("span");
    label.className = "unit-label";
    label.textContent = unit.name;
    node.append(label);

    node.addEventListener("click", () => {
      if (state.suppressClick) {
        state.suppressClick = false;
        return;
      }

      toggleSelection(unit.id);
    });
    node.addEventListener("dblclick", () => deleteUnit(unit.id));
    attachDrag(node, unit.id);

    elements.unitsLayer.append(node);
  });

  updateLosLine();
  updateSelectionPanel();
}

function pointerToBoardUnits(event) {
  const rect = elements.board.getBoundingClientRect();
  const relativeX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const relativeY = clamp((event.clientY - rect.top) / rect.height, 0, 1);

  return {
    x: relativeX * BOARD_WIDTH_UM,
    y: relativeY * BOARD_HEIGHT_UM,
  };
}

function attachDrag(node, unitId) {
  node.addEventListener("pointerdown", (event) => {
    event.preventDefault();

    const unit = state.units.find((entry) => entry.id === unitId);
    if (!unit) {
      return;
    }

    const start = pointerToBoardUnits(event);
    state.drag = {
      unitId,
      pointerId: event.pointerId,
      offsetX: start.x - unit.x,
      offsetY: start.y - unit.y,
      moved: false,
    };
  });
}

function updateDraggedUnit(event) {
  if (!state.drag || event.pointerId !== state.drag.pointerId) {
    return;
  }

  const unit = state.units.find((entry) => entry.id === state.drag.unitId);
  if (!unit) {
    state.drag = null;
    return;
  }

  const point = pointerToBoardUnits(event);
  const radius = unit.sizeUm / 2;
  const nextX = clamp(point.x - state.drag.offsetX, radius, BOARD_WIDTH_UM - radius);
  const nextY = clamp(point.y - state.drag.offsetY, radius, BOARD_HEIGHT_UM - radius);

  if (Math.abs(nextX - unit.x) > 0.01 || Math.abs(nextY - unit.y) > 0.01) {
    state.drag.moved = true;
  }

  unit.x = nextX;
  unit.y = nextY;
  renderUnits();
}

function finishDrag(event) {
  if (!state.drag || event.pointerId !== state.drag.pointerId) {
    return;
  }

  state.suppressClick = state.drag.moved;
  state.drag = null;
}

function bindEvents() {
  elements.baseSize.addEventListener("input", setBaseSizeOutput);
  window.addEventListener("pointermove", updateDraggedUnit);
  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);
  window.addEventListener("resize", sizeBoardToFrame);
  elements.showTerrainOverlay.addEventListener("change", renderTerrainOverlay);
  elements.mapSelect.addEventListener("change", (event) => {
    state.currentMapId = event.target.value;
    renderBoard();
    renderUnits();
  });
  elements.addBlue.addEventListener("click", () => createUnit("blue"));
  elements.addRed.addEventListener("click", () => createUnit("red"));
  elements.clearSelection.addEventListener("click", () => {
    state.selectedUnitIds = [];
    renderUnits();
  });
}

function formatVisitCount(count) {
  return new Intl.NumberFormat("es-ES").format(count);
}

async function updateVisitorCounter() {
  if (!elements.visitorCount) {
    return;
  }

  if (window.location.protocol === "file:") {
    elements.visitorCount.textContent = "Contador activo al publicar";
    return;
  }

  try {
    const response = await fetch(VISITOR_COUNTER_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Visit counter request failed");
    }

    const payload = await response.json();
    if (payload.enabled && typeof payload.count === "number") {
      elements.visitorCount.textContent = `${formatVisitCount(payload.count)} visitas`;
    } else {
      elements.visitorCount.textContent = "Contador pendiente";
    }
  } catch {
    elements.visitorCount.textContent = "Contador pendiente";
  }
}

function setupSupportBanner() {
  if (!elements.supportBanner || !elements.dismissSupportBanner) {
    return;
  }

  let bannerDismissed = false;
  try {
    bannerDismissed = localStorage.getItem(SUPPORT_BANNER_STORAGE_KEY) === "true";
  } catch {
    bannerDismissed = false;
  }

  if (bannerDismissed) {
    elements.supportBanner.hidden = true;
    return;
  }

  elements.dismissSupportBanner.addEventListener("click", () => {
    try {
      localStorage.setItem(SUPPORT_BANNER_STORAGE_KEY, "true");
    } catch {
      // The dismissal still applies for the current page view.
    }
    elements.supportBanner.hidden = true;
  });
}

populateMapSelect();
setBaseSizeOutput();
bindEvents();
setupSupportBanner();
updateVisitorCounter();
boardResizeObserver = new ResizeObserver(sizeBoardToFrame);
boardResizeObserver.observe(elements.boardFrame);
renderBoard();
sizeBoardToFrame();
renderUnits();
