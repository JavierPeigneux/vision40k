const BOARD_WIDTH_UM = 44;
const BOARD_HEIGHT_UM = 60;

const state = {
  config: null,
  fileHandle: null,
  selectedId: null,
  drag: null,
};

const mapId = document.body.dataset.mapId;
const jsonPath = document.body.dataset.jsonPath;

const elements = {
  title: document.querySelector("#editor-title"),
  subtitle: document.querySelector("#editor-subtitle"),
  status: document.querySelector("#editor-status"),
  pieceInfo: document.querySelector("#piece-info"),
  angleValue: document.querySelector("#angle-value"),
  connectJson: document.querySelector("#connect-json"),
  angleDown: document.querySelector("#angle-down"),
  angleUp: document.querySelector("#angle-up"),
  resetPiece: document.querySelector("#reset-piece"),
  boardFrame: document.querySelector(".board-frame"),
  board: document.querySelector("#board"),
  boardImage: document.querySelector("#board-image"),
  terrainLayer: document.querySelector("#terrain-layer"),
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

function getSelectedPiece() {
  return state.config?.terrain.find((piece) => piece.id === state.selectedId) ?? null;
}

function findBasePiece(pieceId) {
  return state.config?._baseTerrain.find((piece) => piece.id === pieceId) ?? null;
}

async function loadConfig() {
  const response = await fetch(jsonPath, { cache: "no-store" });
  state.config = await response.json();
  state.config._baseTerrain = structuredClone(state.config.terrain);
}

async function autosave() {
  if (!state.fileHandle || !state.config) {
    elements.status.textContent = `Editando en memoria.\nVincula ${jsonPath} para guardar sobre el JSON real.`;
    return;
  }

  const writable = await state.fileHandle.createWritable();
  const payload = { ...state.config };
  delete payload._baseTerrain;
  await writable.write(`${JSON.stringify(payload, null, 2)}\n`);
  await writable.close();
  elements.status.textContent = `Guardado automatico en ${state.fileHandle.name}`;
}

async function connectJsonFile() {
  if (!window.showOpenFilePicker) {
    window.alert("Este editor necesita un navegador con File System Access API.");
    return;
  }

  const [handle] = await window.showOpenFilePicker({
    multiple: false,
    suggestedName: jsonPath.split("/").pop(),
    types: [
      {
        description: "JSON",
        accept: { "application/json": [".json"] },
      },
    ],
  });

  state.fileHandle = handle;
  elements.status.textContent = `JSON vinculado: ${handle.name}\nLos cambios se guardaran automaticamente.`;
}

function updatePiecePanel() {
  const piece = getSelectedPiece();
  elements.angleDown.disabled = !piece;
  elements.angleUp.disabled = !piece;
  elements.resetPiece.disabled = !piece;

  if (!piece) {
    elements.pieceInfo.textContent = "Selecciona una pieza y arrastrala.";
    elements.angleValue.textContent = "0°";
    return;
  }

  elements.pieceInfo.textContent = `${piece.name} · ${piece.id} · ${piece.preset}`;
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
  piece.x = Number(clamp(point.x - state.drag.offsetX, 0, BOARD_WIDTH_UM).toFixed(3));
  piece.y = Number(clamp(point.y - state.drag.offsetY, 0, BOARD_HEIGHT_UM).toFixed(3));
  renderTerrain();
}

async function finishDraggedPiece(event) {
  if (!state.drag || event.pointerId !== state.drag.pointerId) {
    return;
  }

  state.drag = null;
  await autosave();
}

async function adjustAngle(delta) {
  const piece = getSelectedPiece();
  if (!piece) {
    return;
  }

  piece.rotation = Number(normalizeRotation((piece.rotation ?? 0) + delta).toFixed(3));
  updatePiecePanel();
  renderTerrain();
  await autosave();
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
  updatePiecePanel();
  renderTerrain();
  await autosave();
}

function bindEvents() {
  window.addEventListener("pointermove", updateDraggedPiece);
  window.addEventListener("pointerup", finishDraggedPiece);
  window.addEventListener("pointercancel", finishDraggedPiece);
  elements.connectJson.addEventListener("click", connectJsonFile);
  elements.angleDown.addEventListener("click", () => adjustAngle(-1));
  elements.angleUp.addEventListener("click", () => adjustAngle(1));
  elements.resetPiece.addEventListener("click", resetSelectedPiece);
  elements.board.addEventListener("click", () => {
    state.selectedId = null;
    updatePiecePanel();
    renderTerrain();
  });
}

async function init() {
  await loadConfig();
  elements.title.textContent = state.config.name;
  elements.subtitle.textContent = `Editor local · ${jsonPath}`;
  renderBoardImage();
  bindEvents();
  resizeObserver = new ResizeObserver(sizeBoardToFrame);
  resizeObserver.observe(elements.boardFrame);
  sizeBoardToFrame();
  updatePiecePanel();
  renderTerrain();
  elements.status.textContent = `Editor local listo.\nVincula ${jsonPath} para guardar directamente en ese JSON.`;
}

init();
