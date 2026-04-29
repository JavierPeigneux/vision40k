import { BOARD_HEIGHT_UM, BOARD_WIDTH_UM, mapConfigs } from "./map-configs.js";
import {
  formatMessage,
  getLocalizedMapName,
  getMessages,
  getPreferredLanguage,
  setPreferredLanguage,
} from "./i18n.js";

const MM_PER_INCH = 25.4;
const MIN_BASE_MM = 25;
const MAX_BASE_MM = 160;
const ROTATE_STEP_DEG = 15;

const UNIT_SHAPES = {
  round: {
    widthRatio: 1,
    heightRatio: 1,
    borderRadius: "50%",
    labelKey: "shapeRound",
  },
  rectangle: {
    widthRatio: null,
    heightRatio: null,
    borderRadius: "0%",
    labelKey: "shapeRectangle",
  },
  oval: {
    widthRatio: 1,
    heightRatio: 0.65,
    borderRadius: "50%",
    labelKey: "shapeOval",
  },
};

const state = {
  language: getPreferredLanguage(),
  currentMapId: mapConfigs[0].id,
  units: [],
  selectedUnitIds: [],
  nextUnitId: 1,
  drag: null,
  suppressClick: false,
};

const elements = {
  pageTitle: document.querySelector(".panel h1"),
  lede: document.querySelector(".lede"),
  supportBanner: document.querySelector("#support-banner"),
  supportKicker: document.querySelector(".support-kicker"),
  supportLink: document.querySelector(".support-link"),
  mapSelect: document.querySelector("#map-select"),
  mapLabel: document.querySelector('label[for="map-select"]'),
  mapHint: document.querySelector(".card .hint"),
  boardTitle: document.querySelector("#board-title"),
  boardEyebrow: document.querySelector(".board-header .eyebrow"),
  boardImage: document.querySelector("#board-image"),
  boardFrame: document.querySelector(".board-frame"),
  board: document.querySelector("#board"),
  terrainLayer: document.querySelector("#terrain-layer"),
  unitsLayer: document.querySelector("#units-layer"),
  baseSize: document.querySelector("#base-size"),
  baseSizeOutput: document.querySelector("#base-size-output"),
  baseWidth: document.querySelector("#base-width"),
  baseWidthOutput: document.querySelector("#base-width-output"),
  baseHeight: document.querySelector("#base-height"),
  baseHeightOutput: document.querySelector("#base-height-output"),
  baseShape: document.querySelector("#base-shape"),
  unitName: document.querySelector("#unit-name"),
  sizeLabel: document.querySelector('label[for="base-size"]'),
  shapeLabel: document.querySelector('label[for="base-shape"]'),
  widthLabel: document.querySelector('label[for="base-width"]'),
  heightLabel: document.querySelector('label[for="base-height"]'),
  singleDimensionBlock: document.querySelector("#base-single-dimension"),
  rectangleDimensionsBlock: document.querySelector("#base-rectangle-dimensions"),
  unitNameLabel: document.querySelector('label[for="unit-name"]'),
  addBlue: document.querySelector("#add-blue"),
  addRed: document.querySelector("#add-red"),
  showTerrainOverlay: document.querySelector("#show-terrain-overlay"),
  showTerrainOverlayLabel: document.querySelector('label[for="show-terrain-overlay"] span'),
  selectionDetails: document.querySelector("#selection-details"),
  clearSelection: document.querySelector("#clear-selection"),
  deleteSelected: document.querySelector("#delete-selected"),
  rotateSelectedLeft: document.querySelector("#rotate-selected-left"),
  rotateSelectedRight: document.querySelector("#rotate-selected-right"),
  mapConfigDetails: document.querySelector("#map-config-details"),
  sectionTitles: document.querySelectorAll(".section-title h2"),
  sectionSpan: document.querySelector(".card .section-title span"),
  controlItems: Array.from(document.querySelectorAll(".card.compact ul li")),
  losLine: document.querySelector("#los-line"),
  losLabel: document.querySelector("#los-label"),
  losLabelBg: document.querySelector("#los-label-bg"),
  languageOptions: Array.from(document.querySelectorAll("[data-language]")),
};

let boardResizeObserver;

function mmToBoardUnits(mm) {
  return mm / MM_PER_INCH;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRotation(angle) {
  let next = angle;
  while (next <= -180) next += 360;
  while (next > 180) next -= 360;
  return next;
}

function normalizeShape(shape) {
  if (shape === "rectangle" || shape === "square") return "rectangle";
  if (shape === "oval") return "oval";
  return "round";
}

function getShapeDefinition(shape) {
  return UNIT_SHAPES[normalizeShape(shape)];
}

function getUnitShape(unit) {
  return normalizeShape(unit.shape);
}

function getUnitRotation(unit) {
  return getUnitShape(unit) === "round" ? 0 : normalizeRotation(unit.rotation || 0);
}

function getUnitDimensions(unit) {
  const shape = getUnitShape(unit);
  const shapeDefinition = getShapeDefinition(shape);
  let widthMm;
  let heightMm;

  if (shape === "rectangle") {
    widthMm = unit.widthMm ?? unit.sizeMm ?? MIN_BASE_MM;
    heightMm = unit.heightMm ?? unit.sizeMm ?? MIN_BASE_MM;
  } else {
    widthMm = unit.sizeMm ?? MIN_BASE_MM;
    heightMm = shape === "oval" ? widthMm * shapeDefinition.heightRatio : widthMm;
  }

  const widthUm = mmToBoardUnits(widthMm);
  const heightUm = mmToBoardUnits(heightMm);

  return {
    shape,
    widthMm,
    heightMm,
    widthUm,
    heightUm,
    halfWidth: widthUm / 2,
    halfHeight: heightUm / 2,
    rotation: getUnitRotation(unit),
  };
}

function getAxisAlignedHalfExtents(unit) {
  const { halfWidth, halfHeight, rotation } = getUnitDimensions(unit);
  const angle = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));

  return {
    x: halfWidth * cos + halfHeight * sin,
    y: halfWidth * sin + halfHeight * cos,
  };
}

function clampUnitPosition(unit, x, y) {
  const extents = getAxisAlignedHalfExtents(unit);

  return {
    x: clamp(x, extents.x, BOARD_WIDTH_UM - extents.x),
    y: clamp(y, extents.y, BOARD_HEIGHT_UM - extents.y),
  };
}

function getBoundaryDistance(unit, worldAngleDegrees) {
  const { shape, halfWidth, halfHeight, rotation } = getUnitDimensions(unit);
  const localAngle = ((worldAngleDegrees - rotation) * Math.PI) / 180;
  const cos = Math.cos(localAngle);
  const sin = Math.sin(localAngle);

  if (shape === "oval") {
    return Math.sqrt((halfWidth * cos) ** 2 + (halfHeight * sin) ** 2);
  }

  if (shape === "rectangle") {
    return halfWidth * Math.abs(cos) + halfHeight * Math.abs(sin);
  }

  return halfWidth;
}

function getBoundaryPointToward(unit, dx, dy) {
  const worldAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const distance = getBoundaryDistance(unit, worldAngle);
  const radians = (worldAngle * Math.PI) / 180;

  return {
    x: unit.x + Math.cos(radians) * distance,
    y: unit.y + Math.sin(radians) * distance,
  };
}

function getCurrentMap() {
  return mapConfigs.find((map) => map.id === state.currentMapId) ?? mapConfigs[0];
}

function setBaseSizeOutput() {
  elements.baseSizeOutput.value = `${elements.baseSize.value} mm`;
}

function setRectangleDimensionOutputs() {
  if (elements.baseWidthOutput && elements.baseWidth) {
    elements.baseWidthOutput.value = `${elements.baseWidth.value} mm`;
  }

  if (elements.baseHeightOutput && elements.baseHeight) {
    elements.baseHeightOutput.value = `${elements.baseHeight.value} mm`;
  }
}

function updateBaseSizeLabel() {
  if (!elements.sizeLabel) {
    return;
  }

  const text = getText();
  const shape = normalizeShape(elements.baseShape?.value);
  if (shape === "round") {
    elements.sizeLabel.textContent = text.diameterLabel;
  } else if (shape === "oval") {
    elements.sizeLabel.textContent = text.lengthLabel;
  } else {
    elements.sizeLabel.textContent = text.widthLabel;
  }
}

function populateShapeSelect() {
  if (!elements.baseShape) {
    return;
  }

  const text = getText();
  const currentValue = normalizeShape(elements.baseShape.value || "round");
  const options = [
    ["round", text.shapeRound],
    ["rectangle", text.shapeRectangle],
    ["oval", text.shapeOval],
  ];

  elements.baseShape.replaceChildren();
  options.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    elements.baseShape.append(option);
  });

  elements.baseShape.value = currentValue;
}

function getShapeLabel(shape) {
  const text = getText();
  const normalized = normalizeShape(shape);

  if (normalized === "rectangle") {
    return text.shapeRectangle;
  }

  if (normalized === "oval") {
    return text.shapeOval;
  }

  return text.shapeRound;
}

function getUnitDimensionsLabel(unit) {
  const dimensions = getUnitDimensions(unit);
  const width = Math.round(dimensions.widthMm);
  const height = Math.round(dimensions.heightMm);

  if (dimensions.shape === "round") {
    return `${width} mm`;
  }

  return `${width} x ${height} mm`;
}

function updateDimensionVisibility() {
  const shape = normalizeShape(elements.baseShape?.value);
  const isRectangle = shape === "rectangle";

  if (elements.singleDimensionBlock) {
    elements.singleDimensionBlock.hidden = isRectangle;
    elements.singleDimensionBlock.classList.toggle("is-hidden", isRectangle);
  }

  if (elements.rectangleDimensionsBlock) {
    elements.rectangleDimensionsBlock.hidden = !isRectangle;
    elements.rectangleDimensionsBlock.classList.toggle("is-hidden", !isRectangle);
  }
}

function getText() {
  return getMessages(state.language).app;
}

function applyLanguage() {
  const text = getText();

  document.documentElement.lang = state.language;
  if (elements.pageTitle) elements.pageTitle.textContent = text.title;
  if (elements.lede) elements.lede.textContent = text.lede;
  if (elements.supportKicker) elements.supportKicker.textContent = text.supportKicker;
  if (elements.supportLink) elements.supportLink.textContent = text.supportLink;
  if (elements.supportBanner) elements.supportBanner.setAttribute("aria-label", text.supportKicker);
  if (elements.mapLabel) elements.mapLabel.textContent = text.mapLabel;
  if (elements.mapHint) elements.mapHint.textContent = text.mapHint;
  if (elements.shapeLabel) elements.shapeLabel.textContent = text.shapeLabel;
  if (elements.widthLabel) elements.widthLabel.textContent = text.widthLabel;
  if (elements.heightLabel) elements.heightLabel.textContent = text.heightLabel;
  if (elements.unitNameLabel) elements.unitNameLabel.textContent = text.unitNameLabel;
  if (elements.unitName) elements.unitName.placeholder = text.unitNamePlaceholder;
  populateShapeSelect();
  updateBaseSizeLabel();
  setRectangleDimensionOutputs();
  updateDimensionVisibility();
  if (elements.sectionTitles[0]) elements.sectionTitles[0].textContent = text.createBaseTitle;
  if (elements.sectionSpan) elements.sectionSpan.textContent = text.createBaseSpan;
  if (elements.sectionTitles[1]) elements.sectionTitles[1].textContent = text.selectionTitle;
  if (elements.addBlue) elements.addBlue.textContent = text.addBlue;
  if (elements.addRed) elements.addRed.textContent = text.addRed;
  if (elements.clearSelection) elements.clearSelection.textContent = text.clearSelection;
  if (elements.deleteSelected) elements.deleteSelected.textContent = text.deleteSelected;
  if (elements.rotateSelectedLeft) elements.rotateSelectedLeft.textContent = text.rotateSelectedLeft;
  if (elements.rotateSelectedRight) elements.rotateSelectedRight.textContent = text.rotateSelectedRight;
  if (elements.sectionTitles[2]) elements.sectionTitles[2].textContent = text.configTitle;
  if (elements.showTerrainOverlayLabel) elements.showTerrainOverlayLabel.textContent = text.showTerrainOverlay;
  if (elements.sectionTitles[3]) elements.sectionTitles[3].textContent = text.controlsTitle;
  if (elements.controlItems[0]) elements.controlItems[0].textContent = text.controlOne;
  if (elements.controlItems[1]) elements.controlItems[1].textContent = text.controlTwo;
  if (elements.controlItems[2]) elements.controlItems[2].textContent = text.controlThree;
  if (elements.controlItems[3]) elements.controlItems[3].textContent = text.controlFour;
  if (elements.boardEyebrow) elements.boardEyebrow.textContent = text.boardEyebrow;
  if (elements.boardImage) elements.boardImage.alt = text.boardAlt;
  if (elements.board) elements.board.setAttribute("aria-label", text.boardAriaLabel);
  elements.languageOptions.forEach((button) => {
    const language = button.dataset.language;
    const active = language === state.language;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function updateDocumentTitle() {
  const text = getText();
  const currentMap = getCurrentMap();
  document.title = `${text.title} · ${getLocalizedMapName(currentMap.name, state.language)}`;
}

function updateLanguage(nextLanguage) {
  state.language = setPreferredLanguage(nextLanguage);
  applyLanguage();
  populateMapSelect();
  updateDocumentTitle();
  updateMapConfigPanel();
  updateSelectionPanel();
  renderBoard();
}

function populateMapSelect() {
  elements.mapSelect.replaceChildren();
  mapConfigs.forEach((map) => {
    const option = document.createElement("option");
    option.value = map.id;
    option.textContent = getLocalizedMapName(map.name, state.language);
    elements.mapSelect.append(option);
  });
}

function updateMapConfigPanel() {
  const currentMap = getCurrentMap();
  const { boardRectPx, originalSizePx } = currentMap.image;
  const text = getText();

  elements.mapConfigDetails.textContent =
    `${formatMessage(text.mapConfigImage, originalSizePx)}\n` +
    `${formatMessage(text.mapConfigBoard, {
      x: boardRectPx.x,
      y: boardRectPx.y,
      w: boardRectPx.width,
      h: boardRectPx.height,
    })}\n` +
    `${formatMessage(text.mapConfigTerrain, { count: currentMap.terrain.length })}`;
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
  elements.boardTitle.textContent = getLocalizedMapName(currentMap.name, state.language);
  elements.mapSelect.value = currentMap.id;
  updateDocumentTitle();
  updateMapConfigPanel();
  renderTerrainOverlay();
}

function unitsForCurrentMap() {
  return state.units.filter((unit) => unit.mapId === state.currentMapId);
}

function createUnit(team) {
  const shape = normalizeShape(elements.baseShape?.value);
  const sizeMm = clamp(Number(elements.baseSize.value), MIN_BASE_MM, MAX_BASE_MM);
  const widthMm = shape === "rectangle"
    ? clamp(Number(elements.baseWidth?.value ?? sizeMm), MIN_BASE_MM, MAX_BASE_MM)
    : sizeMm;
  const heightMm = shape === "rectangle"
    ? clamp(Number(elements.baseHeight?.value ?? sizeMm), MIN_BASE_MM, MAX_BASE_MM)
    : shape === "oval"
      ? sizeMm * getShapeDefinition("oval").heightRatio
      : sizeMm;
  const rotation = 0;
  const text = getText();
  const defaultName =
    elements.unitName.value.trim() || formatMessage(text.baseDefaultName, { id: state.nextUnitId });
  const spawnX = team === "blue" ? 8 : BOARD_WIDTH_UM - 8;
  const spawnY = BOARD_HEIGHT_UM / 2;

  const unit = {
    id: `unit-${state.nextUnitId}`,
    mapId: state.currentMapId,
    team,
    name: defaultName,
    shape,
    rotation,
    sizeMm,
    widthMm,
    heightMm,
    sizeUm: mmToBoardUnits(widthMm),
    widthUm: mmToBoardUnits(widthMm),
    heightUm: mmToBoardUnits(heightMm),
    x: spawnX,
    y: spawnY,
  };

  const nextPosition = clampUnitPosition(unit, unit.x, unit.y);
  unit.x = nextPosition.x;
  unit.y = nextPosition.y;
  state.units.push(unit);
  state.nextUnitId += 1;
  renderUnits();
}

function deleteUnit(unitId) {
  state.units = state.units.filter((unit) => unit.id !== unitId);
  state.selectedUnitIds = state.selectedUnitIds.filter((id) => id !== unitId);
  renderUnits();
}

function rotateSelectedUnits(deltaDegrees) {
  const selectedUnits = state.selectedUnitIds
    .map((id) => state.units.find((unit) => unit.id === id))
    .filter(Boolean);

  if (selectedUnits.length === 0) {
    return;
  }

  selectedUnits.forEach((unit) => {
    if (getUnitShape(unit) === "round") {
      return;
    }

    unit.rotation = normalizeRotation((unit.rotation || 0) + deltaDegrees);
    const clamped = clampUnitPosition(unit, unit.x, unit.y);
    unit.x = clamped.x;
    unit.y = clamped.y;
  });

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
  const { shape, halfWidth, halfHeight, rotation } = getUnitDimensions(unit);
  const points = [];

  if (shape === "rectangle") {
    const perSide = Math.max(2, Math.floor(sampleCount / 4));
    const samples = perSide - 1 || 1;

    for (let index = 0; index < perSide; index += 1) {
      const t = samples === 0 ? 0 : (index / samples) * 2 - 1;
      points.push({ x: t * halfWidth, y: -halfHeight });
      points.push({ x: halfWidth, y: t * halfHeight });
      points.push({ x: t * halfWidth, y: halfHeight });
      points.push({ x: -halfWidth, y: t * halfHeight });
    }

    return points.map((point) => {
      const rotated = rotatePoint(point, rotation);
      return {
        x: unit.x + rotated.x,
        y: unit.y + rotated.y,
      };
    });
  }

  for (let index = 0; index < sampleCount; index += 1) {
    const angle = (index / sampleCount) * Math.PI * 2;
    const localX = Math.cos(angle) * halfWidth;
    const localY = shape === "oval" ? Math.sin(angle) * halfHeight : Math.sin(angle) * halfWidth;
    const rotated = rotatePoint({ x: localX, y: localY }, rotation);
    points.push({
      x: unit.x + rotated.x,
      y: unit.y + rotated.y,
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
  return getUnitPerimeterPoints(unit, sampleCount);
}

function findLineOfSightPath(a, b, ignoredTerrainIds = new Set()) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const centerDistance = Math.hypot(dx, dy);

  if (centerDistance === 0) {
    return null;
  }

  const nearestStart = getBoundaryPointToward(a, dx, dy);
  const nearestEnd = getBoundaryPointToward(b, -dx, -dy);

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
  const text = getText();
  const selectedUnits = state.selectedUnitIds
    .map((id) => state.units.find((unit) => unit.id === id))
    .filter(Boolean);
  const hasUnits = selectedUnits.length > 0;
  const hasRotatableUnits = selectedUnits.some((unit) => getUnitShape(unit) !== "round");

  if (elements.deleteSelected) {
    elements.deleteSelected.disabled = !hasUnits;
  }

  if (elements.rotateSelectedLeft) {
    elements.rotateSelectedLeft.disabled = !hasRotatableUnits;
  }

  if (elements.rotateSelectedRight) {
    elements.rotateSelectedRight.disabled = !hasRotatableUnits;
  }

  if (!hasUnits) {
    elements.selectionDetails.className = "selection-empty";
    elements.selectionDetails.textContent = text.selectionEmpty;
    return;
  }

  const description = selectedUnits
    .map((unit) => {
      const side = unit.team === "blue" ? text.sideBlue : text.sideRed;
      const shape = getShapeLabel(unit.shape);
      const rotation = getUnitShape(unit) === "round" ? 0 : normalizeRotation(unit.rotation || 0);
      return formatMessage(text.selectionUnit, {
        name: unit.name,
        shape,
        side,
        dimensions: getUnitDimensionsLabel(unit),
        rotation,
        x: unit.x.toFixed(1),
        y: unit.y.toFixed(1),
      });
    })
    .join("\n");

  if (selectedUnits.length < 2) {
    elements.selectionDetails.className = "";
    elements.selectionDetails.textContent = description;
    return;
  }

  const [a, b] = selectedUnits;
  const distance = Math.hypot(b.x - a.x, b.y - a.y);
  const angleToB = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const edgeToEdge = Math.max(
    distance - getBoundaryDistance(a, angleToB) - getBoundaryDistance(b, angleToB + 180),
    0,
  );
  const aToBVisible = !findLineOfSightPath(a, b, getLineOfSightIgnores(a, b))?.blocked;
  const bToAVisible = !findLineOfSightPath(b, a, getLineOfSightIgnores(b, a))?.blocked;
  const visibleTextA = aToBVisible ? text.yes : text.no;
  const visibleTextB = bToAVisible ? text.yes : text.no;

  elements.selectionDetails.className = "";
  elements.selectionDetails.textContent =
    `${description}\n${formatMessage(text.selectionCenter, { distance: formatDistance(distance) })}\n${formatMessage(text.selectionEdge, { distance: formatDistance(edgeToEdge) })}\n` +
    `${formatMessage(text.selectionSees, { from: a.name, to: b.name, visible: visibleTextA })}\n` +
    `${formatMessage(text.selectionSees, { from: b.name, to: a.name, visible: visibleTextB })}`;
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

  const angleToB = (Math.atan2(dy, dx) * 180) / Math.PI;
  const edgeDistance = Math.max(
    centerDistance - getBoundaryDistance(a, angleToB) - getBoundaryDistance(b, angleToB + 180),
    0,
  );
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
    const dimensions = getUnitDimensions(unit);
    const node = document.createElement("button");
    node.type = "button";
    node.className = `unit unit-${unit.team} unit-${dimensions.shape}`;
    if (state.selectedUnitIds.includes(unit.id)) {
      node.classList.add("selected");
    }

    node.dataset.unitId = unit.id;
    node.dataset.shape = dimensions.shape;
    node.style.width = `${(dimensions.widthUm / BOARD_WIDTH_UM) * 100}%`;
    node.style.height = `${(dimensions.heightUm / BOARD_HEIGHT_UM) * 100}%`;
    node.style.left = `${(unit.x / BOARD_WIDTH_UM) * 100}%`;
    node.style.top = `${(unit.y / BOARD_HEIGHT_UM) * 100}%`;
    node.style.transform = `translate(-50%, -50%) rotate(${dimensions.rotation}deg)`;
    node.style.borderRadius = getShapeDefinition(dimensions.shape).borderRadius;
    node.setAttribute(
      "aria-label",
      `${unit.name}, ${getShapeLabel(unit.shape)}, ${getUnitDimensionsLabel(unit)}, ${dimensions.rotation}°`,
    );

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
  const nextPoint = clampUnitPosition(
    unit,
    point.x - state.drag.offsetX,
    point.y - state.drag.offsetY,
  );

  if (Math.abs(nextPoint.x - unit.x) > 0.01 || Math.abs(nextPoint.y - unit.y) > 0.01) {
    state.drag.moved = true;
  }

  unit.x = nextPoint.x;
  unit.y = nextPoint.y;
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
  if (elements.baseWidth) {
    elements.baseWidth.addEventListener("input", setRectangleDimensionOutputs);
  }
  if (elements.baseHeight) {
    elements.baseHeight.addEventListener("input", setRectangleDimensionOutputs);
  }
  if (elements.baseShape) {
    elements.baseShape.addEventListener("change", () => {
      updateBaseSizeLabel();
      updateDimensionVisibility();
      setRectangleDimensionOutputs();
      renderUnits();
    });
  }
  window.addEventListener("pointermove", updateDraggedUnit);
  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);
  window.addEventListener("resize", sizeBoardToFrame);
  elements.showTerrainOverlay.addEventListener("change", renderTerrainOverlay);
  elements.languageOptions.forEach((button) => {
    button.addEventListener("click", () => {
      updateLanguage(button.dataset.language);
    });
  });
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
  elements.deleteSelected.addEventListener("click", () => {
    if (state.selectedUnitIds.length === 0) {
      return;
    }

    const selectedIds = new Set(state.selectedUnitIds);
    state.units = state.units.filter((unit) => !selectedIds.has(unit.id));
    state.selectedUnitIds = [];
    renderUnits();
  });
  if (elements.rotateSelectedLeft) {
    elements.rotateSelectedLeft.addEventListener("click", () => rotateSelectedUnits(-ROTATE_STEP_DEG));
  }
  if (elements.rotateSelectedRight) {
    elements.rotateSelectedRight.addEventListener("click", () => rotateSelectedUnits(ROTATE_STEP_DEG));
  }
}

populateMapSelect();
populateShapeSelect();
setBaseSizeOutput();
setRectangleDimensionOutputs();
updateBaseSizeLabel();
updateDimensionVisibility();
applyLanguage();
bindEvents();
boardResizeObserver = new ResizeObserver(sizeBoardToFrame);
boardResizeObserver.observe(elements.boardFrame);
renderBoard();
sizeBoardToFrame();
renderUnits();
