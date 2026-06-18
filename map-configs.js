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

const CUSTOM_TERRAIN_BY_MAP_ID = {
  "purge-the-foe__priority-assets__layout-c": [
  {
    id: "default-large-south-west",
    name: "Ruina sur-oeste",
    kind: "ruin",
    preset: "large",
    x: 7.865,
    y: 37.549,
    width: 7,
    height: 11.5,
    rotation: 90,
    polygon: [
      {
        x: -3.5,
        y: -5.75
      },
      {
        x: 3.5,
        y: -5.75
      },
      {
        x: 3.5,
        y: 5.75
      },
      {
        x: -3.5,
        y: 5.75
      }
    ]
  },
  {
    id: "default-large-north",
    name: "Ruina castillo norte",
    kind: "ruin",
    preset: "large",
    x: 22.804,
    y: 12.614,
    width: 7,
    height: 11.5,
    rotation: 90,
    polygon: [
      {
        x: -3.5,
        y: -5.75
      },
      {
        x: 3.5,
        y: -5.75
      },
      {
        x: 3.5,
        y: 5.75
      },
      {
        x: -3.5,
        y: 5.75
      }
    ]
  },
  {
    id: "default-large-east",
    name: "Ruina este",
    kind: "ruin",
    preset: "large",
    x: 36.105,
    y: 22.71,
    width: 7,
    height: 11.5,
    rotation: 90,
    polygon: [
      {
        x: -3.5,
        y: -5.75
      },
      {
        x: 3.5,
        y: -5.75
      },
      {
        x: 3.5,
        y: 5.75
      },
      {
        x: -3.5,
        y: 5.75
      }
    ]
  },
  {
    id: "default-large-center-left",
    name: "Ruina central izquierda",
    kind: "ruin",
    preset: "splitLarge",
    x: 19.057,
    y: 29.454,
    width: 10,
    height: 12,
    rotation: 0,
    polygon: [
      {
        x: -6.079,
        y: -3.679
      },
      {
        x: 1.123,
        y: -7.894
      },
      {
        x: 1.624,
        y: 5.397
      },
      {
        x: -0.03,
        y: 6.412
      }
    ]
  },
  {
    id: "default-large-center-right",
    name: "Ruina central derecha",
    kind: "ruin",
    preset: "splitLarge",
    x: 23.838,
    y: 31.521,
    width: 10,
    height: 12,
    rotation: 0,
    polygon: [
      {
        x: -0.547,
        y: -6.538
      },
      {
        x: 1.246,
        y: -7.401
      },
      {
        x: 7.46,
        y: 2.653
      },
      {
        x: 0.075,
        y: 6.963
      }
    ]
  },
  {
    id: "default-large-south",
    name: "Ruina castillo sur",
    kind: "ruin",
    preset: "large",
    x: 20.888,
    y: 47.665,
    width: 7,
    height: 11.5,
    rotation: 90,
    polygon: [
      {
        x: -3.5,
        y: -5.75
      },
      {
        x: 3.5,
        y: -5.75
      },
      {
        x: 3.5,
        y: 5.75
      },
      {
        x: -3.5,
        y: 5.75
      }
    ]
  },
  {
    id: "default-medium-west",
    name: "Ruina oeste media",
    kind: "ruin",
    preset: "medium",
    x: 6.136,
    y: 11.094,
    width: 6,
    height: 4,
    rotation: 0,
    polygon: [
      {
        x: -3,
        y: -2
      },
      {
        x: 3,
        y: -2
      },
      {
        x: 3,
        y: 2
      },
      {
        x: -3,
        y: 2
      }
    ]
  },
  {
    id: "default-medium-east-corner",
    name: "Ruina espejo de oeste media",
    kind: "ruin",
    preset: "medium",
    x: 37.896,
    y: 48.933,
    width: 6,
    height: 4,
    rotation: 0,
    polygon: [
      {
        x: -3,
        y: -2
      },
      {
        x: 3,
        y: -2
      },
      {
        x: 3,
        y: 2
      },
      {
        x: -3,
        y: 2
      }
    ]
  },
  {
    id: "default-medium-east",
    name: "Ruina este media",
    kind: "ruin",
    preset: "medium",
    x: 33.892,
    y: 38.139,
    width: 6,
    height: 4,
    rotation: 90,
    polygon: [
      {
        x: -3,
        y: -2
      },
      {
        x: 3,
        y: -2
      },
      {
        x: 3,
        y: 2
      },
      {
        x: -3,
        y: 2
      }
    ]
  },
  {
    id: "default-medium-west-inner",
    name: "Ruina oeste media 2",
    kind: "ruin",
    preset: "medium",
    x: 10.215,
    y: 21.943,
    width: 6,
    height: 4,
    rotation: 90,
    polygon: [
      {
        x: -3,
        y: -2
      },
      {
        x: 3,
        y: -2
      },
      {
        x: 3,
        y: 2
      },
      {
        x: -3,
        y: 2
      }
    ]
  },
  {
    id: "default-long-north-east",
    name: "Barricada norte-este",
    kind: "barricade",
    preset: "longLine",
    x: 34.958,
    y: 12.568,
    width: 10,
    height: 2.5,
    rotation: 0,
    polygon: [
      {
        x: -5,
        y: -1.25
      },
      {
        x: 5,
        y: -1.25
      },
      {
        x: 5,
        y: 1.25
      },
      {
        x: -5,
        y: 1.25
      }
    ]
  },
  {
    id: "default-long-south-west",
    name: "Barricada sur-oeste",
    kind: "barricade",
    preset: "longLine",
    x: 9.128,
    y: 47.669,
    width: 10,
    height: 2.5,
    rotation: 0,
    polygon: [
      {
        x: -5,
        y: -1.25
      },
      {
        x: 5,
        y: -1.25
      },
      {
        x: 5,
        y: 1.25
      },
      {
        x: -5,
        y: 1.25
      }
    ]
  },
  {
    id: "default-short-north-west",
    name: "Barricada norte-oeste",
    kind: "barricade",
    preset: "shortLine",
    x: 12.113,
    y: 14.155,
    width: 6,
    height: 2,
    rotation: 0,
    polygon: [
      {
        x: -3,
        y: -1
      },
      {
        x: 3,
        y: -1
      },
      {
        x: 3,
        y: 1
      },
      {
        x: -3,
        y: 1
      }
    ]
  },
  {
    id: "default-short-south-east",
    name: "Barricada sur-este",
    kind: "barricade",
    preset: "shortLine",
    x: 36.97,
    y: 34.125,
    width: 6,
    height: 2,
    rotation: 0,
    polygon: [
      {
        x: -3,
        y: -1
      },
      {
        x: 3,
        y: -1
      },
      {
        x: 3,
        y: 1
      },
      {
        x: -3,
        y: 1
      }
    ]
  },
  {
    id: "default-short-north-west-vertical",
    name: "Ruina norte-oeste",
    kind: "barricade",
    preset: "shortLine",
    x: 5.017,
    y: 27.943,
    width: 6,
    height: 2,
    rotation: 90,
    polygon: [
      {
        x: -2.975,
        y: -5.207
      },
      {
        x: -0.903,
        y: -5.022
      },
      {
        x: -0.831,
        y: 1.005
      },
      {
        x: -3,
        y: 1
      }
    ]
  },
  {
    id: "default-short-south-east-vertical",
    name: "Ruina sur-este",
    kind: "barricade",
    preset: "shortLine",
    x: 29.872,
    y: 47.887,
    width: 6,
    height: 2,
    rotation: 90,
    polygon: [
      {
        x: -2.92,
        y: -4.979
      },
      {
        x: -0.932,
        y: -4.965
      },
      {
        x: -0.928,
        y: 1.055
      },
      {
        x: -3.073,
        y: 1.128
      }
    ]
  }
],
  "reconnaissance__reconnaissance__layout-a": [
    {
      id: "default-large-south-west",
      name: "Ruina sur-oeste",
      kind: "ruin",
      preset: "large",
      x: 9.295,
      y: 39.51,
      width: 7,
      height: 11.5,
      rotation: 90,
      polygon: [
        {
          x: -3.73,
          y: 6.079
        },
        {
          x: 3.827,
          y: 5.982
        },
        {
          x: 3.73,
          y: -6.079
        },
        {
          x: -3.827,
          y: -5.982
        }
      ],
      _score: 0.9499,
      _gray: 0.6875,
      _color: 0.05,
      _border: 0,
      _edge: 0.3542,
      _snap_vertices: 4
    },
    {
      id: "default-large-north",
      name: "Ruina castillo norte",
      kind: "ruin",
      preset: "large",
      x: 20.089,
      y: 14.454,
      width: 7,
      height: 11.5,
      rotation: -88,
      polygon: [
        {
          x: 3.613,
          y: -6.26
        },
        {
          x: -3.943,
          y: -6.125
        },
        {
          x: -1.772,
          y: -4.109
        },
        {
          x: -3.786,
          y: -4.392
        },
        {
          x: -3.876,
          y: -2.362
        },
        {
          x: -3.602,
          y: -3.755
        },
        {
          x: -1.741,
          y: -3.209
        },
        {
          x: -4.022,
          y: -1.906
        },
        {
          x: -3.846,
          y: 5.908
        },
        {
          x: 3.711,
          y: 5.805
        }
      ],
      _score: 1.7994,
      _gray: 0.8625,
      _color: 0.125,
      _border: 0.0625,
      _edge: 0.3333,
      _snap_vertices: 10
    },
    {
      id: "default-large-east",
      name: "Ruina este",
      kind: "ruin",
      preset: "large",
      x: 34.962,
      y: 21.636,
      width: 7,
      height: 11.5,
      rotation: -87,
      polygon: [
        {
          x: 3.723,
          y: -6.089
        },
        {
          x: -3.837,
          y: -5.951
        },
        {
          x: -3.723,
          y: 6.089
        },
        {
          x: 3.837,
          y: 5.951
        }
      ],
      _score: 0.9054,
      _gray: 0.6625,
      _color: 0.0375,
      _border: 0.0417,
      _edge: 0.2083,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-left",
      name: "Ruina central izquierda",
      kind: "ruin",
      preset: "splitLarge",
      x: 19.533,
      y: 29.812,
      width: 10,
      height: 12,
      rotation: 0,
      polygon: [
        {
          x: -2.421,
          y: -6.077
        },
        {
          x: -2.582,
          y: 6.227
        },
        {
          x: 1.985,
          y: 6.42
        },
        {
          x: 2.982,
          y: -5.883
        }
      ],
      _score: 1.7296,
      _gray: 0.7,
      _color: 0.2,
      _border: 0.0208,
      _edge: 0.5417,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-right",
      name: "Ruina central derecha",
      kind: "ruin",
      preset: "splitLarge",
      x: 21.509,
      y: 33.134,
      width: 10,
      height: 12,
      rotation: 0,
      polygon: [
        {
          x: -2.404,
          y: -6.428
        },
        {
          x: -3.433,
          y: 5.94
        },
        {
          x: 2.839,
          y: 6.134
        },
        {
          x: 3.032,
          y: -6.234
        }
      ],
      _score: -0.4024,
      _gray: 0.7375,
      _color: 0.225,
      _border: 0.0417,
      _edge: 0.4375,
      _snap_vertices: 4
    },
    {
      id: "default-large-south",
      name: "Ruina castillo sur",
      kind: "ruin",
      preset: "large",
      x: 24.742,
      y: 45.45,
      width: 7,
      height: 11.5,
      rotation: -89,
      polygon: [
        {
          x: 3.719,
          y: -6.089
        },
        {
          x: -3.836,
          y: -5.957
        },
        {
          x: -3.723,
          y: 6.072
        },
        {
          x: 3.833,
          y: 5.973
        }
      ],
      _score: 1.7962,
      _gray: 0.85,
      _color: 0.15,
      _border: 0.0625,
      _edge: 0.3333,
      _snap_vertices: 4
    },
    {
      id: "default-medium-west",
      name: "Ruina oeste media",
      kind: "ruin",
      preset: "medium",
      x: 2.649,
      y: 22.241,
      width: 6,
      height: 4,
      rotation: 0,
      polygon: [
        {
          x: -2.649,
          y: -2.219
        },
        {
          x: -2.649,
          y: 2.27
        },
        {
          x: 2.723,
          y: 2.141
        },
        {
          x: 2.626,
          y: -2.219
        }
      ],
      _score: -0.8633,
      _gray: 0,
      _color: 0,
      _border: 0.275,
      _edge: 0.125,
      _snap_vertices: 4
    },
    {
      id: "default-medium-east-corner",
      name: "Ruina espejo de oeste media",
      kind: "ruin",
      preset: "medium",
      x: 41.303,
      y: 39.552,
      width: 6,
      height: 4,
      rotation: 0,
      polygon: [
        {
          x: -2.739,
          y: -2.157
        },
        {
          x: -2.642,
          y: 2.203
        },
        {
          x: 2.665,
          y: 2.235
        },
        {
          x: 2.665,
          y: -2.254
        }
      ],
      _score: -1.1077,
      _gray: 0,
      _color: 0.0125,
      _border: 0.15,
      _edge: 0.025,
      _snap_vertices: 4
    },
    {
      id: "default-medium-east",
      name: "Ruina este media",
      kind: "ruin",
      preset: "medium",
      x: 33.9,
      y: 36.561,
      width: 6,
      height: 4,
      rotation: -66,
      polygon: [
        {
          x: 3.297,
          y: -2.136
        },
        {
          x: -3.227,
          y: -2.259
        },
        {
          x: -3.286,
          y: 2.133
        },
        {
          x: 3.208,
          y: 2.269
        }
      ],
      _score: 0.9996,
      _gray: 0.6875,
      _color: 0.2125,
      _border: 0.0833,
      _edge: 0.0833,
      _snap_vertices: 4
    },
    {
      id: "default-medium-west-inner",
      name: "Ruina oeste media 2",
      kind: "ruin",
      preset: "medium",
      x: 10.47,
      y: 23.067,
      width: 6,
      height: 4,
      rotation: -68,
      polygon: [
        {
          x: 3.301,
          y: -2.115
        },
        {
          x: -3.202,
          y: -2.263
        },
        {
          x: -3.313,
          y: 2.118
        },
        {
          x: 3.22,
          y: 2.254
        }
      ],
      _score: 0.9719,
      _gray: 0.65,
      _color: 0.2625,
      _border: 0.0625,
      _edge: 0.125,
      _snap_vertices: 4
    },
    {
      id: "default-long-north-east",
      name: "Barricada norte-este",
      kind: "barricade",
      preset: "longLine",
      x: 33.12,
      y: 11.179,
      width: 10,
      height: 2.5,
      rotation: 16,
      polygon: [
        {
          x: -5.272,
          y: -1.383
        },
        {
          x: -5.107,
          y: 1.526
        },
        {
          x: 5.287,
          y: 1.368
        },
        {
          x: 5.131,
          y: -1.51
        }
      ],
      _score: 1.4048,
      _gray: 0.4875,
      _color: 0.425,
      _border: 0.0625,
      _edge: 0.3333,
      _snap_vertices: 4
    },
    {
      id: "default-long-south-west",
      name: "Barricada sur-oeste",
      kind: "barricade",
      preset: "longLine",
      x: 10.65,
      y: 49.035,
      width: 10,
      height: 2.5,
      rotation: 8,
      polygon: [
        {
          x: -5.225,
          y: -1.334
        },
        {
          x: -5.085,
          y: 1.516
        },
        {
          x: 5.278,
          y: 1.298
        },
        {
          x: 5.115,
          y: -1.483
        }
      ],
      _score: 1.3096,
      _gray: 0.5625,
      _color: 0.4375,
      _border: 0,
      _edge: 0.3125,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west",
      name: "Barricada norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 13.654,
      y: 18.897,
      width: 6,
      height: 2,
      rotation: -20,
      polygon: [
        {
          x: 3.243,
          y: -1.06
        },
        {
          x: -3.053,
          y: -1.255
        },
        {
          x: -3.271,
          y: 1.037
        },
        {
          x: 3.044,
          y: 1.273
        }
      ],
      _score: 0.6609,
      _gray: 0.85,
      _color: 0.15,
      _border: 0.0417,
      _edge: 0.1875,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east",
      name: "Barricada sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 30.716,
      y: 40.64,
      width: 6,
      height: 2,
      rotation: -14,
      polygon: [
        {
          x: 3.219,
          y: -1.078
        },
        {
          x: -3.078,
          y: -1.217
        },
        {
          x: -3.219,
          y: 1.078
        },
        {
          x: 3.078,
          y: 1.217
        }
      ],
      _score: 0.6009,
      _gray: 0.8,
      _color: 0.2,
      _border: 0,
      _edge: 0.2083,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west-vertical",
      name: "Ruina norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 8.54,
      y: 13.731,
      width: 6,
      height: 2,
      rotation: 83,
      polygon: [
        {
          x: -3.2,
          y: -1.024
        },
        {
          x: -3.082,
          y: 1.194
        },
        {
          x: 3.186,
          y: 1.024
        },
        {
          x: 3.1,
          y: -1.19
        }
      ],
      _score: 1.1425,
      _gray: 0.7625,
      _color: 0.3125,
      _border: 0,
      _edge: 0.25,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east-vertical",
      name: "Ruina sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 34.382,
      y: 46.202,
      width: 6,
      height: 2,
      rotation: -84,
      polygon: [
        {
          x: 3.196,
          y: -1.014
        },
        {
          x: -3.09,
          y: -1.194
        },
        {
          x: -3.182,
          y: 1.014
        },
        {
          x: 3.071,
          y: 1.198
        }
      ],
      _score: 1.7817,
      _gray: 0.1125,
      _color: 0.8375,
      _border: 0,
      _edge: 0.2083,
      _snap_vertices: 4
    }
  ],
  "reconnaissance__reconnaissance__layout-b": [
    {
      id: "default-large-south-west",
      name: "Ruina sur-oeste",
      kind: "ruin",
      preset: "large",
      x: 10.449,
      y: 43.411,
      width: 7,
      height: 11.5,
      rotation: 90,
      polygon: [
        {
          x: -2.011,
          y: -1.548
        },
        {
          x: -1.462,
          y: -1.162
        },
        {
          x: -1.43,
          y: -0.519
        },
        {
          x: -0.978,
          y: -0.455
        },
        {
          x: -0.397,
          y: 1.443
        },
        {
          x: 0.055,
          y: 1.057
        },
        {
          x: 0.572,
          y: 2.472
        },
        {
          x: 0.992,
          y: 2.472
        },
        {
          x: 0.927,
          y: -1.387
        }
      ],
      _score: 2.2,
      _gray: 1,
      _color: 0,
      _border: 0.125,
      _edge: 0.5417,
      _snap_vertices: 9
    },
    {
      id: "default-large-north",
      name: "Ruina castillo norte",
      kind: "ruin",
      preset: "large",
      x: 21.713,
      y: 12.764,
      width: 7,
      height: 11.5,
      rotation: -75,
      polygon: [
        {
          x: 3.818,
          y: -6.12
        },
        {
          x: -3.864,
          y: -6.093
        },
        {
          x: -3.795,
          y: 6.142
        },
        {
          x: 3.847,
          y: 6.092
        }
      ],
      _score: 0.3785,
      _gray: 0.4875,
      _color: 0.125,
      _border: 0.0417,
      _edge: 0.125,
      _snap_vertices: 4
    },
    {
      id: "default-large-east",
      name: "Ruina este",
      kind: "ruin",
      preset: "large",
      x: 38.355,
      y: 22.519,
      width: 7,
      height: 11.5,
      rotation: 90,
      polygon: [
        {
          x: -3.757,
          y: 5.709
        },
        {
          x: 3.8,
          y: 5.612
        },
        {
          x: 3.865,
          y: -5.613
        },
        {
          x: -3.886,
          y: -5.613
        }
      ],
      _score: 1.9929,
      _gray: 0.8625,
      _color: 0.1375,
      _border: 0.0238,
      _edge: 0.5952,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-left",
      name: "Ruina central izquierda",
      kind: "ruin",
      preset: "splitLarge",
      x: 21.278,
      y: 33.811,
      width: 10,
      height: 12,
      rotation: 0,
      polygon: [
        {
          x: -2.43,
          y: -6.071
        },
        {
          x: -2.591,
          y: 6.233
        },
        {
          x: 1.976,
          y: 6.426
        },
        {
          x: 3.006,
          y: -5.877
        }
      ],
      _score: -0.6468,
      _gray: 0.8125,
      _color: 0.15,
      _border: 0.125,
      _edge: 0.3125,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-right",
      name: "Ruina central derecha",
      kind: "ruin",
      preset: "splitLarge",
      x: 24.009,
      y: 32.138,
      width: 10,
      height: 12,
      rotation: 0,
      polygon: [
        {
          x: -2.395,
          y: -6.433
        },
        {
          x: -3.457,
          y: 5.935
        },
        {
          x: 2.847,
          y: 6.129
        },
        {
          x: 3.04,
          y: -6.239
        }
      ],
      _score: 1.7477,
      _gray: 0.8625,
      _color: 0.1,
      _border: 0.0208,
      _edge: 0.3542,
      _snap_vertices: 4
    },
    {
      id: "default-large-south",
      name: "Ruina castillo sur",
      kind: "ruin",
      preset: "large",
      x: 21.839,
      y: 45.549,
      width: 7,
      height: 11.5,
      rotation: 89,
      polygon: [
        {
          x: -3.721,
          y: -6.08
        },
        {
          x: -3.835,
          y: 5.981
        },
        {
          x: 3.721,
          y: 6.08
        },
        {
          x: 3.835,
          y: -5.981
        }
      ],
      _score: 0.5698,
      _gray: 0.575,
      _color: 0.05,
      _border: 0,
      _edge: 0.2708,
      _snap_vertices: 4
    },
    {
      id: "default-medium-west",
      name: "Ruina oeste media",
      kind: "ruin",
      preset: "medium",
      x: 6.352,
      y: 21.346,
      width: 6,
      height: 4,
      rotation: 0,
      polygon: [
        {
          x: -3.232,
          y: -2.131
        },
        {
          x: -3.136,
          y: 2.228
        },
        {
          x: 3.232,
          y: 2.131
        },
        {
          x: 3.136,
          y: -2.228
        }
      ],
      _score: 0.9654,
      _gray: 0.65,
      _color: 0.275,
      _border: 0.1042,
      _edge: 0.1042,
      _snap_vertices: 4
    },
    {
      id: "default-medium-east-corner",
      name: "Ruina espejo de oeste media",
      kind: "ruin",
      preset: "medium",
      x: 37.591,
      y: 38.879,
      width: 6,
      height: 4,
      rotation: -7,
      polygon: [
        {
          x: 3.256,
          y: -2.169
        },
        {
          x: -3.183,
          y: -2.244
        },
        {
          x: -3.24,
          y: 2.174
        },
        {
          x: 3.168,
          y: 2.245
        }
      ],
      _score: 0.9908,
      _gray: 0.65,
      _color: 0.25,
      _border: 0.0833,
      _edge: 0.1667,
      _snap_vertices: 4
    },
    {
      id: "default-medium-east",
      name: "Ruina este media",
      kind: "ruin",
      preset: "medium",
      x: 33.901,
      y: 33.165,
      width: 6,
      height: 4,
      rotation: 90,
      polygon: [
        {
          x: -3.229,
          y: 2.123
        },
        {
          x: 3.132,
          y: 2.219
        },
        {
          x: 3.229,
          y: -2.123
        },
        {
          x: -3.132,
          y: -2.219
        }
      ],
      _score: 1.9646,
      _gray: 1,
      _color: 0,
      _border: 0.0833,
      _edge: 0.3542,
      _snap_vertices: 4
    },
    {
      id: "default-medium-west-inner",
      name: "Ruina oeste media 2",
      kind: "ruin",
      preset: "medium",
      x: 10.028,
      y: 29.226,
      width: 6,
      height: 4,
      rotation: 84,
      polygon: [
        {
          x: -1.465,
          y: -2.134
        },
        {
          x: -0.681,
          y: -0.629
        },
        {
          x: -1.456,
          y: 0.874
        },
        {
          x: -0.489,
          y: 1.558
        },
        {
          x: -1.653,
          y: 2.438
        },
        {
          x: -0.065,
          y: 2.153
        },
        {
          x: -0.246,
          y: 1.099
        },
        {
          x: 0.718,
          y: 2.429
        },
        {
          x: 1.25,
          y: -2.011
        },
        {
          x: -0.491,
          y: -2.129
        },
        {
          x: -0.66,
          y: -1.144
        }
      ],
      _score: 1.8271,
      _gray: 1,
      _color: 0,
      _border: 0.0208,
      _edge: 0.2917,
      _snap_vertices: 11
    },
    {
      id: "default-long-north-east",
      name: "Barricada norte-este",
      kind: "barricade",
      preset: "longLine",
      x: 32.083,
      y: 12.578,
      width: 10,
      height: 2.5,
      rotation: 6,
      polygon: [
        {
          x: -5.229,
          y: -1.285
        },
        {
          x: -5.102,
          y: 1.462
        },
        {
          x: 5.229,
          y: 1.285
        },
        {
          x: 5.102,
          y: -1.462
        }
      ],
      _score: 0.9625,
      _gray: 0.5875,
      _color: 0.175,
      _border: 0,
      _edge: 0.375,
      _snap_vertices: 4
    },
    {
      id: "default-long-south-west",
      name: "Barricada sur-oeste",
      kind: "barricade",
      preset: "longLine",
      x: 12.049,
      y: 47.908,
      width: 10,
      height: 2.5,
      rotation: -8,
      polygon: [
        {
          x: 5.294,
          y: -1.296
        },
        {
          x: -5.069,
          y: -1.513
        },
        {
          x: -5.241,
          y: 1.332
        },
        {
          x: 5.099,
          y: 1.481
        }
      ],
      _score: 0.9768,
      _gray: 0.6,
      _color: 0.2125,
      _border: 0,
      _edge: 0.3542,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west",
      name: "Barricada norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 11.901,
      y: 21.507,
      width: 6,
      height: 2,
      rotation: -13,
      polygon: [
        {
          x: 3.22,
          y: -1.079
        },
        {
          x: -3.088,
          y: -1.21
        },
        {
          x: -3.22,
          y: 1.079
        },
        {
          x: 3.088,
          y: 1.21
        }
      ],
      _score: 1.4456,
      _gray: 0.5625,
      _color: 0.4375,
      _border: 0.0208,
      _edge: 0.3958,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east",
      name: "Barricada sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 31.964,
      y: 38.897,
      width: 6,
      height: 2,
      rotation: -10,
      polygon: [
        {
          x: 3.204,
          y: -1.092
        },
        {
          x: -3.077,
          y: -1.216
        },
        {
          x: -3.222,
          y: 1.087
        },
        {
          x: 3.091,
          y: 1.216
        }
      ],
      _score: 1.5154,
      _gray: 0.525,
      _color: 0.475,
      _border: 0.0417,
      _edge: 0.375,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west-vertical",
      name: "Ruina norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 9.537,
      y: 12.384,
      width: 6,
      height: 2,
      rotation: 90,
      polygon: [
        {
          x: -3.149,
          y: 1.013
        },
        {
          x: 3.052,
          y: 1.174
        },
        {
          x: 3.149,
          y: -1.013
        },
        {
          x: -3.052,
          y: -1.174
        }
      ],
      _score: 1.4017,
      _gray: 0.475,
      _color: 0.5375,
      _border: 0.0417,
      _edge: 0.1875,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east-vertical",
      name: "Ruina sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 35.678,
      y: 47.339,
      width: 6,
      height: 2,
      rotation: 62,
      polygon: [
        {
          x: -3.326,
          y: -1.03
        },
        {
          x: -3.048,
          y: 1.267
        },
        {
          x: 3.22,
          y: 1.103
        },
        {
          x: 3.046,
          y: -1.321
        }
      ],
      _score: 1.4925,
      _gray: 0.4375,
      _color: 0.5375,
      _border: 0.0417,
      _edge: 0.2708,
      _snap_vertices: 4
    }
  ],
  "reconnaissance__reconnaissance__layout-c": [
    {
      id: "default-large-south-west",
      name: "Ruina sur-oeste",
      kind: "ruin",
      preset: "large",
      x: 5.502,
      y: 39.261,
      width: 7,
      height: 11.5,
      rotation: 90,
      polygon: [
        {
          x: -6.548,
          y: 5.502
        },
        {
          x: 1.202,
          y: 5.502
        },
        {
          x: -0.122,
          y: 5.212
        },
        {
          x: -0.122,
          y: 1.61
        },
        {
          x: 1.202,
          y: 1.481
        },
        {
          x: 1.041,
          y: -4.823
        },
        {
          x: -0.348,
          y: -4.533
        },
        {
          x: -0.251,
          y: 1.932
        },
        {
          x: -1.575,
          y: 1.063
        },
        {
          x: -0.251,
          y: 5.212
        }
      ],
      _score: 2.0975,
      _gray: 1,
      _color: 0,
      _border: 0.075,
      _edge: 0.5,
      _snap_vertices: 10
    },
    {
      id: "default-large-north",
      name: "Ruina castillo norte",
      kind: "ruin",
      preset: "large",
      x: 21.711,
      y: 16.518,
      width: 7,
      height: 11.5,
      rotation: 90,
      polygon: [
        {
          x: -3.73,
          y: 6.079
        },
        {
          x: 3.827,
          y: 5.982
        },
        {
          x: 3.73,
          y: -6.079
        },
        {
          x: -3.827,
          y: -5.982
        }
      ],
      _score: 1.0481,
      _gray: 0.725,
      _color: 0.0375,
      _border: 0,
      _edge: 0.3333,
      _snap_vertices: 4
    },
    {
      id: "default-large-east",
      name: "Ruina este",
      kind: "ruin",
      preset: "large",
      x: 38.213,
      y: 23.034,
      width: 7,
      height: 11.5,
      rotation: -82,
      polygon: [
        {
          x: 3.711,
          y: -5.915
        },
        {
          x: -3.788,
          y: -5.674
        },
        {
          x: -3.667,
          y: 6.327
        },
        {
          x: 3.976,
          y: 5.253
        },
        {
          x: 3.994,
          y: 2.132
        },
        {
          x: 1.32,
          y: 1.664
        },
        {
          x: 3.997,
          y: 1.222
        }
      ],
      _score: 1.9432,
      _gray: 1,
      _color: 0,
      _border: 0.1136,
      _edge: 0.2727,
      _snap_vertices: 7
    },
    {
      id: "default-large-center-left",
      name: "Ruina central izquierda",
      kind: "ruin",
      preset: "splitLarge",
      x: 22.041,
      y: 30.813,
      width: 10,
      height: 12,
      rotation: 0,
      polygon: [
        {
          x: -2.421,
          y: -6.077
        },
        {
          x: -2.582,
          y: 6.227
        },
        {
          x: 1.985,
          y: 6.42
        },
        {
          x: 2.982,
          y: -5.883
        }
      ],
      _score: -0.089,
      _gray: 0.775,
      _color: 0.1625,
      _border: 0.1458,
      _edge: 0.4167,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-right",
      name: "Ruina central derecha",
      kind: "ruin",
      preset: "splitLarge",
      x: 22.015,
      y: 31.137,
      width: 10,
      height: 12,
      rotation: 0,
      polygon: [
        {
          x: -2.395,
          y: -6.433
        },
        {
          x: -3.457,
          y: 5.935
        },
        {
          x: 2.847,
          y: 6.129
        },
        {
          x: 3.04,
          y: -6.239
        }
      ],
      _score: 1.8467,
      _gray: 0.8125,
      _color: 0.1375,
      _border: 0.1042,
      _edge: 0.4167,
      _snap_vertices: 4
    },
    {
      id: "default-large-south",
      name: "Ruina castillo sur",
      kind: "ruin",
      preset: "large",
      x: 22.241,
      y: 43.547,
      width: 7,
      height: 11.5,
      rotation: 90,
      polygon: [
        {
          x: -3.73,
          y: 6.063
        },
        {
          x: 3.827,
          y: 5.966
        },
        {
          x: 3.73,
          y: -6.063
        },
        {
          x: -3.827,
          y: -5.966
        }
      ],
      _score: 1.0925,
      _gray: 0.7375,
      _color: 0.0375,
      _border: 0,
      _edge: 0.2917,
      _snap_vertices: 4
    },
    {
      id: "default-medium-west",
      name: "Ruina oeste media",
      kind: "ruin",
      preset: "medium",
      x: 0.378,
      y: 22.727,
      width: 6,
      height: 4,
      rotation: 0,
      polygon: [
        {
          x: -0.121,
          y: -2.35
        },
        {
          x: -0.378,
          y: -2.35
        },
        {
          x: -0.378,
          y: 2.106
        },
        {
          x: -0.121,
          y: 0.847
        },
        {
          x: 0.49,
          y: 0.814
        },
        {
          x: 0.715,
          y: 1.493
        },
        {
          x: 0.876,
          y: 0.427
        },
        {
          x: -0.121,
          y: 0.039
        }
      ],
      _score: 1.9025,
      _gray: 1,
      _color: 0,
      _border: 0.15,
      _edge: 0.175,
      _snap_vertices: 8
    },
    {
      id: "default-medium-east-corner",
      name: "Ruina espejo de oeste media",
      kind: "ruin",
      preset: "medium",
      x: 40.849,
      y: 37.9,
      width: 6,
      height: 4,
      rotation: 0,
      polygon: [
        {
          x: -3.024,
          y: -2.217
        },
        {
          x: 0.031,
          y: -0.117
        },
        {
          x: -2.96,
          y: -1.151
        },
        {
          x: -3.057,
          y: 1.949
        },
        {
          x: 3.119,
          y: 1.949
        },
        {
          x: 3.119,
          y: -2.507
        },
        {
          x: 2.411,
          y: -0.473
        },
        {
          x: 1.318,
          y: -0.473
        },
        {
          x: 1.607,
          y: -2.507
        }
      ],
      _score: 2.1229,
      _gray: 1,
      _color: 0,
      _border: 0.1667,
      _edge: 0.3958,
      _snap_vertices: 9
    },
    {
      id: "default-medium-east",
      name: "Ruina este media",
      kind: "ruin",
      preset: "medium",
      x: 36.89,
      y: 32.72,
      width: 6,
      height: 4,
      rotation: 90,
      polygon: [
        {
          x: -3.075,
          y: 2.089
        },
        {
          x: 3.286,
          y: 2.185
        },
        {
          x: 3.416,
          y: -0.42
        },
        {
          x: 2.511,
          y: -0.195
        },
        {
          x: 2.479,
          y: -2.318
        },
        {
          x: -2.978,
          y: -2.286
        }
      ],
      _score: 2.0329,
      _gray: 0.95,
      _color: 0,
      _border: 0.2292,
      _edge: 0.2917,
      _snap_vertices: 6
    },
    {
      id: "default-medium-west-inner",
      name: "Ruina oeste media 2",
      kind: "ruin",
      preset: "medium",
      x: 8.417,
      y: 28.115,
      width: 6,
      height: 4,
      rotation: 88,
      polygon: [
        {
          x: -3.209,
          y: -2.15
        },
        {
          x: -3.136,
          y: 2.23
        },
        {
          x: 3.233,
          y: 2.13
        },
        {
          x: 3.127,
          y: -2.218
        }
      ],
      _score: 1.9058,
      _gray: 0.9625,
      _color: 0.0375,
      _border: 0.0833,
      _edge: 0.3125,
      _snap_vertices: 4
    },
    {
      id: "default-long-north-east",
      name: "Barricada norte-este",
      kind: "barricade",
      preset: "longLine",
      x: 33.959,
      y: 14.014,
      width: 10,
      height: 2.5,
      rotation: 7,
      polygon: [
        {
          x: -5.214,
          y: -1.343
        },
        {
          x: -5.092,
          y: 1.505
        },
        {
          x: 5.286,
          y: 1.304
        },
        {
          x: 5.107,
          y: -1.472
        }
      ],
      _score: 0.986,
      _gray: 0.8875,
      _color: 0.1,
      _border: 0.1042,
      _edge: 0.2917,
      _snap_vertices: 4
    },
    {
      id: "default-long-south-west",
      name: "Barricada sur-oeste",
      kind: "barricade",
      preset: "longLine",
      x: 11.943,
      y: 45.817,
      width: 10,
      height: 2.5,
      rotation: -4,
      polygon: [
        {
          x: 5.24,
          y: -1.31
        },
        {
          x: -5.097,
          y: -1.482
        },
        {
          x: -5.167,
          y: 1.361
        },
        {
          x: 5.145,
          y: 1.435
        }
      ],
      _score: 0.8348,
      _gray: 0.975,
      _color: 0,
      _border: 0.0625,
      _edge: 0.3333,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west",
      name: "Barricada norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 12.206,
      y: 18.1,
      width: 6,
      height: 2,
      rotation: 10,
      polygon: [
        {
          x: -3.213,
          y: -1.089
        },
        {
          x: -3.1,
          y: 1.219
        },
        {
          x: 3.213,
          y: 1.089
        },
        {
          x: 3.1,
          y: -1.219
        }
      ],
      _score: 1.6483,
      _gray: 0.4125,
      _color: 0.65,
      _border: 0,
      _edge: 0.375,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east",
      name: "Barricada sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 31.906,
      y: 42.142,
      width: 6,
      height: 2,
      rotation: 16,
      polygon: [
        {
          x: -3.215,
          y: -1.06
        },
        {
          x: -3.065,
          y: 1.215
        },
        {
          x: 3.215,
          y: 1.06
        },
        {
          x: 3.065,
          y: -1.215
        }
      ],
      _score: 1.7192,
      _gray: 0.3625,
      _color: 0.6625,
      _border: 0.0417,
      _edge: 0.3125,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west-vertical",
      name: "Ruina norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 7.099,
      y: 10.544,
      width: 6,
      height: 2,
      rotation: 89,
      polygon: [
        {
          x: -3.169,
          y: 1.094
        },
        {
          x: 3.096,
          y: 1.171
        },
        {
          x: 3.167,
          y: -1.08
        },
        {
          x: -3.064,
          y: -1.188
        }
      ],
      _score: 0.7235,
      _gray: 0.6125,
      _color: 0.2875,
      _border: 0.0208,
      _edge: 0.25,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east-vertical",
      name: "Ruina sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 36.571,
      y: 49.491,
      width: 6,
      height: 2,
      rotation: -89,
      polygon: [
        {
          x: 3.132,
          y: -1.085
        },
        {
          x: -3.102,
          y: -1.137
        },
        {
          x: -3.194,
          y: 1.019
        },
        {
          x: 3.043,
          y: 1.2
        }
      ],
      _score: 0.6956,
      _gray: 0.6375,
      _color: 0.2125,
      _border: 0.0208,
      _edge: 0.3125,
      _snap_vertices: 4
    }
  ],
  "reconnaissance__priority-assets__layout-a": [
    {
      id: "default-large-south-west",
      name: "Ruina sur-oeste",
      kind: "ruin",
      preset: "large",
      x: 7.457,
      y: 37.984,
      width: 7,
      height: 11.5,
      rotation: 90,
      polygon: [
        {
          x: -2.688,
          y: -3.703
        },
        {
          x: -2.268,
          y: 3.437
        },
        {
          x: -0.912,
          y: 3.437
        },
        {
          x: -1.364,
          y: 1.443
        },
        {
          x: 5.03,
          y: 2.536
        },
        {
          x: 5.03,
          y: 0.285
        },
        {
          x: 0.283,
          y: 1.25
        },
        {
          x: 0.089,
          y: -3.607
        }
      ],
      _score: 1.8988,
      _gray: 0.9625,
      _color: 0.0125,
      _border: 0.0952,
      _edge: 0.3333,
      _snap_vertices: 8
    },
    {
      id: "default-large-north",
      name: "Ruina castillo norte",
      kind: "ruin",
      preset: "large",
      x: 22.213,
      y: 16.459,
      width: 7,
      height: 11.5,
      rotation: -86,
      polygon: [
        {
          x: 3.671,
          y: -6.145
        },
        {
          x: -3.889,
          y: -5.939
        },
        {
          x: -3.66,
          y: 6.136
        },
        {
          x: 3.871,
          y: 5.964
        }
      ],
      _score: 1.1815,
      _gray: 0.8,
      _color: 0.0125,
      _border: 0.0208,
      _edge: 0.2292,
      _snap_vertices: 4
    },
    {
      id: "default-large-east",
      name: "Ruina este",
      kind: "ruin",
      preset: "large",
      x: 38.844,
      y: 20.552,
      width: 7,
      height: 11.5,
      rotation: 90,
      polygon: [
        {
          x: -3.792,
          y: 5.169
        },
        {
          x: 3.796,
          y: 5.137
        },
        {
          x: 3.861,
          y: -5.124
        },
        {
          x: -3.857,
          y: -5.124
        }
      ],
      _score: 2.1275,
      _gray: 1,
      _color: 0,
      _border: 0.15,
      _edge: 0.425,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-left",
      name: "Ruina central izquierda",
      kind: "ruin",
      preset: "splitLarge",
      x: 20.024,
      y: 29.806,
      width: 10,
      height: 12,
      rotation: 0,
      polygon: [
        {
          x: -2.43,
          y: -6.071
        },
        {
          x: -2.591,
          y: 6.233
        },
        {
          x: 1.976,
          y: 6.426
        },
        {
          x: 3.006,
          y: -5.877
        }
      ],
      _score: 1.7356,
      _gray: 0.725,
      _color: 0.1625,
      _border: 0,
      _edge: 0.5625,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-right",
      name: "Ruina central derecha",
      kind: "ruin",
      preset: "splitLarge",
      x: 22.008,
      y: 34.466,
      width: 10,
      height: 12,
      rotation: 2,
      polygon: [
        {
          x: -2.455,
          y: -6.484
        },
        {
          x: -3.435,
          y: 6.023
        },
        {
          x: 2.878,
          y: 6.158
        },
        {
          x: 3.056,
          y: -6.256
        }
      ],
      _score: -0.1676,
      _gray: 0.9625,
      _color: 0.025,
      _border: 0,
      _edge: 0.25,
      _snap_vertices: 4
    },
    {
      id: "default-large-south",
      name: "Ruina castillo sur",
      kind: "ruin",
      preset: "large",
      x: 22.289,
      y: 44.952,
      width: 7,
      height: 11.5,
      rotation: 76,
      polygon: [
        {
          x: -3.8,
          y: -6.118
        },
        {
          x: -3.851,
          y: 6.101
        },
        {
          x: 3.8,
          y: 6.118
        },
        {
          x: 3.851,
          y: -6.101
        }
      ],
      _score: 0.5625,
      _gray: 0.6125,
      _color: 0.1125,
      _border: 0,
      _edge: 0.25,
      _snap_vertices: 4
    },
    {
      id: "default-medium-west",
      name: "Ruina oeste media",
      kind: "ruin",
      preset: "medium",
      x: 5.645,
      y: 22.476,
      width: 6,
      height: 4,
      rotation: 0,
      polygon: [
        {
          x: -3.232,
          y: -2.131
        },
        {
          x: -3.136,
          y: 2.228
        },
        {
          x: 3.232,
          y: 2.131
        },
        {
          x: 3.136,
          y: -2.228
        }
      ],
      _score: 1.0935,
      _gray: 0.6375,
      _color: 0.3,
      _border: 0.1042,
      _edge: 0.125,
      _snap_vertices: 4
    },
    {
      id: "default-medium-east-corner",
      name: "Ruina espejo de oeste media",
      kind: "ruin",
      preset: "medium",
      x: 39.232,
      y: 37.474,
      width: 6,
      height: 4,
      rotation: -1,
      polygon: [
        {
          x: 3.23,
          y: -2.122
        },
        {
          x: -3.138,
          y: -2.233
        },
        {
          x: -3.214,
          y: 2.126
        },
        {
          x: 3.122,
          y: 2.236
        }
      ],
      _score: 1.1371,
      _gray: 0.625,
      _color: 0.275,
      _border: 0.1458,
      _edge: 0.0833,
      _snap_vertices: 4
    },
    {
      id: "default-medium-east",
      name: "Ruina este media",
      kind: "ruin",
      preset: "medium",
      x: 33.45,
      y: 33.549,
      width: 6,
      height: 4,
      rotation: 90,
      polygon: [
        {
          x: -3.226,
          y: 2.122
        },
        {
          x: 0.682,
          y: 2.219
        },
        {
          x: 1.263,
          y: 1.511
        },
        {
          x: 1.037,
          y: 2.219
        },
        {
          x: 3.136,
          y: 2.219
        },
        {
          x: 3.233,
          y: -2.123
        },
        {
          x: -3.129,
          y: -2.22
        }
      ],
      _score: 2.1056,
      _gray: 0.9875,
      _color: 0,
      _border: 0.125,
      _edge: 0.4583,
      _snap_vertices: 7
    },
    {
      id: "default-medium-west-inner",
      name: "Ruina oeste media 2",
      kind: "ruin",
      preset: "medium",
      x: 11.173,
      y: 27.369,
      width: 6,
      height: 4,
      rotation: -82,
      polygon: [
        {
          x: 3.744,
          y: -2.487
        },
        {
          x: 1.59,
          y: -1.567
        },
        {
          x: 2.699,
          y: -1.333
        },
        {
          x: 3.254,
          y: 1.22
        },
        {
          x: -0.2,
          y: 1.705
        },
        {
          x: -0.199,
          y: -0.146
        },
        {
          x: -1.552,
          y: -0.021
        },
        {
          x: -0.797,
          y: -2.076
        },
        {
          x: -2.659,
          y: -2.561
        },
        {
          x: -2.726,
          y: 1.833
        },
        {
          x: 3.617,
          y: 1.948
        }
      ],
      _score: 1.9125,
      _gray: 1,
      _color: 0,
      _border: 0.0625,
      _edge: 0.3125,
      _snap_vertices: 11
    },
    {
      id: "default-long-north-east",
      name: "Barricada norte-este",
      kind: "barricade",
      preset: "longLine",
      x: 31.548,
      y: 15.225,
      width: 10,
      height: 2.5,
      rotation: 0,
      polygon: [
        {
          x: -5.174,
          y: -1.339
        },
        {
          x: -5.013,
          y: 1.438
        },
        {
          x: 5.183,
          y: 1.309
        },
        {
          x: 5.086,
          y: -1.404
        }
      ],
      _score: 1.3253,
      _gray: 0.525,
      _color: 0.475,
      _border: 0.0208,
      _edge: 0.3125,
      _snap_vertices: 4
    },
    {
      id: "default-long-south-west",
      name: "Barricada sur-oeste",
      kind: "barricade",
      preset: "longLine",
      x: 12.988,
      y: 44.266,
      width: 10,
      height: 2.5,
      rotation: -4,
      polygon: [
        {
          x: 5.257,
          y: -1.309
        },
        {
          x: -5.081,
          y: -1.481
        },
        {
          x: -5.183,
          y: 1.36
        },
        {
          x: 5.129,
          y: 1.434
        }
      ],
      _score: 1.3686,
      _gray: 0.4375,
      _color: 0.575,
      _border: 0,
      _edge: 0.2708,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west",
      name: "Barricada norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 12.856,
      y: 21.651,
      width: 6,
      height: 2,
      rotation: -8,
      polygon: [
        {
          x: 3.207,
          y: -1.032
        },
        {
          x: -3.075,
          y: -1.165
        },
        {
          x: -3.19,
          y: 1.036
        },
        {
          x: 3.061,
          y: 1.165
        }
      ],
      _score: 0.9546,
      _gray: 0.7375,
      _color: 0.225,
      _border: 0.0208,
      _edge: 0.2708,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east",
      name: "Barricada sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 31.063,
      y: 38.79,
      width: 6,
      height: 2,
      rotation: 18,
      polygon: [
        {
          x: -3.245,
          y: -1.057
        },
        {
          x: -3.036,
          y: 1.252
        },
        {
          x: 3.254,
          y: 1.042
        },
        {
          x: 3.055,
          y: -1.236
        }
      ],
      _score: 0.84,
      _gray: 0.65,
      _color: 0.175,
      _border: 0.0417,
      _edge: 0.2708,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west-vertical",
      name: "Ruina norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 8.041,
      y: 12.933,
      width: 6,
      height: 2,
      rotation: 90,
      polygon: [
        {
          x: -3.149,
          y: 0.997
        },
        {
          x: 3.052,
          y: 1.158
        },
        {
          x: 3.149,
          y: -0.997
        },
        {
          x: -3.052,
          y: -1.158
        }
      ],
      _score: 0.7438,
      _gray: 1,
      _color: 0,
      _border: 0,
      _edge: 0.3125,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east-vertical",
      name: "Ruina sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 35.866,
      y: 47.344,
      width: 6,
      height: 2,
      rotation: -86,
      polygon: [
        {
          x: 3.131,
          y: -1.092
        },
        {
          x: -3.12,
          y: -1.139
        },
        {
          x: -3.195,
          y: 1.026
        },
        {
          x: 3.065,
          y: 1.201
        }
      ],
      _score: 0.6631,
      _gray: 0.95,
      _color: 0,
      _border: 0.1042,
      _edge: 0.2292,
      _snap_vertices: 4
    }
  ],
  "reconnaissance__priority-assets__layout-b": [
    {
      id: "default-large-south-west",
      name: "Ruina sur-oeste",
      kind: "ruin",
      preset: "large",
      x: 6.637,
      y: 39.879,
      width: 7,
      height: 11.5,
      rotation: 90,
      polygon: [
        {
          x: -6.359,
          y: 6.637
        },
        {
          x: 1.359,
          y: 6.637
        },
        {
          x: 0.196,
          y: 6.348
        },
        {
          x: 1.23,
          y: -5.296
        },
        {
          x: -0.352,
          y: -5.36
        },
        {
          x: 0.067,
          y: 2.199
        },
        {
          x: -1.354,
          y: 1.555
        },
        {
          x: -1.257,
          y: 2.81
        },
        {
          x: 0.067,
          y: 2.81
        },
        {
          x: 0.067,
          y: 6.251
        }
      ],
      _score: 1.9792,
      _gray: 1,
      _color: 0,
      _border: 0.1667,
      _edge: 0.25,
      _snap_vertices: 10
    },
    {
      id: "default-large-north",
      name: "Ruina castillo norte",
      kind: "ruin",
      preset: "large",
      x: 21.325,
      y: 15.016,
      width: 7,
      height: 11.5,
      rotation: -80,
      polygon: [
        {
          x: 3.737,
          y: -6.146
        },
        {
          x: -3.906,
          y: -5.974
        },
        {
          x: -3.737,
          y: 6.146
        },
        {
          x: 3.906,
          y: 5.974
        }
      ],
      _score: 0.6771,
      _gray: 0.6375,
      _color: 0.0375,
      _border: 0.0208,
      _edge: 0.1667,
      _snap_vertices: 4
    },
    {
      id: "default-large-east",
      name: "Ruina este",
      kind: "ruin",
      preset: "large",
      x: 38.031,
      y: 21.513,
      width: 7,
      height: 11.5,
      rotation: 89,
      polygon: [
        {
          x: -3.809,
          y: -6.005
        },
        {
          x: -3.792,
          y: 5.93
        },
        {
          x: 3.732,
          y: 6.029
        },
        {
          x: 3.875,
          y: -5.871
        }
      ],
      _score: 2.0367,
      _gray: 0.9875,
      _color: 0.0125,
      _border: 0.1667,
      _edge: 0.3125,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-left",
      name: "Ruina central izquierda",
      kind: "ruin",
      preset: "splitLarge",
      x: 22.041,
      y: 32.815,
      width: 10,
      height: 12,
      rotation: 0,
      polygon: [
        {
          x: -2.421,
          y: -6.077
        },
        {
          x: -2.582,
          y: 6.227
        },
        {
          x: 1.985,
          y: 6.42
        },
        {
          x: 2.982,
          y: -5.883
        }
      ],
      _score: 0.2428,
      _gray: 0.925,
      _color: 0.05,
      _border: 0.0208,
      _edge: 0.3958,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-right",
      name: "Ruina central derecha",
      kind: "ruin",
      preset: "splitLarge",
      x: 22.015,
      y: 29.184,
      width: 10,
      height: 12,
      rotation: 0,
      polygon: [
        {
          x: -2.395,
          y: -6.45
        },
        {
          x: -3.457,
          y: 5.951
        },
        {
          x: 2.847,
          y: 6.145
        },
        {
          x: 3.04,
          y: -6.256
        }
      ],
      _score: 1.7881,
      _gray: 0.8,
      _color: 0.1125,
      _border: 0.0625,
      _edge: 0.4375,
      _snap_vertices: 4
    },
    {
      id: "default-large-south",
      name: "Ruina castillo sur",
      kind: "ruin",
      preset: "large",
      x: 22.933,
      y: 45.097,
      width: 7,
      height: 11.5,
      rotation: -82,
      polygon: [
        {
          x: 3.65,
          y: -6.164
        },
        {
          x: -3.881,
          y: -5.918
        },
        {
          x: -3.65,
          y: 6.164
        },
        {
          x: 3.881,
          y: 5.918
        }
      ],
      _score: 0.6396,
      _gray: 0.6,
      _color: 0.05,
      _border: 0.0208,
      _edge: 0.125,
      _snap_vertices: 4
    },
    {
      id: "default-medium-west",
      name: "Ruina oeste media",
      kind: "ruin",
      preset: "medium",
      x: 5.036,
      y: 21.666,
      width: 6,
      height: 4,
      rotation: 0,
      polygon: [
        {
          x: -1.015,
          y: -1.354
        },
        {
          x: -1.144,
          y: -0.514
        },
        {
          x: -0.629,
          y: -0.223
        },
        {
          x: -0.115,
          y: 0.972
        },
        {
          x: 0.046,
          y: 2.651
        },
        {
          x: 0.143,
          y: 2.037
        },
        {
          x: 0.722,
          y: 1.876
        },
        {
          x: 0.722,
          y: 1.327
        },
        {
          x: 0.143,
          y: 1.198
        },
        {
          x: 0.175,
          y: 0.81
        },
        {
          x: 0.722,
          y: 0.681
        },
        {
          x: 0.722,
          y: -1.192
        }
      ],
      _score: 2.0275,
      _gray: 0.975,
      _color: 0.025,
      _border: 0.0714,
      _edge: 0.4524,
      _snap_vertices: 12
    },
    {
      id: "default-medium-east-corner",
      name: "Ruina espejo de oeste media",
      kind: "ruin",
      preset: "medium",
      x: 40.743,
      y: 37.675,
      width: 6,
      height: 4,
      rotation: 0,
      polygon: [
        {
          x: -2.919,
          y: -1.992
        },
        {
          x: 0.137,
          y: 0.107
        },
        {
          x: -2.854,
          y: -0.926
        },
        {
          x: -2.983,
          y: 1.98
        },
        {
          x: 1.295,
          y: 2.013
        },
        {
          x: 1.713,
          y: 0.785
        },
        {
          x: 3.225,
          y: 1.98
        },
        {
          x: 3.225,
          y: -2.476
        },
        {
          x: 2.517,
          y: -0.248
        },
        {
          x: 1.263,
          y: -0.7
        },
        {
          x: 1.745,
          y: -2.476
        }
      ],
      _score: 1.9837,
      _gray: 0.9375,
      _color: 0.0375,
      _border: 0.1875,
      _edge: 0.2917,
      _snap_vertices: 11
    },
    {
      id: "default-medium-east",
      name: "Ruina este media",
      kind: "ruin",
      preset: "medium",
      x: 37.792,
      y: 32.067,
      width: 6,
      height: 4,
      rotation: 90,
      polygon: [
        {
          x: -3.229,
          y: 2.123
        },
        {
          x: 3.132,
          y: 2.219
        },
        {
          x: 3.229,
          y: -2.123
        },
        {
          x: -3.132,
          y: -2.219
        }
      ],
      _score: 2.0321,
      _gray: 0.975,
      _color: 0,
      _border: 0.2708,
      _edge: 0.1875,
      _snap_vertices: 4
    },
    {
      id: "default-medium-west-inner",
      name: "Ruina oeste media 2",
      kind: "ruin",
      preset: "medium",
      x: 8.086,
      y: 28.293,
      width: 6,
      height: 4,
      rotation: 84,
      polygon: [
        {
          x: -3.188,
          y: -1.228
        },
        {
          x: -3.409,
          y: 2.727
        },
        {
          x: -1.643,
          y: -1.098
        },
        {
          x: 0.636,
          y: -0.535
        },
        {
          x: -0.57,
          y: 1.053
        },
        {
          x: 1.738,
          y: -0.516
        },
        {
          x: 1.202,
          y: 3.341
        },
        {
          x: 2.596,
          y: -0.652
        },
        {
          x: 3.06,
          y: 3.278
        },
        {
          x: 3.071,
          y: -1.152
        }
      ],
      _score: 1.9146,
      _gray: 1,
      _color: 0,
      _border: 0.0208,
      _edge: 0.375,
      _snap_vertices: 10
    },
    {
      id: "default-long-north-east",
      name: "Barricada norte-este",
      kind: "barricade",
      preset: "longLine",
      x: 30.925,
      y: 15.081,
      width: 10,
      height: 2.5,
      rotation: 10,
      polygon: [
        {
          x: -5.27,
          y: -1.268
        },
        {
          x: -5.078,
          y: 1.486
        },
        {
          x: 5.27,
          y: 1.268
        },
        {
          x: 5.078,
          y: -1.486
        }
      ],
      _score: 0.9645,
      _gray: 0.575,
      _color: 0.1875,
      _border: 0,
      _edge: 0.3958,
      _snap_vertices: 4
    },
    {
      id: "default-long-south-west",
      name: "Barricada sur-oeste",
      kind: "barricade",
      preset: "longLine",
      x: 10.865,
      y: 45.598,
      width: 10,
      height: 2.5,
      rotation: -11,
      polygon: [
        {
          x: 5.268,
          y: -1.279
        },
        {
          x: -5.079,
          y: -1.481
        },
        {
          x: -5.287,
          y: 1.275
        },
        {
          x: 5.092,
          y: 1.483
        }
      ],
      _score: 1.0855,
      _gray: 0.8125,
      _color: 0.125,
      _border: 0.0208,
      _edge: 0.5,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west",
      name: "Barricada norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 10.189,
      y: 19.854,
      width: 6,
      height: 2,
      rotation: -20,
      polygon: [
        {
          x: 3.261,
          y: -1.041
        },
        {
          x: -3.023,
          y: -1.266
        },
        {
          x: -3.253,
          y: 1.056
        },
        {
          x: 3.043,
          y: 1.251
        }
      ],
      _score: 1.6517,
      _gray: 0.4,
      _color: 0.625,
      _border: 0,
      _edge: 0.3333,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east",
      name: "Barricada sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 34.013,
      y: 40.002,
      width: 6,
      height: 2,
      rotation: -2,
      polygon: [
        {
          x: 3.207,
          y: -1.075
        },
        {
          x: -3.098,
          y: -1.166
        },
        {
          x: -3.176,
          y: 1.094
        },
        {
          x: 3.097,
          y: 1.151
        }
      ],
      _score: 1.6783,
      _gray: 0.45,
      _color: 0.6125,
      _border: 0.0417,
      _edge: 0.3125,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west-vertical",
      name: "Ruina norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 6.513,
      y: 11.122,
      width: 6,
      height: 2,
      rotation: -79,
      polygon: [
        {
          x: 3.145,
          y: -1.152
        },
        {
          x: -3.169,
          y: -1.137
        },
        {
          x: -3.233,
          y: 1.07
        },
        {
          x: 3.111,
          y: 1.213
        }
      ],
      _score: 1.0163,
      _gray: 0.8375,
      _color: 0.1875,
      _border: 0,
      _edge: 0.3125,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east-vertical",
      name: "Ruina sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 37.728,
      y: 48.956,
      width: 6,
      height: 2,
      rotation: 85,
      polygon: [
        {
          x: -3.185,
          y: -1.021
        },
        {
          x: -3.086,
          y: 1.183
        },
        {
          x: 3.185,
          y: 1.021
        },
        {
          x: 3.086,
          y: -1.183
        }
      ],
      _score: 1.1283,
      _gray: 0.7625,
      _color: 0.2375,
      _border: 0.0417,
      _edge: 0.3125,
      _snap_vertices: 4
    }
  ],
  "reconnaissance__priority-assets__layout-c": [
    {
      id: "default-large-south-west",
      name: "Ruina sur-oeste",
      kind: "ruin",
      preset: "large",
      x: 9.295,
      y: 40.867,
      width: 7,
      height: 11.5,
      rotation: 90,
      polygon: [
        {
          x: -3.73,
          y: 6.079
        },
        {
          x: 3.827,
          y: 5.982
        },
        {
          x: 3.73,
          y: -6.079
        },
        {
          x: -3.827,
          y: -5.982
        }
      ],
      _score: 1.7396,
      _gray: 1,
      _color: 0,
      _border: 0.0833,
      _edge: 0.2708,
      _snap_vertices: 4
    },
    {
      id: "default-large-north",
      name: "Ruina castillo norte",
      kind: "ruin",
      preset: "large",
      x: 19.374,
      y: 12.762,
      width: 7,
      height: 11.5,
      rotation: -88,
      polygon: [
        {
          x: 3.796,
          y: -6.226
        },
        {
          x: -3.73,
          y: -6.124
        },
        {
          x: -3.633,
          y: 5.909
        },
        {
          x: 3.925,
          y: 5.806
        },
        {
          x: 3.975,
          y: -3.851
        },
        {
          x: 2.764,
          y: -1.524
        },
        {
          x: 1.565,
          y: -5.344
        },
        {
          x: 3.961,
          y: -4.269
        }
      ],
      _score: 1.7275,
      _gray: 0.8875,
      _color: 0.1375,
      _border: 0,
      _edge: 0.2917,
      _snap_vertices: 8
    },
    {
      id: "default-large-east",
      name: "Ruina este",
      kind: "ruin",
      preset: "large",
      x: 34.769,
      y: 20.587,
      width: 7,
      height: 11.5,
      rotation: 89,
      polygon: [
        {
          x: -3.721,
          y: -6.08
        },
        {
          x: -3.835,
          y: 5.981
        },
        {
          x: 3.721,
          y: 6.08
        },
        {
          x: 3.835,
          y: -5.981
        }
      ],
      _score: 1.2704,
      _gray: 0.8375,
      _color: 0.0375,
      _border: 0.1042,
      _edge: 0.1667,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-left",
      name: "Ruina central izquierda",
      kind: "ruin",
      preset: "splitLarge",
      x: 20.617,
      y: 34.002,
      width: 10,
      height: 12,
      rotation: -1,
      polygon: [
        {
          x: 2.84,
          y: -6.084
        },
        {
          x: -2.568,
          y: -5.888
        },
        {
          x: -2.429,
          y: 6.42
        },
        {
          x: 2.142,
          y: 6.241
        }
      ],
      _score: -0.3353,
      _gray: 0.9625,
      _color: 0.025,
      _border: 0.0417,
      _edge: 0.2708,
      _snap_vertices: 4
    },
    {
      id: "default-large-center-right",
      name: "Ruina central derecha",
      kind: "ruin",
      preset: "splitLarge",
      x: 24.517,
      y: 30.13,
      width: 10,
      height: 12,
      rotation: 0,
      polygon: [
        {
          x: -2.42,
          y: -6.427
        },
        {
          x: -3.449,
          y: 5.941
        },
        {
          x: 2.855,
          y: 6.135
        },
        {
          x: 3.048,
          y: -6.233
        }
      ],
      _score: 1.6817,
      _gray: 0.7,
      _color: 0.2,
      _border: 0.0417,
      _edge: 0.4583,
      _snap_vertices: 4
    },
    {
      id: "default-large-south",
      name: "Ruina castillo sur",
      kind: "ruin",
      preset: "large",
      x: 24.443,
      y: 47.476,
      width: 7,
      height: 11.5,
      rotation: -88,
      polygon: [
        {
          x: 3.804,
          y: -5.989
        },
        {
          x: -3.854,
          y: -5.979
        },
        {
          x: -3.724,
          y: 6.086
        },
        {
          x: 3.801,
          y: 5.952
        }
      ],
      _score: 1.7712,
      _gray: 0.875,
      _color: 0.1,
      _border: 0.125,
      _edge: 0.2083,
      _snap_vertices: 4
    },
    {
      id: "default-medium-west",
      name: "Ruina oeste media",
      kind: "ruin",
      preset: "medium",
      x: 6.8,
      y: 22.791,
      width: 6,
      height: 4,
      rotation: 15,
      polygon: [
        {
          x: -3.265,
          y: -2.193
        },
        {
          x: -3.249,
          y: 2.216
        },
        {
          x: 3.244,
          y: 2.215
        },
        {
          x: 3.251,
          y: -2.233
        }
      ],
      _score: -0.0329,
      _gray: 0.3875,
      _color: 0.1375,
      _border: 0.0208,
      _edge: 0.125,
      _snap_vertices: 4
    },
    {
      id: "default-medium-east-corner",
      name: "Ruina espejo de oeste media",
      kind: "ruin",
      preset: "medium",
      x: 41.303,
      y: 39.31,
      width: 6,
      height: 4,
      rotation: 0,
      polygon: [
        {
          x: -2.739,
          y: -2.141
        },
        {
          x: -2.642,
          y: 2.187
        },
        {
          x: 2.665,
          y: 2.219
        },
        {
          x: 2.665,
          y: -2.238
        }
      ],
      _score: -0.9597,
      _gray: 0,
      _color: 0,
      _border: 0.15,
      _edge: 0.075,
      _snap_vertices: 4
    },
    {
      id: "default-medium-east",
      name: "Ruina este media",
      kind: "ruin",
      preset: "medium",
      x: 33.844,
      y: 33.516,
      width: 6,
      height: 4,
      rotation: 89,
      polygon: [
        {
          x: -3.221,
          y: -2.139
        },
        {
          x: -3.136,
          y: 2.237
        },
        {
          x: 3.229,
          y: 2.123
        },
        {
          x: 3.143,
          y: -2.221
        }
      ],
      _score: 1.044,
      _gray: 0.5625,
      _color: 0.175,
      _border: 0.1458,
      _edge: 0.2292,
      _snap_vertices: 4
    },
    {
      id: "default-medium-west-inner",
      name: "Ruina oeste media 2",
      kind: "ruin",
      preset: "medium",
      x: 9.76,
      y: 29.814,
      width: 6,
      height: 4,
      rotation: -89,
      polygon: [
        {
          x: 3.233,
          y: -2.129
        },
        {
          x: -3.131,
          y: -2.211
        },
        {
          x: -3.217,
          y: 2.133
        },
        {
          x: 3.115,
          y: 2.215
        }
      ],
      _score: 1.5369,
      _gray: 0.7375,
      _color: 0.25,
      _border: 0.0625,
      _edge: 0.3333,
      _snap_vertices: 4
    },
    {
      id: "default-long-north-east",
      name: "Barricada norte-este",
      kind: "barricade",
      preset: "longLine",
      x: 29.07,
      y: 14.111,
      width: 10,
      height: 2.5,
      rotation: 8,
      polygon: [
        {
          x: -5.214,
          y: -1.32
        },
        {
          x: -5.078,
          y: 1.498
        },
        {
          x: 5.285,
          y: 1.28
        },
        {
          x: 5.095,
          y: -1.465
        }
      ],
      _score: 0.8566,
      _gray: 0.7,
      _color: 0.3375,
      _border: 0,
      _edge: 0.3125,
      _snap_vertices: 4
    },
    {
      id: "default-long-south-west",
      name: "Barricada sur-oeste",
      kind: "barricade",
      preset: "longLine",
      x: 15.069,
      y: 47.939,
      width: 10,
      height: 2.5,
      rotation: 6,
      polygon: [
        {
          x: -5.229,
          y: -1.285
        },
        {
          x: -5.102,
          y: 1.462
        },
        {
          x: 5.229,
          y: 1.285
        },
        {
          x: 5.102,
          y: -1.462
        }
      ],
      _score: 0.7568,
      _gray: 0.9375,
      _color: 0.0375,
      _border: 0.1042,
      _edge: 0.3542,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west",
      name: "Barricada norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 12.801,
      y: 16.55,
      width: 6,
      height: 2,
      rotation: 0,
      polygon: [
        {
          x: -3.152,
          y: -1.05
        },
        {
          x: -2.991,
          y: 1.146
        },
        {
          x: 3.152,
          y: 1.05
        },
        {
          x: 2.991,
          y: -1.146
        }
      ],
      _score: -0.2088,
      _gray: 0.4375,
      _color: 0.1875,
      _border: 0.0417,
      _edge: 0.1875,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east",
      name: "Barricada sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 34.609,
      y: 44.103,
      width: 6,
      height: 2,
      rotation: -1,
      polygon: [
        {
          x: 3.203,
          y: -1.065
        },
        {
          x: -3.1,
          y: -1.176
        },
        {
          x: -3.172,
          y: 1.084
        },
        {
          x: 3.1,
          y: 1.161
        }
      ],
      _score: 1.4392,
      _gray: 0.4375,
      _color: 0.575,
      _border: 0,
      _edge: 0.2083,
      _snap_vertices: 4
    },
    {
      id: "default-short-north-west-vertical",
      name: "Ruina norte-oeste",
      kind: "barricade",
      preset: "shortLine",
      x: 8.524,
      y: 15.365,
      width: 6,
      height: 2,
      rotation: -88,
      polygon: [
        {
          x: 3.155,
          y: -1.077
        },
        {
          x: -3.116,
          y: -1.147
        },
        {
          x: -3.202,
          y: 1.012
        },
        {
          x: 3.041,
          y: 1.212
        }
      ],
      _score: 1.1,
      _gray: 0.8125,
      _color: 0.2125,
      _border: 0.0833,
      _edge: 0.4167,
      _snap_vertices: 4
    },
    {
      id: "default-short-south-east-vertical",
      name: "Ruina sur-este",
      kind: "barricade",
      preset: "shortLine",
      x: 37.918,
      y: 48.797,
      width: 6,
      height: 2,
      rotation: 87,
      polygon: [
        {
          x: -3.148,
          y: -1.07
        },
        {
          x: -3.104,
          y: 1.187
        },
        {
          x: 3.209,
          y: 1.035
        },
        {
          x: 3.098,
          y: -1.161
        }
      ],
      _score: 0.7927,
      _gray: 1,
      _color: 0,
      _border: 0.0208,
      _edge: 0.3333,
      _snap_vertices: 4
    }
  ]
};

function createTerrainForMap(mapId) {
  return structuredClone(CUSTOM_TERRAIN_BY_MAP_ID[mapId] ?? DEFAULT_TERRAIN);
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
    terrain: createTerrainForMap("purge-the-foe__priority-assets__layout-c")
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
    terrain: createTerrainForMap("reconnaissance__reconnaissance__layout-a")
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
    terrain: createTerrainForMap("reconnaissance__reconnaissance__layout-b")
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
    terrain: createTerrainForMap("reconnaissance__reconnaissance__layout-c")
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
    terrain: createTerrainForMap("reconnaissance__priority-assets__layout-a")
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
    terrain: createTerrainForMap("reconnaissance__priority-assets__layout-b")
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
    terrain: createTerrainForMap("reconnaissance__priority-assets__layout-c")
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
