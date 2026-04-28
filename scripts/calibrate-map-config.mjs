#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const BOARD_WIDTH_UM = 44;
const BOARD_HEIGHT_UM = 60;
const TERRAIN_PRESETS = {
  large: { width: 7, height: 11.5 },
  largeXL: { width: 8, height: 11.5 },
  medium: { width: 6, height: 4 },
  longLine: { width: 10, height: 2.5 },
  shortLine: { width: 6, height: 2 },
};

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { _: [] };

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];

    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return { command, args };
}

function requireArg(args, key) {
  const value = args[key];
  if (value === undefined || value === true) {
    throw new Error(`Missing required argument --${key}`);
  }

  return value;
}

function parseRect(value) {
  const [x, y, width, height] = String(value)
    .split(",")
    .map((part) => Number(part.trim()));

  if ([x, y, width, height].some((part) => Number.isNaN(part))) {
    throw new Error(`Invalid rect: ${value}. Expected x,y,width,height`);
  }

  return { x, y, width, height };
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  ensureDirForFile(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function importMapModule(filePath) {
  return import(pathToFileURL(path.resolve(filePath)).href);
}

function pxToBoardUnitsX(px, boardRectPx) {
  return (px / boardRectPx.width) * BOARD_WIDTH_UM;
}

function pxToBoardUnitsY(px, boardRectPx) {
  return (px / boardRectPx.height) * BOARD_HEIGHT_UM;
}

function rectPxToTerrain(rectPx, boardRectPx, seed) {
  const presetSize = seed.preset ? TERRAIN_PRESETS[seed.preset] : null;

  return {
    id: seed.id,
    name: seed.name,
    kind: seed.kind,
    preset: seed.preset || null,
    x: pxToBoardUnitsX(rectPx.x + rectPx.width / 2, boardRectPx),
    y: pxToBoardUnitsY(rectPx.y + rectPx.height / 2, boardRectPx),
    width: presetSize ? presetSize.width : pxToBoardUnitsX(rectPx.width, boardRectPx),
    height: presetSize ? presetSize.height : pxToBoardUnitsY(rectPx.height, boardRectPx),
    rotation: Number(seed.rotation || 0),
  };
}

function createConfigBase(args) {
  const boardRectPx = parseRect(requireArg(args, "board-rect"));
  const originalWidth = Number(requireArg(args, "original-width"));
  const originalHeight = Number(requireArg(args, "original-height"));

  if (Number.isNaN(originalWidth) || Number.isNaN(originalHeight)) {
    throw new Error("Invalid original image size");
  }

  return {
    id: requireArg(args, "id"),
    name: requireArg(args, "name"),
    image: {
      src: requireArg(args, "image"),
      originalSizePx: {
        width: originalWidth,
        height: originalHeight,
      },
      boardRectPx,
    },
    terrain: [],
  };
}

function commandInit(args) {
  const out = requireArg(args, "out");
  const config = createConfigBase(args);
  writeJson(out, config);
  console.log(`Created ${out}`);
}

function commandBuild(args) {
  const metaPath = requireArg(args, "meta");
  const piecesPath = requireArg(args, "pieces");
  const out = requireArg(args, "out");

  const baseConfig = readJson(metaPath);
  const pieces = readJson(piecesPath);

  if (!Array.isArray(pieces)) {
    throw new Error("Pieces file must be a JSON array");
  }

  const terrain = pieces.map((piece, index) => {
    if (!piece.rectPx) {
      throw new Error(`Piece at index ${index} is missing rectPx`);
    }

    return rectPxToTerrain(piece.rectPx, baseConfig.image.boardRectPx, {
      id: piece.id || `${baseConfig.id}-t${index + 1}`,
      name: piece.name || `Terrain ${index + 1}`,
      kind: piece.kind || "ruin",
      preset: piece.preset || null,
      rotation: piece.rotation || 0,
    });
  });

  writeJson(out, { ...baseConfig, terrain });
  console.log(`Built ${out} with ${terrain.length} terrain pieces`);
}

async function commandExportCurrent(args) {
  const source = requireArg(args, "source");
  const outDir = requireArg(args, "out-dir");
  const module = await importMapModule(source);

  if (!Array.isArray(module.mapConfigs)) {
    throw new Error("Source module does not export mapConfigs array");
  }

  fs.mkdirSync(path.resolve(outDir), { recursive: true });

  for (const mapConfig of module.mapConfigs) {
    const outPath = path.join(outDir, `${mapConfig.id}.json`);
    writeJson(outPath, mapConfig);
    console.log(`Exported ${outPath}`);
  }
}

function serializeModuleValue(value, indentLevel = 0) {
  const indent = "  ".repeat(indentLevel);
  const childIndent = "  ".repeat(indentLevel + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    const items = value
      .map((item) => `${childIndent}${serializeModuleValue(item, indentLevel + 1)}`)
      .join(",\n");

    return `[\n${items}\n${indent}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== null)
      .map(([key, entryValue]) => `${childIndent}${key}: ${serializeModuleValue(entryValue, indentLevel + 1)}`);

    return `{\n${entries.join(",\n")}\n${indent}}`;
  }

  return JSON.stringify(value);
}

function commandGenerateModule(args) {
  const presetsSourcePath = requireArg(args, "presets-source");
  const inputDir = requireArg(args, "input-dir");
  const out = requireArg(args, "out");
  const sourceText = fs.readFileSync(path.resolve(presetsSourcePath), "utf8");
  const match = sourceText.match(
    /export const BOARD_WIDTH_UM = ([^;]+);\s*[\r\n]+export const BOARD_HEIGHT_UM = ([^;]+);\s*[\r\n]+export const TERRAIN_PRESETS = ([\s\S]*?);\s*[\r\n]+export const mapConfigs =/m
  );

  if (!match) {
    throw new Error("Could not extract constants from presets source");
  }

  const [, boardWidthSource, boardHeightSource, presetsSource] = match;
  const jsonFiles = fs
    .readdirSync(path.resolve(inputDir))
    .filter((fileName) => fileName.endsWith(".json") && !fileName.endsWith(".refined.json"))
    .sort();

  if (jsonFiles.length === 0) {
    throw new Error("No JSON files found in input directory");
  }

  const mapConfigs = jsonFiles.map((fileName) => readJson(path.join(inputDir, fileName)));
  const moduleSource =
    `export const BOARD_WIDTH_UM = ${boardWidthSource.trim()};\n` +
    `export const BOARD_HEIGHT_UM = ${boardHeightSource.trim()};\n` +
    `export const TERRAIN_PRESETS = ${presetsSource.trim()};\n\n` +
    `export const mapConfigs = ${serializeModuleValue(mapConfigs)};\n`;

  ensureDirForFile(out);
  fs.writeFileSync(path.resolve(out), moduleSource, "utf8");
  console.log(`Generated ${out}`);
}

function runPythonRefiner(configPath, outPath) {
  const result = spawnSync(
    "python3",
    [
      "scripts/auto_refine_rectangles.py",
      "--config",
      configPath,
      "--out",
      outPath,
    ],
    {
      stdio: "pipe",
      encoding: "utf8",
    }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Python refiner failed for ${configPath}`);
  }

  if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
}

async function commandRefineCurrent(args) {
  const source = requireArg(args, "source");
  const workDir = requireArg(args, "work-dir");
  const out = requireArg(args, "out");
  const keepIntermediate = Boolean(args["keep-intermediate"]);
  const refineOne = args.map ? String(args.map) : null;

  fs.mkdirSync(path.resolve(workDir), { recursive: true });

  await commandExportCurrent({
    source,
    "out-dir": workDir,
  });

  const allJsonFiles = fs
    .readdirSync(path.resolve(workDir))
    .filter((fileName) => fileName.endsWith(".json") && !fileName.endsWith(".refined.json"))
    .sort();

  const targetFiles = refineOne
    ? allJsonFiles.filter((fileName) => fileName === `${refineOne}.json`)
    : allJsonFiles;

  if (targetFiles.length === 0) {
    throw new Error(refineOne ? `Map ${refineOne} not found in exported configs` : "No exported map JSON files found");
  }

  for (const fileName of targetFiles) {
    const sourcePath = path.join(workDir, fileName);
    const refinedPath = path.join(workDir, fileName.replace(/\.json$/, ".refined.json"));
    runPythonRefiner(sourcePath, refinedPath);
    fs.copyFileSync(refinedPath, sourcePath);
    console.log(`Updated ${sourcePath} with refined values`);
  }

  commandGenerateModule({
    "presets-source": source,
    "input-dir": workDir,
    out,
  });

  if (!keepIntermediate) {
    for (const fileName of fs.readdirSync(path.resolve(workDir))) {
      if (fileName.endsWith(".refined.json")) {
        fs.rmSync(path.join(workDir, fileName));
      }
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function commandPreview(args) {
  const configPath = requireArg(args, "config");
  const out = requireArg(args, "out");
  const config = readJson(configPath);
  const boardRectPx = config.image.boardRectPx;

  const terrainRects = config.terrain
    .map((piece, index) => {
      const x = (piece.x / BOARD_WIDTH_UM) * boardRectPx.width;
      const y = (piece.y / BOARD_HEIGHT_UM) * boardRectPx.height;
      const width = (piece.width / BOARD_WIDTH_UM) * boardRectPx.width;
      const height = (piece.height / BOARD_HEIGHT_UM) * boardRectPx.height;
      const color =
        piece.kind === "barricade" ? "#f0b45a" : piece.kind === "crater" ? "#e8f1f2" : "#45d8af";

      return `
        <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${Number(piece.rotation || 0).toFixed(2)})">
          <rect
            x="${(-width / 2).toFixed(2)}"
            y="${(-height / 2).toFixed(2)}"
            width="${width.toFixed(2)}"
            height="${height.toFixed(2)}"
            fill="rgba(0,0,0,0.08)"
            stroke="${color}"
            stroke-width="2"
          />
          <text
            x="0"
            y="${Math.min(height / 2 + 16, boardRectPx.height - 8).toFixed(2)}"
            text-anchor="middle"
            font-family="sans-serif"
            font-size="14"
            font-weight="700"
            fill="${color}"
          >${escapeHtml(piece.id || String(index + 1))}</text>
        </g>
      `;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Preview ${escapeHtml(config.name)}</title>
    <style>
      body {
        margin: 0;
        padding: 24px;
        background: #101716;
        color: #f4efe4;
        font-family: sans-serif;
      }
      .wrap {
        display: grid;
        gap: 18px;
      }
      .board {
        position: relative;
        width: ${boardRectPx.width}px;
        height: ${boardRectPx.height}px;
        overflow: hidden;
        background: #000;
      }
      .board img {
        position: absolute;
        left: -${boardRectPx.x}px;
        top: -${boardRectPx.y}px;
      }
      .board svg {
        position: absolute;
        inset: 0;
      }
      pre {
        margin: 0;
        padding: 16px;
        background: rgba(255,255,255,0.06);
        overflow: auto;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>${escapeHtml(config.name)}</h1>
      <div class="board">
        <img src="../${escapeHtml(config.image.src)}" alt="" />
        <svg viewBox="0 0 ${boardRectPx.width} ${boardRectPx.height}" preserveAspectRatio="none">
          ${terrainRects}
        </svg>
      </div>
      <pre>${escapeHtml(JSON.stringify(config, null, 2))}</pre>
    </div>
  </body>
</html>
`;

  ensureDirForFile(out);
  fs.writeFileSync(out, html, "utf8");
  console.log(`Preview written to ${out}`);
}

function printHelp() {
  console.log(`Usage:
  node scripts/calibrate-map-config.mjs init \\
    --id map-3 --name "Mapa 3" --image ./map.jpg \\
    --original-width 1000 --original-height 1134 \\
    --board-rect 149,131,705,957 --out ./configs/map-3.base.json

  node scripts/calibrate-map-config.mjs build \\
    --meta ./configs/map-3.base.json \\
    --pieces ./configs/map-3.pieces.json \\
    --out ./configs/map-3.config.json

  node scripts/calibrate-map-config.mjs export-current \\
    --source ./map-configs.js \\
    --out-dir ./configs/current

  node scripts/calibrate-map-config.mjs generate-module \\
    --presets-source ./map-configs.js \\
    --input-dir ./configs/current \\
    --out ./map-configs.generated.js

  node scripts/calibrate-map-config.mjs refine-current \\
    --source ./map-configs.js \\
    --work-dir ./configs/current \\
    --out ./map-configs.generated.js \\
    [--map map-1] [--keep-intermediate]

  node scripts/calibrate-map-config.mjs preview \\
    --config ./configs/map-3.config.json \\
    --out ./configs/map-3.preview.html
`);
}

async function main() {
  const { command, args } = parseArgs(process.argv.slice(2));

  try {
    switch (command) {
      case "init":
        commandInit(args);
        break;
      case "build":
        commandBuild(args);
        break;
      case "export-current":
        await commandExportCurrent(args);
        break;
      case "generate-module":
        commandGenerateModule(args);
        break;
      case "refine-current":
        await commandRefineCurrent(args);
        break;
      case "preview":
        commandPreview(args);
        break;
      case "help":
      case "--help":
      case "-h":
      case undefined:
        printHelp();
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
