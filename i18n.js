const LANGUAGE_STORAGE_KEY = "vision40k-language";

const messages = {
  es: {
    app: {
      title: "Simulador de lineas de vision",
      lede: "Tablero de 44x60 um. Las peanas se escalan segun su diametro real y se pueden mover sobre cada mapa.",
      supportKicker: "Proyecto independiente",
      supportLink: "Apoyar en Ko-fi",
      mapLabel: "Mapa",
      mapHint: "Usa mapas con zonas roja y azul ya marcadas en la imagen.",
      createBaseTitle: "Crear peana",
      createBaseSpan: "25 mm a 160 mm",
      diameterLabel: "Diametro",
      unitNameLabel: "Nombre",
      unitNamePlaceholder: "Ej. Intercessor",
      addBlue: "Anadir azul",
      addRed: "Anadir rojo",
      selectionTitle: "Seleccion",
      clearSelection: "Limpiar",
      deleteSelected: "Borrar peanas",
      selectionEmpty: "Selecciona una o dos peanas para ver datos y la linea de vision.",
      configTitle: "Config mapa",
      showTerrainOverlay: "Mostrar rectangulos de calibracion",
      controlsTitle: "Controles",
      controlOne: "Arrastra una peana para moverla.",
      controlTwo: "Haz clic para seleccionarla.",
      controlThree: "Con dos peanas seleccionadas se muestra la distancia borde a borde.",
      controlFour: "Doble clic en una peana para eliminarla.",
      baseDefaultName: "Peana {id}",
      boardEyebrow: "Mesa actual",
      boardTitle: "Mapa",
      boardAlt: "Mapa de Warhammer 40K",
      boardAriaLabel: "Tablero interactivo",
      mapConfigImage: "Imagen original: {width}x{height} px",
      mapConfigBoard: "Rectangulo del tablero: x={x}, y={y}, w={w}, h={h}",
      mapConfigTerrain: "Elementos de escenografia configurados: {count}",
      selectionUnit: "{name} · {side} · {size} mm · ({x}, {y}) um",
      selectionCenter: "Centro a centro: {distance}",
      selectionEdge: "Borde a borde: {distance}",
      selectionSees: "{from} ve a {to}: {visible}",
      sideBlue: "Azul",
      sideRed: "Rojo",
      yes: "si",
      no: "no",
      languageLabel: "EN",
    },
    editor: {
      eyebrow: "Editor Local",
      connectJson: "Vincular JSON",
      pieceHint: "Selecciona una pieza y arrastrala.",
      resetPiece: "Reset pieza",
      terrainEditorAria: "Editor de terreno",
      ready: "Editor local listo.\nVincula {path} para guardar directamente en ese JSON.",
      linked: "JSON vinculado: {name}\nLos cambios se guardaran automaticamente.",
      memory: "Editando en memoria.\nVincula {path} para guardar sobre el JSON real.",
      filePickerError: "Este editor necesita un navegador con File System Access API.",
      languageLabel: "EN",
    },
  },
  en: {
    app: {
      title: "Line of Sight Simulator",
      lede: "44x60 um board. Bases are scaled to their real diameter and can be moved across each map.",
      supportKicker: "Independent project",
      supportLink: "Support on Ko-fi",
      mapLabel: "Map",
      mapHint: "Use maps with the red and blue areas already marked on the image.",
      createBaseTitle: "Create base",
      createBaseSpan: "25 mm to 160 mm",
      diameterLabel: "Diameter",
      unitNameLabel: "Name",
      unitNamePlaceholder: "e.g. Intercessor",
      addBlue: "Add blue",
      addRed: "Add red",
      selectionTitle: "Selection",
      clearSelection: "Clear",
      deleteSelected: "Delete bases",
      selectionEmpty: "Select one or two bases to see data and line of sight.",
      configTitle: "Map config",
      showTerrainOverlay: "Show calibration rectangles",
      controlsTitle: "Controls",
      controlOne: "Drag a base to move it.",
      controlTwo: "Click to select it.",
      controlThree: "With two selected bases, the edge-to-edge distance is shown.",
      controlFour: "Double-click a base to delete it.",
      baseDefaultName: "Base {id}",
      boardEyebrow: "Current board",
      boardTitle: "Map",
      boardAlt: "Warhammer 40K map",
      boardAriaLabel: "Interactive board",
      mapConfigImage: "Original image: {width}x{height} px",
      mapConfigBoard: "Board rectangle: x={x}, y={y}, w={w}, h={h}",
      mapConfigTerrain: "Configured terrain pieces: {count}",
      selectionUnit: "{name} · {side} · {size} mm · ({x}, {y}) um",
      selectionCenter: "Center to center: {distance}",
      selectionEdge: "Edge to edge: {distance}",
      selectionSees: "{from} sees {to}: {visible}",
      sideBlue: "Blue",
      sideRed: "Red",
      yes: "yes",
      no: "no",
      languageLabel: "ES",
    },
    editor: {
      eyebrow: "Local editor",
      connectJson: "Link JSON",
      pieceHint: "Select a piece and drag it.",
      resetPiece: "Reset piece",
      terrainEditorAria: "Terrain editor",
      ready: "Local editor ready.\nLink {path} to save directly into that JSON.",
      linked: "Linked JSON: {name}\nChanges will be saved automatically.",
      memory: "Editing in memory.\nLink {path} to save over the real JSON.",
      filePickerError: "This editor needs a browser with the File System Access API.",
      languageLabel: "ES",
    },
  },
};

function normalizeLanguage(language) {
  return language === "en" ? "en" : "es";
}

export function getPreferredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) {
      return normalizeLanguage(stored);
    }
  } catch {
    // Ignore storage failures and fall back to browser language.
  }

  const browserLanguage = navigator.language?.toLowerCase() ?? "es";
  return browserLanguage.startsWith("en") ? "en" : "es";
}

export function setPreferredLanguage(language) {
  const normalized = normalizeLanguage(language);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // Storage is optional.
  }
  return normalized;
}

export function getMessages(language) {
  return messages[normalizeLanguage(language)];
}

export function toggleLanguage(language) {
  return normalizeLanguage(language) === "es" ? "en" : "es";
}

export function getLocalizedMapName(name, language) {
  const normalized = normalizeLanguage(language);
  const match = /^Mapa\s+(\d+)$/i.exec(name);

  if (!match) {
    return name;
  }

  return normalized === "en" ? `Map ${match[1]}` : `Mapa ${match[1]}`;
}

export function formatMessage(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = values[key];
    return value == null ? "" : String(value);
  });
}
