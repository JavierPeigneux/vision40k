import {
  formatMessage,
  getLocalizedMapName,
  getMessages,
  getPreferredLanguage,
  setPreferredLanguage,
} from "./i18n.js";
import { mapConfigs } from "./map-configs.js?v=20260618-3";

const BOARD_WIDTH_UM = 44;
const BOARD_HEIGHT_UM = 60;

const state = {
  language: getPreferredLanguage(),
  currentMapId: null,
  jsonPath: null,
  config: null,
  selectedId: null,
  drag: null,
  dirty: false,
};

const searchParams = new URLSearchParams(window.location.search);
const initialMapId = document.body.dataset.mapId || searchParams.get("map") || mapConfigs[0]?.id;

const elements = {
  title: document.querySelector("#editor-title"),
  subtitle: document.querySelector("#editor-subtitle"),
  status: document.querySelector("#editor-status"),
  pieceInfo: document.querySelector("#piece-info"),
  angleValue: document.querySelector("#angle-value"),
  mapSelect: document.querySelector("#editor-map-select"),
  previousMap: document.querySelector("#previous-map"),
  nextMap: document.querySelector("#next-map"),
  saveJson: document.querySelector("#save-json"),
  angleDown: document.querySelector("#angle-down"),
  angleUp: document.querySelector("#angle-up"),
  addVertex: document.querySelector("#add-vertex"),
  resetPiece: document.querySelector("#reset-piece"),
  boardFrame: document.querySelector(".board-frame"),
  board: document.querySelector("#board"),
  boardImage: document.querySelector("#board-image"),
  terrainLayer: document.querySelector("#terrain-layer"),
  eyebrow: document.querySelector(".eyebrow"),
  languageOptions: Array.from(document.querySelectorAll("[data-language]")),
};

let resizeObserver;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRotation(angle) {
  while (angle <= -90) angle += 180;
  while (angle > 90) angle -= 180;
  return angle;
}

function createSvgElement(tagName) {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function rotatePoint(point, angleDegrees) {
  const angle = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function toPieceLocalPoint(point, piece) {
  return rotatePoint(
    {
      x: point.x - piece.x,
      y: point.y - piece.y,
    },
    -(piece.rotation || 0),
  );
}

function getTerrainShapePoints(piece) {
  return piece.polygon?.length >= 3
    ? piece.polygon
    : [
        { x: -piece.width / 2, y: -piece.height / 2 },
        { x: piece.width / 2, y: -piece.height / 2 },
        { x: piece.width / 2, y: piece.height / 2 },
        { x: -piece.width / 2, y: piece.height / 2 },
      ];
}

function getMapIndex(mapId) {
  return Math.max(0, mapConfigs.findIndex((config) => config.id === mapId));
}

function getJsonPath(mapId) {
  return document.body.dataset.jsonPath || `./configs/editable/${mapId}.json`;
}

function getDraftKey(mapId = state.currentMapId) {
  return `terrain-editor:draft:${mapId}`;
}

function getPayload() {
  const payload = { ...state.config };
  delete payload._baseTerrain;
  return payload;
}

function getSelectedPiece() {
  return state.config?.terrain.find((piece) => piece.id === state.selectedId) ?? null;
}

function findBasePiece(pieceId) {
  return state.config?._baseTerrain.find((piece) => piece.id === pieceId) ?? null;
}

function getText() {
  return getMessages(state.language).editor;
}

function applyLanguage() {
  const text = getText();

  document.documentElement.lang = state.language;
  if (elements.eyebrow) {
    elements.eyebrow.textContent = text.eyebrow;
  }
  if (elements.previousMap) {
    elements.previousMap.textContent = text.previousMap;
  }
  if (elements.nextMap) {
    elements.nextMap.textContent = text.nextMap;
  }
  if (elements.saveJson) {
    elements.saveJson.textContent = text.saveJson;
  }
  if (elements.addVertex) {
    elements.addVertex.textContent = text.addVertex;
  }
  if (elements.resetPiece) {
    elements.resetPiece.textContent = text.resetPiece;
  }
  if (elements.board) {
    elements.board.setAttribute("aria-label", text.terrainEditorAria);
  }
  elements.languageOptions.forEach((button) => {
    const language = button.dataset.language;
    const active = language === state.language;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function updateDocumentTitle() {
  if (!state.config) {
    return;
  }

  document.title = `${getLocalizedMapName(state.config.name, state.language)} · ${getText().eyebrow}`;
}

function updateLanguage(nextLanguage) {
  state.language = setPreferredLanguage(nextLanguage);
  applyLanguage();
  updateDocumentTitle();
  if (state.config) {
    elements.title.textContent = getLocalizedMapName(state.config.name, state.language);
    elements.subtitle.textContent = `${getText().eyebrow} · ${state.jsonPath}`;
  }
  populateMapSelect();
  updateStatus();
  updatePiecePanel();
}

async function loadConfig() {
  let nextConfig = null;
  state.currentMapId = mapConfigs.some((config) => config.id === initialMapId) ? initialMapId : mapConfigs[0].id;
  state.jsonPath = getJsonPath(state.currentMapId);

  try {
    const response = await fetch(state.jsonPath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`No editable JSON found for ${state.currentMapId}`);
    }
    nextConfig = await response.json();
  } catch (error) {
    const baseConfig = mapConfigs.find((config) => config.id === state.currentMapId);
    if (!baseConfig) {
      throw error;
    }
    nextConfig = structuredClone(baseConfig);
  }

  try {
    const draft = localStorage.getItem(getDraftKey(state.currentMapId));
    if (draft) {
      nextConfig = JSON.parse(draft);
      state.dirty = true;
    }
  } catch {
    // Drafts are optional; fall back to the file config.
  }

  state.config = nextConfig;
  state.config.terrain ??= [];
  state.config._baseTerrain = structuredClone(state.config.terrain);
}

function populateMapSelect() {
  if (!elements.mapSelect) {
    return;
  }

  elements.mapSelect.replaceChildren();
  mapConfigs.forEach((config) => {
    const option = document.createElement("option");
    option.value = config.id;
    option.textContent = getLocalizedMapName(config.name, state.language);
    elements.mapSelect.append(option);
  });
  elements.mapSelect.value = state.currentMapId;
}

function updateStatus(message = null) {
  if (message) {
    elements.status.textContent = message;
    return;
  }

  const text = getText();
  elements.status.textContent = formatMessage(state.dirty ? text.dirty : text.ready, { path: state.jsonPath });
}

function rememberDraft() {
  if (!state.config) {
    return;
  }

  try {
    localStorage.setItem(getDraftKey(), JSON.stringify(getPayload()));
  } catch {
    // Saving a draft is best effort; the explicit download still works.
  }
  state.dirty = true;
  updateStatus();
}

function saveJsonFile() {
  if (!state.config) {
    return;
  }

  const payload = `${JSON.stringify(getPayload(), null, 2)}\n`;
  const blob = new Blob([payload], { type: "application/json" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = state.jsonPath.split("/").pop();
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);

  state.dirty = false;
  updateStatus(formatMessage(getText().saved, { path: state.jsonPath }));
}

function navigateToMap(mapId) {
  const nextMap = mapConfigs.find((config) => config.id === mapId);
  if (!nextMap) {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("map", nextMap.id);
  window.location.href = url.toString();
}

function navigateByOffset(offset) {
  const currentIndex = getMapIndex(state.currentMapId);
  const nextIndex = (currentIndex + offset + mapConfigs.length) % mapConfigs.length;
  navigateToMap(mapConfigs[nextIndex].id);
}

function updatePiecePanel() {
  const text = getText();
  const piece = getSelectedPiece();
  elements.angleDown.disabled = !piece;
  elements.angleUp.disabled = !piece;
  elements.addVertex.disabled = !piece;
  elements.resetPiece.disabled = !piece;

  if (!piece) {
    elements.pieceInfo.textContent = text.pieceHint;
    elements.angleValue.textContent = "0°";
    return;
  }

  elements.pieceInfo.textContent = `${piece.name} · ${piece.id} · ${piece.preset ?? (piece.polygon ? "polygon" : "custom")}`;
  elements.angleValue.textContent = `${(piece.rotation ?? 0).toFixed(1)}°`;
}

function sizeBoardToFrame() {
  const frameRect = elements.boardFrame.getBoundingClientRect();
  const frameWidth = frameRect.width - 16;
  const frameHeight = frameRect.height - 16;
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

function renderBoardImage() {
  const { boardRectPx, originalSizePx, src } = state.config.image;
  const widthScale = originalSizePx.width / boardRectPx.width;
  const heightScale = originalSizePx.height / boardRectPx.height;

  elements.boardImage.src = src;
  elements.boardImage.style.width = `${widthScale * 100}%`;
  elements.boardImage.style.height = `${heightScale * 100}%`;
  elements.boardImage.style.left = `${-(boardRectPx.x / boardRectPx.width) * 100}%`;
  elements.boardImage.style.top = `${-(boardRectPx.y / boardRectPx.height) * 100}%`;
}

function pointerToBoardUnits(event) {
  const rect = elements.board.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1) * BOARD_WIDTH_UM,
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1) * BOARD_HEIGHT_UM,
  };
}

function renderTerrain() {
  elements.terrainLayer.replaceChildren();

  state.config.terrain.forEach((piece, index) => {
    const group = createSvgElement("g");
    group.setAttribute("class", "terrain-piece");
    if (piece.id === state.selectedId) {
      group.classList.add("selected");
    }
    group.setAttribute("transform", `translate(${piece.x} ${piece.y}) rotate(${piece.rotation || 0})`);

    if (piece.polygon?.length >= 3) {
      const polygon = createSvgElement("polygon");
      polygon.setAttribute("points", getTerrainShapePoints(piece).map((point) => `${point.x},${point.y}`).join(" "));
      polygon.setAttribute("class", `terrain-rect terrain-${piece.kind}`);
      group.append(polygon);
    } else {
      const rect = createSvgElement("rect");
      rect.setAttribute("x", `${-piece.width / 2}`);
      rect.setAttribute("y", `${-piece.height / 2}`);
      rect.setAttribute("width", `${piece.width}`);
      rect.setAttribute("height", `${piece.height}`);
      rect.setAttribute("class", `terrain-rect terrain-${piece.kind}`);
      group.append(rect);
    }

    if (piece.id === state.selectedId && piece.polygon?.length >= 3) {
      piece.polygon.forEach((point, pointIndex) => {
        const handle = createSvgElement("circle");
        handle.setAttribute("cx", `${point.x}`);
        handle.setAttribute("cy", `${point.y}`);
        handle.setAttribute("r", "0.45");
        handle.setAttribute("class", "terrain-point");
        handle.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          event.stopPropagation();
          state.selectedId = piece.id;
          state.drag = {
            mode: "point",
            pieceId: piece.id,
            pointIndex,
            pointerId: event.pointerId,
          };
          updatePiecePanel();
          renderTerrain();
        });
        group.append(handle);
      });
    }

    const label = createSvgElement("text");
    label.setAttribute("x", "0");
    label.setAttribute("y", "0");
    label.setAttribute("class", "terrain-label");
    label.textContent = `${index + 1}`;
    group.append(label);

    group.addEventListener("click", (event) => {
      event.stopPropagation();
      state.selectedId = piece.id;
      updatePiecePanel();
      renderTerrain();
    });

    group.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.selectedId = piece.id;
      const point = pointerToBoardUnits(event);
      state.drag = {
        mode: "piece",
        pieceId: piece.id,
        pointerId: event.pointerId,
        offsetX: point.x - piece.x,
        offsetY: point.y - piece.y,
      };
      updatePiecePanel();
      renderTerrain();
    });

    elements.terrainLayer.append(group);
  });
}

function updateDraggedPiece(event) {
  if (!state.drag || event.pointerId !== state.drag.pointerId) {
    return;
  }

  const piece = getSelectedPiece();
  if (!piece || piece.id !== state.drag.pieceId) {
    state.drag = null;
    return;
  }

  const point = pointerToBoardUnits(event);
  if (state.drag.mode === "point") {
    const localPoint = toPieceLocalPoint(point, piece);
    piece.polygon[state.drag.pointIndex] = {
      x: Number(localPoint.x.toFixed(3)),
      y: Number(localPoint.y.toFixed(3)),
    };
    renderTerrain();
    return;
  }

  piece.x = Number(clamp(point.x - state.drag.offsetX, 0, BOARD_WIDTH_UM).toFixed(3));
  piece.y = Number(clamp(point.y - state.drag.offsetY, 0, BOARD_HEIGHT_UM).toFixed(3));
  renderTerrain();
}

async function finishDraggedPiece(event) {
  if (!state.drag || event.pointerId !== state.drag.pointerId) {
    return;
  }

  state.drag = null;
  rememberDraft();
}

async function adjustAngle(delta) {
  const piece = getSelectedPiece();
  if (!piece) {
    return;
  }

  piece.rotation = Number(normalizeRotation((piece.rotation ?? 0) + delta).toFixed(3));
  updatePiecePanel();
  renderTerrain();
  rememberDraft();
}

function addVertexToSelectedPolygon() {
  const piece = getSelectedPiece();
  if (!piece) {
    return;
  }

  if (!piece.polygon?.length) {
    piece.polygon = getTerrainShapePoints(piece).map((point) => ({ ...point }));
  }

  if (piece.polygon.length < 3) {
    return;
  }

  let longestEdgeIndex = 0;
  let longestEdgeLength = -1;
  piece.polygon.forEach((point, index) => {
    const nextPoint = piece.polygon[(index + 1) % piece.polygon.length];
    const edgeLength = Math.hypot(nextPoint.x - point.x, nextPoint.y - point.y);
    if (edgeLength > longestEdgeLength) {
      longestEdgeIndex = index;
      longestEdgeLength = edgeLength;
    }
  });

  const start = piece.polygon[longestEdgeIndex];
  const end = piece.polygon[(longestEdgeIndex + 1) % piece.polygon.length];
  piece.polygon.splice(longestEdgeIndex + 1, 0, {
    x: Number(((start.x + end.x) / 2).toFixed(3)),
    y: Number(((start.y + end.y) / 2).toFixed(3)),
  });

  updatePiecePanel();
  renderTerrain();
  rememberDraft();
}

async function resetSelectedPiece() {
  const piece = getSelectedPiece();
  const base = piece ? findBasePiece(piece.id) : null;
  if (!piece || !base) {
    return;
  }

  piece.x = base.x;
  piece.y = base.y;
  piece.rotation = base.rotation ?? 0;
  piece.width = base.width;
  piece.height = base.height;
  if (base.polygon) {
    piece.polygon = structuredClone(base.polygon);
  } else {
    delete piece.polygon;
  }
  updatePiecePanel();
  renderTerrain();
  rememberDraft();
}

function bindEvents() {
  window.addEventListener("pointermove", updateDraggedPiece);
  window.addEventListener("pointerup", finishDraggedPiece);
  window.addEventListener("pointercancel", finishDraggedPiece);
  elements.mapSelect.addEventListener("change", () => navigateToMap(elements.mapSelect.value));
  elements.previousMap.addEventListener("click", () => navigateByOffset(-1));
  elements.nextMap.addEventListener("click", () => navigateByOffset(1));
  elements.saveJson.addEventListener("click", saveJsonFile);
  elements.angleDown.addEventListener("click", () => adjustAngle(-1));
  elements.angleUp.addEventListener("click", () => adjustAngle(1));
  elements.addVertex.addEventListener("click", addVertexToSelectedPolygon);
  elements.resetPiece.addEventListener("click", resetSelectedPiece);
  elements.languageOptions.forEach((button) => {
    button.addEventListener("click", () => {
      updateLanguage(button.dataset.language);
    });
  });
  elements.board.addEventListener("click", () => {
    state.selectedId = null;
    updatePiecePanel();
    renderTerrain();
  });
}

async function init() {
  await loadConfig();
  applyLanguage();
  populateMapSelect();
  elements.title.textContent = getLocalizedMapName(state.config.name, state.language);
  elements.subtitle.textContent = `${getText().eyebrow} · ${state.jsonPath}`;
  updateDocumentTitle();
  renderBoardImage();
  bindEvents();
  resizeObserver = new ResizeObserver(sizeBoardToFrame);
  resizeObserver.observe(elements.boardFrame);
  sizeBoardToFrame();
  updatePiecePanel();
  renderTerrain();
  updateStatus();
}

init();
