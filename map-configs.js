export const BOARD_WIDTH_UM = 44;
export const BOARD_HEIGHT_UM = 60;
export const TERRAIN_PRESETS = {
  large: { width: 7, height: 11.5 },
  largeXL: { width: 8, height: 11.5 },
  medium: { width: 6, height: 4 },
  longLine: { width: 10, height: 2.5 },
  shortLine: { width: 6, height: 2 },
};

export const MAP_DISPOSITIONS = [
  "Take and Hold",
  "Purge the Foe",
  "Disruption",
  "Reconnaissance",
  "Priority Assets"
];
export const MAP_LAYOUTS = ["A", "B", "C"];

function rectanglePolygon(width, height) {
  return [
    { x: -width / 2, y: -height / 2 },
    { x: width / 2, y: -height / 2 },
    { x: width / 2, y: height / 2 },
    { x: -width / 2, y: height / 2 }
  ];
}

function terrainPiece(piece) {
  return {
    ...piece,
    polygon: piece.polygon ?? rectanglePolygon(piece.width, piece.height)
  };
}

const DEFAULT_TERRAIN = [
  terrainPiece({
    id: "default-large-south-west",
    name: "Ruina sur-oeste",
    kind: "ruin",
    preset: "large",
    x: 5.966,
    y: 38.135,
    width: 7,
    height: 11.5,
    rotation: 90
  }),
  terrainPiece({
    id: "default-large-north",
    name: "Ruina castillo norte",
    kind: "ruin",
    preset: "large",
    x: 18.98,
    y: 13.43,
    width: 7,
    height: 11.5,
    rotation: 90
  }),
  terrainPiece({
    id: "default-large-east",
    name: "Ruina este",
    kind: "ruin",
    preset: "large",
    x: 38.236,
    y: 22.254,
    width: 7,
    height: 11.5,
    rotation: 90
  }),
  terrainPiece({
    id: "default-large-center-left",
    name: "Ruina central izquierda",
    kind: "ruin",
    preset: "splitLarge",
    x: 22,
    y: 31,
    width: 10,
    height: 12,
    rotation: 0,
    polygon: [
      { x: -5, y: -6 },
      { x: 0, y: -6 },
      { x: -0.85, y: 6 },
      { x: -5, y: 6 }
    ]
  }),
  terrainPiece({
    id: "default-large-center-right",
    name: "Ruina central derecha",
    kind: "ruin",
    preset: "splitLarge",
    x: 22,
    y: 31,
    width: 10,
    height: 12,
    rotation: 0,
    polygon: [
      { x: 0, y: -6 },
      { x: 5, y: -6 },
      { x: 5, y: 6 },
      { x: -0.85, y: 6 }
    ]
  }),
  terrainPiece({
    id: "default-large-south",
    name: "Ruina castillo sur",
    kind: "ruin",
    preset: "large",
    x: 25.206,
    y: 46.514,
    width: 7,
    height: 11.5,
    rotation: 90
  }),
  terrainPiece({
    id: "default-medium-west",
    name: "Ruina oeste media",
    kind: "ruin",
    preset: "medium",
    x: 3.168,
    y: 21.653,
    width: 6,
    height: 4,
    rotation: 0
  }),
  terrainPiece({
    id: "default-medium-east-corner",
    name: "Ruina espejo de oeste media",
    kind: "ruin",
    preset: "medium",
    x: 40.8,
    y: 38.8,
    width: 6,
    height: 4,
    rotation: 0
  }),
  terrainPiece({
    id: "default-medium-east",
    name: "Ruina este media",
    kind: "ruin",
    preset: "medium",
    x: 35.959,
    y: 33.63,
    width: 6,
    height: 4,
    rotation: 90
  }),
  terrainPiece({
    id: "default-medium-west-inner",
    name: "Ruina oeste media 2",
    kind: "ruin",
    preset: "medium",
    x: 8.182,
    y: 26.633,
    width: 6,
    height: 4,
    rotation: 90
  }),
  terrainPiece({
    id: "default-long-north-east",
    name: "Barricada norte-este",
    kind: "barricade",
    preset: "longLine",
    x: 32.095,
    y: 13.344,
    width: 10,
    height: 2.5,
    rotation: 0
  }),
  terrainPiece({
    id: "default-long-south-west",
    name: "Barricada sur-oeste",
    kind: "barricade",
    preset: "longLine",
    x: 12.127,
    y: 46.813,
    width: 10,
    height: 2.5,
    rotation: 0
  }),
  terrainPiece({
    id: "default-short-north-west",
    name: "Barricada norte-oeste",
    kind: "barricade",
    preset: "shortLine",
    x: 10.118,
    y: 18.016,
    width: 6,
    height: 2,
    rotation: 0
  }),
  terrainPiece({
    id: "default-short-south-east",
    name: "Barricada sur-este",
    kind: "barricade",
    preset: "shortLine",
    x: 33.981,
    y: 41.959,
    width: 6,
    height: 2,
    rotation: 0
  }),
  terrainPiece({
    id: "default-short-north-west-vertical",
    name: "Ruina norte-oeste",
    kind: "barricade",
    preset: "shortLine",
    x: 6.05,
    y: 13.9,
    width: 6,
    height: 2,
    rotation: 90
  }),
  terrainPiece({
    id: "default-short-south-east-vertical",
    name: "Ruina sur-este",
    kind: "barricade",
    preset: "shortLine",
    x: 38.149,
    y: 46.172,
    width: 6,
    height: 2,
    rotation: 90
  })
];

function createDefaultTerrain() {
  return DEFAULT_TERRAIN.map((piece) => structuredClone(piece));
}

export const mapConfigs = [
  {
    id: "take-and-hold__take-and-hold__layout-a",
    name: "Take and Hold vs Take and Hold - Layout A",
    dispositionA: "Take and Hold",
    dispositionB: "Take and Hold",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/09-take-and-hold-vs-take-and-hold-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__take-and-hold__layout-b",
    name: "Take and Hold vs Take and Hold - Layout B",
    dispositionA: "Take and Hold",
    dispositionB: "Take and Hold",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/10-take-and-hold-vs-take-and-hold-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__take-and-hold__layout-c",
    name: "Take and Hold vs Take and Hold - Layout C",
    dispositionA: "Take and Hold",
    dispositionB: "Take and Hold",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/11-take-and-hold-vs-take-and-hold-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__purge-the-foe__layout-a",
    name: "Take and Hold vs Purge the Foe - Layout A",
    dispositionA: "Take and Hold",
    dispositionB: "Purge the Foe",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/12-take-and-hold-vs-purge-the-foe-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__purge-the-foe__layout-b",
    name: "Take and Hold vs Purge the Foe - Layout B",
    dispositionA: "Take and Hold",
    dispositionB: "Purge the Foe",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/13-take-and-hold-vs-purge-the-foe-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__purge-the-foe__layout-c",
    name: "Take and Hold vs Purge the Foe - Layout C",
    dispositionA: "Take and Hold",
    dispositionB: "Purge the Foe",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/14-take-and-hold-vs-purge-the-foe-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__disruption__layout-a",
    name: "Take and Hold vs Disruption - Layout A",
    dispositionA: "Take and Hold",
    dispositionB: "Disruption",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/15-take-and-hold-vs-disruption-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__disruption__layout-b",
    name: "Take and Hold vs Disruption - Layout B",
    dispositionA: "Take and Hold",
    dispositionB: "Disruption",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/16-take-and-hold-vs-disruption-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__disruption__layout-c",
    name: "Take and Hold vs Disruption - Layout C",
    dispositionA: "Take and Hold",
    dispositionB: "Disruption",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/17-take-and-hold-vs-disruption-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__reconnaissance__layout-a",
    name: "Take and Hold vs Reconnaissance - Layout A",
    dispositionA: "Take and Hold",
    dispositionB: "Reconnaissance",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/18-take-and-hold-vs-reconnaissance-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__reconnaissance__layout-b",
    name: "Take and Hold vs Reconnaissance - Layout B",
    dispositionA: "Take and Hold",
    dispositionB: "Reconnaissance",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/19-take-and-hold-vs-reconnaissance-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__reconnaissance__layout-c",
    name: "Take and Hold vs Reconnaissance - Layout C",
    dispositionA: "Take and Hold",
    dispositionB: "Reconnaissance",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/20-take-and-hold-vs-reconnaissance-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__priority-assets__layout-a",
    name: "Take and Hold vs Priority Assets - Layout A",
    dispositionA: "Take and Hold",
    dispositionB: "Priority Assets",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/21-take-and-hold-vs-priority-assets-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__priority-assets__layout-b",
    name: "Take and Hold vs Priority Assets - Layout B",
    dispositionA: "Take and Hold",
    dispositionB: "Priority Assets",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/22-take-and-hold-vs-priority-assets-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "take-and-hold__priority-assets__layout-c",
    name: "Take and Hold vs Priority Assets - Layout C",
    dispositionA: "Take and Hold",
    dispositionB: "Priority Assets",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/23-take-and-hold-vs-priority-assets-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__purge-the-foe__layout-a",
    name: "Purge the Foe vs Purge the Foe - Layout A",
    dispositionA: "Purge the Foe",
    dispositionB: "Purge the Foe",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/24-purge-the-foe-vs-purge-the-foe-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__purge-the-foe__layout-b",
    name: "Purge the Foe vs Purge the Foe - Layout B",
    dispositionA: "Purge the Foe",
    dispositionB: "Purge the Foe",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/25-purge-the-foe-vs-purge-the-foe-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__purge-the-foe__layout-c",
    name: "Purge the Foe vs Purge the Foe - Layout C",
    dispositionA: "Purge the Foe",
    dispositionB: "Purge the Foe",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/26-purge-the-foe-vs-purge-the-foe-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__disruption__layout-a",
    name: "Purge the Foe vs Disruption - Layout A",
    dispositionA: "Purge the Foe",
    dispositionB: "Disruption",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/27-purge-the-foe-vs-disruption-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__disruption__layout-b",
    name: "Purge the Foe vs Disruption - Layout B",
    dispositionA: "Purge the Foe",
    dispositionB: "Disruption",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/28-purge-the-foe-vs-disruption-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__disruption__layout-c",
    name: "Purge the Foe vs Disruption - Layout C",
    dispositionA: "Purge the Foe",
    dispositionB: "Disruption",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/29-purge-the-foe-vs-disruption-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__reconnaissance__layout-a",
    name: "Purge the Foe vs Reconnaissance - Layout A",
    dispositionA: "Purge the Foe",
    dispositionB: "Reconnaissance",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/30-purge-the-foe-vs-reconnaissance-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__reconnaissance__layout-b",
    name: "Purge the Foe vs Reconnaissance - Layout B",
    dispositionA: "Purge the Foe",
    dispositionB: "Reconnaissance",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/31-purge-the-foe-vs-reconnaissance-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__reconnaissance__layout-c",
    name: "Purge the Foe vs Reconnaissance - Layout C",
    dispositionA: "Purge the Foe",
    dispositionB: "Reconnaissance",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/32-purge-the-foe-vs-reconnaissance-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__priority-assets__layout-a",
    name: "Purge the Foe vs Priority Assets - Layout A",
    dispositionA: "Purge the Foe",
    dispositionB: "Priority Assets",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/33-purge-the-foe-vs-priority-assets-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__priority-assets__layout-b",
    name: "Purge the Foe vs Priority Assets - Layout B",
    dispositionA: "Purge the Foe",
    dispositionB: "Priority Assets",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/34-purge-the-foe-vs-priority-assets-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "purge-the-foe__priority-assets__layout-c",
    name: "Purge the Foe vs Priority Assets - Layout C",
    dispositionA: "Purge the Foe",
    dispositionB: "Priority Assets",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/35-purge-the-foe-vs-priority-assets-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "disruption__disruption__layout-a",
    name: "Disruption vs Disruption - Layout A",
    dispositionA: "Disruption",
    dispositionB: "Disruption",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/36-disruption-vs-disruption-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "disruption__disruption__layout-b",
    name: "Disruption vs Disruption - Layout B",
    dispositionA: "Disruption",
    dispositionB: "Disruption",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/37-disruption-vs-disruption-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "disruption__disruption__layout-c",
    name: "Disruption vs Disruption - Layout C",
    dispositionA: "Disruption",
    dispositionB: "Disruption",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/38-disruption-vs-disruption-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "disruption__reconnaissance__layout-a",
    name: "Disruption vs Reconnaissance - Layout A",
    dispositionA: "Disruption",
    dispositionB: "Reconnaissance",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/39-disruption-vs-reconnaissance-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "disruption__reconnaissance__layout-b",
    name: "Disruption vs Reconnaissance - Layout B",
    dispositionA: "Disruption",
    dispositionB: "Reconnaissance",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/40-disruption-vs-reconnaissance-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "disruption__reconnaissance__layout-c",
    name: "Disruption vs Reconnaissance - Layout C",
    dispositionA: "Disruption",
    dispositionB: "Reconnaissance",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/41-disruption-vs-reconnaissance-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "disruption__priority-assets__layout-a",
    name: "Disruption vs Priority Assets - Layout A",
    dispositionA: "Disruption",
    dispositionB: "Priority Assets",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/42-disruption-vs-priority-assets-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "disruption__priority-assets__layout-b",
    name: "Disruption vs Priority Assets - Layout B",
    dispositionA: "Disruption",
    dispositionB: "Priority Assets",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/43-disruption-vs-priority-assets-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "disruption__priority-assets__layout-c",
    name: "Disruption vs Priority Assets - Layout C",
    dispositionA: "Disruption",
    dispositionB: "Priority Assets",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/44-disruption-vs-priority-assets-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "reconnaissance__reconnaissance__layout-a",
    name: "Reconnaissance vs Reconnaissance - Layout A",
    dispositionA: "Reconnaissance",
    dispositionB: "Reconnaissance",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/45-reconnaissance-vs-reconnaissance-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "reconnaissance__reconnaissance__layout-b",
    name: "Reconnaissance vs Reconnaissance - Layout B",
    dispositionA: "Reconnaissance",
    dispositionB: "Reconnaissance",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/46-reconnaissance-vs-reconnaissance-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "reconnaissance__reconnaissance__layout-c",
    name: "Reconnaissance vs Reconnaissance - Layout C",
    dispositionA: "Reconnaissance",
    dispositionB: "Reconnaissance",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/47-reconnaissance-vs-reconnaissance-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "reconnaissance__priority-assets__layout-a",
    name: "Reconnaissance vs Priority Assets - Layout A",
    dispositionA: "Reconnaissance",
    dispositionB: "Priority Assets",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/48-reconnaissance-vs-priority-assets-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "reconnaissance__priority-assets__layout-b",
    name: "Reconnaissance vs Priority Assets - Layout B",
    dispositionA: "Reconnaissance",
    dispositionB: "Priority Assets",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/49-reconnaissance-vs-priority-assets-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "reconnaissance__priority-assets__layout-c",
    name: "Reconnaissance vs Priority Assets - Layout C",
    dispositionA: "Reconnaissance",
    dispositionB: "Priority Assets",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/50-reconnaissance-vs-priority-assets-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "priority-assets__priority-assets__layout-a",
    name: "Priority Assets vs Priority Assets - Layout A",
    dispositionA: "Priority Assets",
    dispositionB: "Priority Assets",
    layout: "A",
    image: {
      src: "./assets/pdf-maps/51-priority-assets-vs-priority-assets-layout-a.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "priority-assets__priority-assets__layout-b",
    name: "Priority Assets vs Priority Assets - Layout B",
    dispositionA: "Priority Assets",
    dispositionB: "Priority Assets",
    layout: "B",
    image: {
      src: "./assets/pdf-maps/52-priority-assets-vs-priority-assets-layout-b.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  },
  {
    id: "priority-assets__priority-assets__layout-c",
    name: "Priority Assets vs Priority Assets - Layout C",
    dispositionA: "Priority Assets",
    dispositionB: "Priority Assets",
    layout: "C",
    image: {
      src: "./assets/pdf-maps/53-priority-assets-vs-priority-assets-layout-c.png",
      originalSizePx: {
        width: 2382,
        height: 3368
      },
      boardRectPx: {
        x: 508,
        y: 1106,
        width: 1368,
        height: 1858
      }
    },
    terrain: createDefaultTerrain()
  }
];
