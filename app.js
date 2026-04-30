import { BOARD_HEIGHT_UM, BOARD_WIDTH_UM, mapConfigs } from "./map-configs.js?v=20260430-5";
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
const VISION_CELL_SIZE_UM = 0.75;
const DEFAULT_VISION_RANGE_UM = 24;

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
  boardOrientation: "normal",
  visionFromRangeUm: DEFAULT_VISION_RANGE_UM,
  visionFromUnitId: null,
  visionToRangeUm: DEFAULT_VISION_RANGE_UM,
  visionToUnitId: null,
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
  boardOrientationNormal: document.querySelector("#board-orientation-normal"),
  boardOrientationRotated: document.querySelector("#board-orientation-rotated"),
  terrainLayer: document.querySelector("#terrain-layer"),
  visionLayer: document.querySelector("#vision-layer"),
  visionToLayer: document.querySelector("#vision-to-layer"),
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
  visionRange: document.querySelector("#vision-range"),
  visionToRange: document.querySelector("#vision-to-range"),
  visionFrom: document.querySelector("#vision-from"),
  visionTo: document.querySelector("#vision-to"),
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
const boardImageCache = new Map();
let boardImageBufferCanvas = document.createElement("canvas");
let boardImageBufferContext = boardImageBufferCanvas.getContext("2d");

function mmToBoardUnits(mm) {
  return mm / MM_PER_INCH;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isBoardRotated() {
  return state.boardOrientation === "rotated";
}

function getViewBoardDimensions() {
  return isBoardRotated()
    ? { width: BOARD_HEIGHT_UM, height: BOARD_WIDTH_UM }
    : { width: BOARD_WIDTH_UM, height: BOARD_HEIGHT_UM };
}

function transformPointToView(point) {
  if (!isBoardRotated()) {
    return { x: point.x, y: point.y };
  }

  return {
    x: BOARD_HEIGHT_UM - point.y,
    y: point.x,
  };
}

function transformPointToWorld(point) {
  if (!isBoardRotated()) {
    return { x: point.x, y: point.y };
  }

  return {
    x: point.y,
    y: BOARD_HEIGHT_UM - point.x,
  };
}

function transformRotationDegrees(rotation) {
  return isBoardRotated() ? normalizeRotation(rotation + 90) : normalizeRotation(rotation);
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

function getBoardSourceImage(src) {
  let image = boardImageCache.get(src);

  if (!image) {
    image = new Image();
    image.src = src;
    boardImageCache.set(src, image);
  }

  return image;
}

function resizeBoardCanvas() {
  if (!elements.boardImage) {
    return { width: 0, height: 0 };
  }

  const rect = elements.board.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  if (elements.boardImage.width !== width) {
    elements.boardImage.width = width;
  }

  if (elements.boardImage.height !== height) {
    elements.boardImage.height = height;
  }

  return { width, height };
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

function syncVisionRangeInput(inputElement, stateKey) {
  if (!inputElement || !stateKey) {
    return;
  }

  const numericValue = Number(inputElement.value);
  const clampedValue = clamp(
    Number.isFinite(numericValue) ? numericValue : DEFAULT_VISION_RANGE_UM,
    Number(inputElement.min) || 1,
    Number(inputElement.max) || 60,
  );

  state[stateKey] = clampedValue;
  inputElement.value = `${clampedValue}`;
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

function getUnitSummaryParts(unit, text) {
  const dimensions = getUnitDimensionsLabel(unit);
  const rotation = getUnitShape(unit) === "round" ? 0 : normalizeRotation(unit.rotation || 0);
  const parts = [];

  if (unit.name?.trim()) {
    parts.push(unit.name.trim());
  }

  parts.push(getShapeLabel(unit.shape));
  parts.push(unit.team === "blue" ? text.sideBlue : text.sideRed);
  parts.push(dimensions);
  parts.push(`${rotation}°`);
  parts.push(`(${unit.x.toFixed(1)}, ${unit.y.toFixed(1)}) um`);

  return parts;
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

function updateBoardOrientationUI() {
  const rotated = isBoardRotated();
  if (elements.boardOrientationNormal) {
    elements.boardOrientationNormal.classList.toggle("is-active", !rotated);
    elements.boardOrientationNormal.setAttribute("aria-pressed", rotated ? "false" : "true");
  }
  if (elements.boardOrientationRotated) {
    elements.boardOrientationRotated.classList.toggle("is-active", rotated);
    elements.boardOrientationRotated.setAttribute("aria-pressed", rotated ? "true" : "false");
  }
}

function setBoardOrientation(orientation) {
  state.boardOrientation = orientation === "rotated" ? "rotated" : "normal";
  updateBoardOrientationUI();
  sizeBoardToFrame();
  renderBoard();
  renderUnits();
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
  if (elements.visionFrom) elements.visionFrom.textContent = text.visionFrom;
  if (elements.visionTo) elements.visionTo.textContent = text.visionTo;
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
    const viewPoint = transformPointToView({ x: piece.x, y: piece.y });
    group.setAttribute(
      "transform",
      `translate(${viewPoint.x} ${viewPoint.y}) rotate(${transformRotationDegrees(piece.rotation || 0)})`,
    );

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

  const { width: viewBoardWidth, height: viewBoardHeight } = getViewBoardDimensions();
  const boardRatio = viewBoardWidth / viewBoardHeight;
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
  const { boardRectPx, src } = currentMap.image;
  const { width: viewBoardWidth, height: viewBoardHeight } = getViewBoardDimensions();
  const rotated = isBoardRotated();
  const svgViewBox = rotated ? `0 0 ${BOARD_HEIGHT_UM} ${BOARD_WIDTH_UM}` : `0 0 ${BOARD_WIDTH_UM} ${BOARD_HEIGHT_UM}`;
  const visibleSize = resizeBoardCanvas();
  const sourceImage = getBoardSourceImage(src);
  const drawSource = () => {
    if (!sourceImage.complete || sourceImage.naturalWidth === 0) {
      return false;
    }

    const sourceWidth = boardRectPx.width;
    const sourceHeight = boardRectPx.height;
    const bufferWidth = rotated ? sourceHeight : sourceWidth;
    const bufferHeight = rotated ? sourceWidth : sourceHeight;

    if (boardImageBufferCanvas.width !== bufferWidth) {
      boardImageBufferCanvas.width = bufferWidth;
    }
    if (boardImageBufferCanvas.height !== bufferHeight) {
      boardImageBufferCanvas.height = bufferHeight;
    }

    boardImageBufferContext.setTransform(1, 0, 0, 1, 0, 0);
    boardImageBufferContext.clearRect(0, 0, bufferWidth, bufferHeight);

    if (rotated) {
      boardImageBufferContext.setTransform(0, 1, -1, 0, sourceHeight, 0);
      boardImageBufferContext.drawImage(
        sourceImage,
        boardRectPx.x,
        boardRectPx.y,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight,
      );
    } else {
      boardImageBufferContext.drawImage(
        sourceImage,
        boardRectPx.x,
        boardRectPx.y,
        sourceWidth,
        sourceHeight,
        0,
        0,
        bufferWidth,
        bufferHeight,
      );
    }

    const boardImageContext = elements.boardImage.getContext("2d");
    if (boardImageContext) {
      boardImageContext.setTransform(1, 0, 0, 1, 0, 0);
      boardImageContext.clearRect(0, 0, visibleSize.width, visibleSize.height);
      boardImageContext.drawImage(
        boardImageBufferCanvas,
        0,
        0,
        bufferWidth,
        bufferHeight,
        0,
        0,
        visibleSize.width,
        visibleSize.height,
      );
    }

    return true;
  };

  if (!drawSource()) {
    sourceImage.onload = () => {
      renderBoard();
    };
  }
  const visionWidth = Math.max(1, Math.ceil(viewBoardWidth / VISION_CELL_SIZE_UM));
  const visionHeight = Math.max(1, Math.ceil(viewBoardHeight / VISION_CELL_SIZE_UM));

  [elements.visionLayer, elements.visionToLayer].forEach((canvas) => {
    if (!canvas) {
      return;
    }

    if (canvas.width !== visionWidth) {
      canvas.width = visionWidth;
    }

    if (canvas.height !== visionHeight) {
      canvas.height = visionHeight;
    }
  });
  elements.board.style.aspectRatio = `${viewBoardWidth} / ${viewBoardHeight}`;
  if (elements.terrainLayer) {
    elements.terrainLayer.setAttribute("viewBox", svgViewBox);
  }
  if (elements.losLine?.ownerSVGElement) {
    elements.losLine.ownerSVGElement.setAttribute("viewBox", svgViewBox);
  }
  elements.boardTitle.textContent = getLocalizedMapName(currentMap.name, state.language);
  elements.mapSelect.value = currentMap.id;
  updateDocumentTitle();
  updateMapConfigPanel();
  renderTerrainOverlay();
  renderVisionOverlays();
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
  const unitName = elements.unitName.value.trim();
  const spawnX = team === "blue" ? 8 : BOARD_WIDTH_UM - 8;
  const spawnY = BOARD_HEIGHT_UM / 2;

  const unit = {
    id: `unit-${state.nextUnitId}`,
    mapId: state.currentMapId,
    team,
    name: unitName,
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

function lineBlockedByTerrainForVision(start, end, ignoredTerrainIds = new Set()) {
  return getCurrentMap().terrain.some((terrain) => {
    if (ignoredTerrainIds.has(terrain.id)) {
      return false;
    }

    const startInside = isPointInsideTerrain(start, terrain);
    const endInside = isPointInsideTerrain(end, terrain);

    if (startInside && endInside) {
      return false;
    }

    if (startInside && !endInside) {
      return true;
    }

    if (!startInside && endInside) {
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

function getSelectedUnits() {
  return state.selectedUnitIds
    .map((id) => state.units.find((unit) => unit.id === id))
    .filter(Boolean);
}

function getTerrainBoundaryPointsInView(terrain) {
  const localPoints = terrain.polygon?.length >= 3
    ? terrain.polygon
    : [
        { x: -terrain.width / 2, y: -terrain.height / 2 },
        { x: terrain.width / 2, y: -terrain.height / 2 },
        { x: terrain.width / 2, y: terrain.height / 2 },
        { x: -terrain.width / 2, y: terrain.height / 2 },
      ];

  return localPoints.map((point) => {
    const rotated = rotatePoint(point, terrain.rotation || 0);
    return transformPointToView({
      x: terrain.x + rotated.x,
      y: terrain.y + rotated.y,
    });
  });
}

function getVisionAnchorPoints(unit) {
  const { shape, halfWidth, halfHeight, rotation } = getUnitDimensions(unit);
  const points = shape === "rectangle"
    ? [
        { x: 0, y: -halfHeight },
        { x: -halfWidth, y: 0 },
        { x: halfWidth, y: 0 },
        { x: 0, y: halfHeight },
      ]
    : [
        { x: 0, y: -halfHeight },
        { x: -halfWidth, y: 0 },
        { x: halfWidth, y: 0 },
        { x: 0, y: halfHeight },
      ];

  return points.map((point) => {
    const rotated = rotatePoint(point, rotation);
    return {
      x: unit.x + rotated.x,
      y: unit.y + rotated.y,
    };
  });
}

function getTerrainRayIntersections(origin, angle, terrain) {
  const points = terrain.polygon?.length >= 3
    ? terrain.polygon
    : [
        { x: -terrain.width / 2, y: -terrain.height / 2 },
        { x: terrain.width / 2, y: -terrain.height / 2 },
        { x: terrain.width / 2, y: terrain.height / 2 },
        { x: -terrain.width / 2, y: terrain.height / 2 },
      ];
  const viewPoints = points.map((point) => {
    const rotated = rotatePoint(point, terrain.rotation || 0);
    return transformPointToView({
      x: terrain.x + rotated.x,
      y: terrain.y + rotated.y,
    });
  });

  const intersections = [];
  for (let index = 0; index < viewPoints.length; index += 1) {
    const a = viewPoints[index];
    const b = viewPoints[(index + 1) % viewPoints.length];
    const hit = raySegmentIntersection(origin, angle, a, b);
    if (hit) {
      intersections.push(hit);
    }
  }

  intersections.sort((left, right) => left.distance - right.distance);
  return intersections;
}

function getBoardCornersInView() {
  const { width, height } = getViewBoardDimensions();
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
}

function getBoardEdgesInView() {
  const corners = getBoardCornersInView();
  return corners.map((point, index) => [point, corners[(index + 1) % corners.length]]);
}

function getTerrainEdgesInView() {
  return getCurrentMap().terrain.flatMap((terrain) => {
    const points = getTerrainBoundaryPointsInView(terrain);
    return points.map((point, index) => ({
      terrainId: terrain.id,
      a: point,
      b: points[(index + 1) % points.length],
    }));
  });
}

function raySegmentIntersection(origin, angle, a, b) {
  const rayDirection = {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
  const segmentDirection = {
    x: b.x - a.x,
    y: b.y - a.y,
  };
  const denominator = rayDirection.x * segmentDirection.y - rayDirection.y * segmentDirection.x;
  const epsilon = 1e-9;

  if (Math.abs(denominator) < epsilon) {
    return null;
  }

  const originToA = {
    x: a.x - origin.x,
    y: a.y - origin.y,
  };
  const t = (originToA.x * segmentDirection.y - originToA.y * segmentDirection.x) / denominator;
  const u = (originToA.x * rayDirection.y - originToA.y * rayDirection.x) / denominator;

  if (t < 0 || u < 0 || u > 1) {
    return null;
  }

  return {
    x: origin.x + rayDirection.x * t,
    y: origin.y + rayDirection.y * t,
    distance: t,
  };
}

function findRayHit(origin, angle, ignoredTerrainIds = new Set()) {
  const candidates = [];
  const boardEdges = getBoardEdgesInView();

  boardEdges.forEach(([a, b]) => {
    const hit = raySegmentIntersection(origin, angle, a, b);
    if (hit) {
      candidates.push(hit);
    }
  });

  const terrainHits = [];
  getCurrentMap().terrain.forEach((terrain) => {
    if (ignoredTerrainIds.has(terrain.id)) {
      return;
    }

    const intersections = getTerrainRayIntersections(origin, angle, terrain);
    if (intersections.length === 0) {
      return;
    }

    const inside = isPointInsideTerrain(transformPointToWorld(origin), terrain);
    const entry = inside ? intersections[0] : intersections[0];
    const exit = inside ? intersections.find((hit) => hit.distance > 1e-6) ?? intersections[0] : intersections[1] ?? intersections[0];
    terrainHits.push({
      terrainId: terrain.id,
      entryDistance: entry.distance,
      hit: exit,
    });
  });

  terrainHits.sort((left, right) => left.entryDistance - right.entryDistance);

  if (terrainHits.length > 0) {
    candidates.push(terrainHits[0].hit);
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => left.distance - right.distance);
  return candidates[0];
}

function pointKey(point) {
  return `${point.x.toFixed(3)}:${point.y.toFixed(3)}`;
}

function computeVisionPolygon(unit) {
  const sourcePoints = getVisionAnchorPoints(unit).map((point) => transformPointToView(point));
  const sampleTargets = [
    ...getBoardCornersInView(),
    ...getCurrentMap().terrain.flatMap(getTerrainBoundaryPointsInView),
  ];
  const epsilon = 1e-4;
  const rays = [];

  sourcePoints.forEach((source) => {
    sampleTargets.forEach((point) => {
      const angle = Math.atan2(point.y - source.y, point.x - source.x);
      rays.push({
        origin: source,
        angle: angle - epsilon,
      });
      rays.push({
        origin: source,
        angle,
      });
      rays.push({
        origin: source,
        angle: angle + epsilon,
      });
    });
  });

  const center = transformPointToView({ x: unit.x, y: unit.y });
  const hitsByAngle = new Map();

  rays
    .map(({ origin, angle }) => {
      const hit = findRayHit(origin, angle, new Set());
      return hit ? { ...hit, angle: Math.atan2(hit.y - center.y, hit.x - center.x) } : null;
    })
    .filter(Boolean)
    .forEach((hit) => {
      const angleKey = pointKey({ x: Math.cos(hit.angle), y: Math.sin(hit.angle) });
      const existing = hitsByAngle.get(angleKey);
      const distance = Math.hypot(hit.x - center.x, hit.y - center.y);

      if (!existing || distance > existing.distance) {
        hitsByAngle.set(angleKey, { ...hit, distance });
      }
    });

  const polygon = [];
  Array.from(hitsByAngle.values())
    .sort((left, right) => left.angle - right.angle)
    .forEach((hit) => {
      polygon.push({ x: hit.x, y: hit.y });
    });

  return polygon;
}

function updateVisionButton(button, activeUnitId, selectedUnit, label) {
  if (!button) {
    return;
  }

  const enabled = Boolean(selectedUnit);
  button.disabled = !enabled;
  button.classList.toggle("is-active", Boolean(enabled && activeUnitId === selectedUnit.id));
  button.setAttribute("aria-pressed", enabled && activeUnitId === selectedUnit.id ? "true" : "false");
  if (label) {
    button.textContent = label;
  }
}

function renderVisionOverlay(canvas, selectedUnit, activeUnitId, rangeUm, color, mode) {
  const context = canvas?.getContext("2d");
  const { width: viewWidth, height: viewHeight } = getViewBoardDimensions();
  const columns = Math.max(1, Math.ceil(viewWidth / VISION_CELL_SIZE_UM));
  const rows = Math.max(1, Math.ceil(viewHeight / VISION_CELL_SIZE_UM));

  if (!canvas || !context) {
    return;
  }

  if (canvas.width !== columns) {
    canvas.width = columns;
  }

  if (canvas.height !== rows) {
    canvas.height = rows;
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, columns, rows);

  if (!selectedUnit || activeUnitId !== selectedUnit.id) {
    canvas.classList.remove("is-visible");
    return;
  }

  const anchorPoints = getVisionAnchorPoints(selectedUnit);
  const ignoredTerrainIds = getIgnoredTerrainsForSource(selectedUnit);
  const maxDistance = Math.max(0, Number(rangeUm) || 0);
  const cellWidth = viewWidth / columns;
  const cellHeight = viewHeight / rows;

  context.fillStyle = color;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const viewPoint = {
        x: (column + 0.5) * cellWidth,
        y: (row + 0.5) * cellHeight,
      };
      const worldPoint = transformPointToWorld(viewPoint);

      const visible = mode === "to"
        ? anchorPoints.some((targetPoint) => {
            if (Math.hypot(worldPoint.x - targetPoint.x, worldPoint.y - targetPoint.y) > maxDistance) {
              return false;
            }

            return !lineBlockedByTerrainForVision(worldPoint, targetPoint, ignoredTerrainIds);
          })
        : anchorPoints.some((sourcePoint) => {
            if (Math.hypot(worldPoint.x - sourcePoint.x, worldPoint.y - sourcePoint.y) > maxDistance) {
              return false;
            }

            return !lineBlockedByTerrainForVision(sourcePoint, worldPoint, ignoredTerrainIds);
          });

      if (visible) {
        context.fillRect(column, row, 1, 1);
      }
    }
  }

  canvas.classList.add("is-visible");
}

function renderVisionOverlays() {
  const selectedUnits = getSelectedUnits();
  const selectedUnit = selectedUnits.length === 1 ? selectedUnits[0] : null;

  renderVisionOverlay(
    elements.visionLayer,
    selectedUnit,
    state.visionFromUnitId,
    state.visionFromRangeUm,
    "rgba(47, 127, 224, 0.30)",
    "from",
  );
  renderVisionOverlay(
    elements.visionToLayer,
    selectedUnit,
    state.visionToUnitId,
    state.visionToRangeUm,
    "rgba(255, 209, 74, 0.30)",
    "to",
  );
}

function updateSelectionPanel() {
  const text = getText();
  const selectedUnits = getSelectedUnits();
  const hasUnits = selectedUnits.length > 0;
  const hasRotatableUnits = selectedUnits.some((unit) => getUnitShape(unit) !== "round");
  const selectedUnit = selectedUnits.length === 1 ? selectedUnits[0] : null;

  if (elements.deleteSelected) {
    elements.deleteSelected.disabled = !hasUnits;
  }

  updateVisionButton(elements.visionFrom, state.visionFromUnitId, selectedUnit, text.visionFrom);
  updateVisionButton(elements.visionTo, state.visionToUnitId, selectedUnit, text.visionTo);

  if (elements.visionRange) {
    elements.visionRange.disabled = !selectedUnit;
    elements.visionRange.value = `${state.visionFromRangeUm}`;
  }

  if (elements.visionToRange) {
    elements.visionToRange.disabled = !selectedUnit;
    elements.visionToRange.value = `${state.visionToRangeUm}`;
  }

  if (elements.rotateSelectedLeft) {
    elements.rotateSelectedLeft.disabled = !hasRotatableUnits;
  }

  if (elements.rotateSelectedRight) {
    elements.rotateSelectedRight.disabled = !hasRotatableUnits;
  }

  if (!hasUnits) {
    state.visionFromUnitId = null;
    state.visionToUnitId = null;
    elements.selectionDetails.className = "selection-empty";
    elements.selectionDetails.textContent = text.selectionEmpty;
    renderVisionOverlays();
    return;
  }

  if (!selectedUnit || state.visionFromUnitId !== selectedUnit.id) {
    state.visionFromUnitId = null;
  }

  if (!selectedUnit || state.visionToUnitId !== selectedUnit.id) {
    state.visionToUnitId = null;
  }

  const description = selectedUnits
    .map((unit) => {
      return getUnitSummaryParts(unit, text).join(" · ");
    })
    .join("\n");

  if (selectedUnits.length < 2) {
    elements.selectionDetails.className = "";
    elements.selectionDetails.textContent = description;
    renderVisionOverlays();
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
  renderVisionOverlays();
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
  const viewStart = transformPointToView({ x: startX, y: startY });
  const viewEnd = transformPointToView({ x: endX, y: endY });
  const viewMid = transformPointToView({ x: (startX + endX) / 2, y: (startY + endY) / 2 });
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

  elements.losLine.setAttribute("x1", viewStart.x);
  elements.losLine.setAttribute("y1", viewStart.y);
  elements.losLine.setAttribute("x2", viewEnd.x);
  elements.losLine.setAttribute("y2", viewEnd.y);
  elements.losLine.style.stroke = lineColor;

  elements.losLabel.textContent = labelText;
  elements.losLabel.setAttribute("x", viewMid.x);
  elements.losLabel.setAttribute("y", viewMid.y);

  const approxWidth = Math.max(labelText.length * 0.52, 3.2);
  const labelHeight = 1.4;
  elements.losLabelBg.setAttribute("x", `${viewMid.x - approxWidth / 2}`);
  elements.losLabelBg.setAttribute("y", `${viewMid.y - labelHeight * 0.72}`);
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
  const { width: viewBoardWidth, height: viewBoardHeight } = getViewBoardDimensions();

  unitsForCurrentMap().forEach((unit) => {
    const dimensions = getUnitDimensions(unit);
    const viewPoint = transformPointToView({ x: unit.x, y: unit.y });
    const node = document.createElement("button");
    node.type = "button";
    node.className = `unit unit-${unit.team} unit-${dimensions.shape}`;
    if (state.selectedUnitIds.includes(unit.id)) {
      node.classList.add("selected");
    }

    node.dataset.unitId = unit.id;
    node.dataset.shape = dimensions.shape;
    node.style.width = `${(dimensions.widthUm / viewBoardWidth) * 100}%`;
    node.style.height = `${(dimensions.heightUm / viewBoardHeight) * 100}%`;
    node.style.left = `${(viewPoint.x / viewBoardWidth) * 100}%`;
    node.style.top = `${(viewPoint.y / viewBoardHeight) * 100}%`;
    node.style.transform = `translate(-50%, -50%) rotate(${transformRotationDegrees(dimensions.rotation)}deg)`;
    node.style.borderRadius = getShapeDefinition(dimensions.shape).borderRadius;
    const summary = getUnitSummaryParts(unit, getText()).join(", ");
    node.setAttribute("aria-label", summary);

    const label = document.createElement("span");
    label.className = "unit-label";
    label.textContent = unit.name || "";
    label.hidden = !unit.name;
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
  const { width: viewBoardWidth, height: viewBoardHeight } = getViewBoardDimensions();

  return transformPointToWorld({
    x: relativeX * viewBoardWidth,
    y: relativeY * viewBoardHeight,
  });
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
  window.addEventListener("resize", () => {
    sizeBoardToFrame();
    renderBoard();
    renderUnits();
  });
  elements.showTerrainOverlay.addEventListener("change", renderTerrainOverlay);
  elements.languageOptions.forEach((button) => {
    button.addEventListener("click", () => {
      updateLanguage(button.dataset.language);
    });
  });
  elements.mapSelect.addEventListener("change", (event) => {
    state.currentMapId = event.target.value;
    state.visionFromUnitId = null;
    state.visionToUnitId = null;
    renderBoard();
    renderUnits();
  });
  elements.addBlue.addEventListener("click", () => createUnit("blue"));
  elements.addRed.addEventListener("click", () => createUnit("red"));
  elements.clearSelection.addEventListener("click", () => {
    state.selectedUnitIds = [];
    state.visionFromUnitId = null;
    state.visionToUnitId = null;
    renderUnits();
  });
  elements.deleteSelected.addEventListener("click", () => {
    if (state.selectedUnitIds.length === 0) {
      return;
    }

    const selectedIds = new Set(state.selectedUnitIds);
    state.units = state.units.filter((unit) => !selectedIds.has(unit.id));
    state.selectedUnitIds = [];
    state.visionFromUnitId = null;
    state.visionToUnitId = null;
    renderUnits();
  });
  if (elements.visionFrom) {
    elements.visionFrom.addEventListener("click", () => {
      const selectedUnits = getSelectedUnits();
      if (selectedUnits.length !== 1) {
        return;
      }

      const [selectedUnit] = selectedUnits;
      const nextActive = state.visionFromUnitId === selectedUnit.id ? null : selectedUnit.id;
      state.visionFromUnitId = nextActive;
      state.visionToUnitId = null;
      updateSelectionPanel();
      renderVisionOverlays();
    });
  }
  if (elements.visionTo) {
    elements.visionTo.addEventListener("click", () => {
      const selectedUnits = getSelectedUnits();
      if (selectedUnits.length !== 1) {
        return;
      }

      const [selectedUnit] = selectedUnits;
      const nextActive = state.visionToUnitId === selectedUnit.id ? null : selectedUnit.id;
      state.visionToUnitId = nextActive;
      state.visionFromUnitId = null;
      updateSelectionPanel();
      renderVisionOverlays();
    });
  }
  if (elements.visionRange) {
    elements.visionRange.addEventListener("input", () => {
      syncVisionRangeInput(elements.visionRange, "visionFromRangeUm");
      if (state.visionFromUnitId) {
        renderVisionOverlays();
      }
    });
    elements.visionRange.addEventListener("change", () => {
      syncVisionRangeInput(elements.visionRange, "visionFromRangeUm");
      if (state.visionFromUnitId) {
        renderVisionOverlays();
      }
    });
  }
  if (elements.visionToRange) {
    elements.visionToRange.addEventListener("input", () => {
      syncVisionRangeInput(elements.visionToRange, "visionToRangeUm");
      if (state.visionToUnitId) {
        renderVisionOverlays();
      }
    });
    elements.visionToRange.addEventListener("change", () => {
      syncVisionRangeInput(elements.visionToRange, "visionToRangeUm");
      if (state.visionToUnitId) {
        renderVisionOverlays();
      }
    });
  }
  if (elements.rotateSelectedLeft) {
    elements.rotateSelectedLeft.addEventListener("click", () => rotateSelectedUnits(-ROTATE_STEP_DEG));
  }
  if (elements.rotateSelectedRight) {
    elements.rotateSelectedRight.addEventListener("click", () => rotateSelectedUnits(ROTATE_STEP_DEG));
  }
  if (elements.boardOrientationNormal) {
    elements.boardOrientationNormal.addEventListener("click", () => setBoardOrientation("normal"));
  }
  if (elements.boardOrientationRotated) {
    elements.boardOrientationRotated.addEventListener("click", () => setBoardOrientation("rotated"));
  }
}

populateMapSelect();
populateShapeSelect();
setBaseSizeOutput();
setRectangleDimensionOutputs();
syncVisionRangeInput(elements.visionRange, "visionFromRangeUm");
syncVisionRangeInput(elements.visionToRange, "visionToRangeUm");
updateBaseSizeLabel();
updateDimensionVisibility();
updateBoardOrientationUI();
applyLanguage();
bindEvents();
boardResizeObserver = new ResizeObserver(() => {
  sizeBoardToFrame();
  renderBoard();
  renderUnits();
});
boardResizeObserver.observe(elements.boardFrame);
sizeBoardToFrame();
renderBoard();
renderUnits();
