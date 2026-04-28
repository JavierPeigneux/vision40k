export const BOARD_WIDTH_UM = 44;
export const BOARD_HEIGHT_UM = 60;
export const TERRAIN_PRESETS = {
  large: { width: 7, height: 11.5 },
  largeXL: { width: 8, height: 11.5 },
  medium: { width: 6, height: 4 },
  longLine: { width: 10, height: 2.5 },
  shortLine: { width: 6, height: 2 },
};

export const mapConfigs = [
  {
    id: "map-1",
    name: "Mapa 1",
    image: {
      src: "./40k_missions-apr8-image2-3ochacwzrx.jpg",
      originalSizePx: {
        width: 1000,
        height: 1134
      },
      boardRectPx: {
        x: 149,
        y: 131,
        width: 705,
        height: 957
      }
    },
    terrain: [
      {
        id: "m1-t1",
        name: "Ruina norte-oeste",
        kind: "barricade",
        preset: "shortLine",
        x: 5.75,
        y: 12.15,
        width: 2,
        height: 6,
        rotation: 90,
        _score: 0.3784
      },
      {
        id: "m1-t2",
        name: "Barricada norte-oeste",
        kind: "barricade",
        preset: "shortLine",
        x: 10.25,
        y: 18.05,
        width: 6,
        height: 2,
        rotation: -2,
        _score: 0.6932
      },
      {
        id: "m1-t3",
        name: "Ruina castillo norte",
        kind: "ruin",
        preset: "large",
        x: 17.05,
        y: 15.1,
        width: 11.5,
        height: 7,
        rotation: 100,
        _score: 0.5806
      },
      {
        id: "m1-t4",
        name: "Barricada norte-este",
        kind: "barricade",
        preset: "longLine",
        x: 32.1,
        y: 13.4,
        width: 10,
        height: 2.5,
        rotation: 0,
        _score: 0.7778
      },
      {
        id: "m1-t5",
        name: "Ruina oeste media",
        kind: "ruin",
        preset: "medium",
        x: 3.2,
        y: 21.2,
        width: 6,
        height: 4,
        rotation: 2.5,
        _score: 0.6948
      },
      {
        id: "m1-t6",
        name: "Crater oeste medio",
        kind: "crater",
        preset: "medium",
        x: 8.95,
        y: 26.75,
        width: 4,
        height: 6,
        rotation: 90,
        _score: 0.8381
      },
      {
        id: "m1-t7",
        name: "Ruina central",
        kind: "ruin",
        preset: "largeXL",
        x: 22.5,
        y: 30,
        width: 8,
        height: 11.5,
        rotation: -7,
        _score: 0.6911
      },
      {
        id: "m1-t8",
        name: "Ruina este media",
        kind: "ruin",
        preset: "large",
        x: 39.8,
        y: 23.25,
        width: 11.5,
        height: 7,
        rotation: 87.5,
        _score: 0.6676
      },
      {
        id: "m1-t9",
        name: "Crater este medio",
        kind: "crater",
        preset: "medium",
        x: 37.35,
        y: 32.8,
        width: 4,
        height: 6,
        rotation: 84.5,
        _score: 0.8034
      },
      {
        id: "m1-t10",
        name: "Ruina sur-oeste",
        kind: "ruin",
        preset: "large",
        x: 5.95,
        y: 37.5,
        width: 11.5,
        height: 7,
        rotation: 88,
        _score: 0.5739
      },
      {
        id: "m1-t11",
        name: "Barricada sur-oeste",
        kind: "barricade",
        preset: "longLine",
        x: 12.1,
        y: 47,
        width: 10,
        height: 2.5,
        rotation: 0,
        _score: 0.76
      },
      {
        id: "m1-t12",
        name: "Ruina castillo sur",
        kind: "ruin",
        preset: "large",
        x: 25.3,
        y: 47.5,
        width: 11.5,
        height: 7,
        rotation: 90,
        _score: 0.4217
      },
      {
        id: "m1-t13",
        name: "Barricada sur-este",
        kind: "barricade",
        preset: "shortLine",
        x: 33.9,
        y: 41.6,
        width: 6,
        height: 2,
        rotation: 8,
        _score: 0.6865
      },
      {
        id: "m1-t14",
        name: "Ruina sur-este",
        kind: "barricade",
        preset: "shortLine",
        x: 38.85,
        y: 45,
        width: 2,
        height: 6,
        rotation: 87.5,
        _score: 0.3858
      },
      {
        id: "m1-t15",
        name: "Ruina esquina este",
        kind: "ruin",
        preset: "medium",
        x: 40.9,
        y: 38.75,
        width: 6,
        height: 4,
        rotation: -4,
        _score: 0.6927
      }
    ]
  },
  {
    id: "map-2",
    name: "Mapa 2",
    image: {
      src: "./40k_missions-apr8-image3-mcerbfkkc5.jpg",
      originalSizePx: {
        width: 1000,
        height: 1134
      },
      boardRectPx: {
        x: 149,
        y: 131,
        width: 703,
        height: 957
      }
    },
    terrain: [
      {
        id: "m2-t1",
        name: "Ruina castillo norte-oeste",
        kind: "ruin",
        preset: "large",
        x: 8.15,
        y: 11.75,
        width: 7,
        height: 11.5,
        rotation: -0.5,
        _score: 0.6517
      },
      {
        id: "m2-t2",
        name: "Barricada diagonal norte",
        kind: "barricade",
        preset: "shortLine",
        x: 19.15,
        y: 12.75,
        width: 6,
        height: 2,
        rotation: 55,
        _score: 0.9938
      },
      {
        id: "m2-t3",
        name: "Ruina diagonal norte-este",
        kind: "ruin",
        preset: "large",
        x: 36.65,
        y: 13.2,
        width: 11.5,
        height: 7,
        rotation: -41.5,
        _score: 0.736
      },
      {
        id: "m2-t4",
        name: "Barricada diagonal oeste",
        kind: "barricade",
        preset: "longLine",
        x: 5.7,
        y: 25.6,
        width: 10,
        height: 2.5,
        rotation: -25.5,
        _score: 0.4207
      },
      {
        id: "m2-t5",
        name: "Ruina central",
        kind: "ruin",
        preset: "largeXL",
        x: 21.15,
        y: 29.9,
        width: 8,
        height: 11.5,
        rotation: -0.5,
        _score: 0.7067
      },
      {
        id: "m2-t6",
        name: "Crater centro-este",
        kind: "crater",
        preset: "medium",
        x: 34.35,
        y: 25.35,
        width: 6,
        height: 4,
        rotation: -40,
        _score: 0.8239
      },
      {
        id: "m2-t7",
        name: "Barricada diagonal este",
        kind: "barricade",
        preset: "longLine",
        x: 37.45,
        y: 34.2,
        width: 10,
        height: 2.5,
        rotation: -29.5,
        _score: 0.5891
      },
      {
        id: "m2-t8",
        name: "Crater centro-oeste",
        kind: "crater",
        preset: "medium",
        x: 7.35,
        y: 36.85,
        width: 6,
        height: 4,
        rotation: -33,
        _score: 0.8119
      },
      {
        id: "m2-t9",
        name: "Ruina diagonal sur-oeste",
        kind: "ruin",
        preset: "large",
        x: 6.4,
        y: 48.15,
        width: 11.5,
        height: 7,
        rotation: -35.5,
        _score: 0.7538
      },
      {
        id: "m2-t10",
        name: "Barricada diagonal sur",
        kind: "barricade",
        preset: "shortLine",
        x: 18.8,
        y: 46.6,
        width: 6,
        height: 2,
        rotation: -35,
        _score: 0.5818
      },
      {
        id: "m2-t11",
        name: "Ruina castillo sur-este",
        kind: "ruin",
        preset: "large",
        x: 35.5,
        y: 48.95,
        width: 7,
        height: 11.5,
        rotation: 0.5,
        _score: 0.6161
      },
      {
        id: "m2-t12",
        name: "Barricada esquina este",
        kind: "barricade",
        preset: "shortLine",
        x: 42.45,
        y: 36.15,
        width: 6,
        height: 2,
        rotation: -34,
        _score: 0
      }
    ]
  }
];
