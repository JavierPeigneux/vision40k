// integrations/40kdc/vendor/resolve.ts
var DEG = Math.PI / 180;
function footprintVertices(fp) {
  switch (fp.type) {
    case "rectangle":
      return [
        {
          x: 0,
          y: 0
        },
        {
          x: fp.width,
          y: 0
        },
        {
          x: fp.width,
          y: fp.height
        },
        {
          x: 0,
          y: fp.height
        }
      ];
    case "right-triangle":
      return [
        {
          x: 0,
          y: 0
        },
        {
          x: fp.width,
          y: 0
        },
        {
          x: 0,
          y: fp.height
        }
      ];
    case "polygon":
      return fp.points.map((p) => ({
        x: p.x,
        y: p.y
      }));
    default: {
      const exhaustive = fp;
      throw new Error(`unknown footprint type: ${JSON.stringify(exhaustive)}`);
    }
  }
}
function polygonCentroid(verts) {
  const n = verts.length;
  if (n === 0) return {
    x: 0,
    y: 0
  };
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % n];
    const cross = a.x * b.y - b.x * a.y;
    twiceArea += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  if (twiceArea === 0) {
    const mean = verts.reduce((acc, v) => ({
      x: acc.x + v.x,
      y: acc.y + v.y
    }), {
      x: 0,
      y: 0
    });
    return {
      x: mean.x / n,
      y: mean.y / n
    };
  }
  return {
    x: cx / (3 * twiceArea),
    y: cy / (3 * twiceArea)
  };
}
function applyMirror(v, m) {
  switch (m) {
    case "horizontal":
      return {
        x: -v.x,
        y: v.y
      };
    case "vertical":
      return {
        x: v.x,
        y: -v.y
      };
    default:
      return v;
  }
}
function rotateCw(v, deg) {
  if (deg === 0) return {
    x: v.x,
    y: v.y
  };
  const r = deg * DEG;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return {
    x: c * v.x - s * v.y,
    y: s * v.x + c * v.y
  };
}
function orient(v, rotation, mirror) {
  return rotateCw(applyMirror(v, mirror), rotation);
}
function orientedOffsets(footprint, rotation, mirror) {
  const verts = footprintVertices(footprint);
  const c = polygonCentroid(verts);
  return verts.map((v) => orient({
    x: v.x - c.x,
    y: v.y - c.y
  }, rotation, mirror));
}
function placeFootprint(fp, position, rotation, mirror) {
  const verts = footprintVertices(fp);
  const c = polygonCentroid(verts);
  return verts.map((v) => {
    const o = orient({
      x: v.x - c.x,
      y: v.y - c.y
    }, rotation, mirror);
    return {
      x: o.x + position.x,
      y: o.y + position.y
    };
  });
}
var TWO_DP_ROUND = 1e4;
function round4(v) {
  return {
    x: Math.round(v.x * TWO_DP_ROUND) / TWO_DP_ROUND,
    y: Math.round(v.y * TWO_DP_ROUND) / TWO_DP_ROUND
  };
}
function resolveWalls(walls, fp, position, rotation, mirror) {
  if (!walls || walls.length === 0) return void 0;
  const c = polygonCentroid(footprintVertices(fp));
  return walls.map((w) => {
    const pts = w.points.map((p) => {
      const o = orient({
        x: p.x - c.x,
        y: p.y - c.y
      }, rotation, mirror);
      return round4({
        x: o.x + position.x,
        y: o.y + position.y
      });
    });
    const rw = {
      points: pts
    };
    if (w.thickness !== void 0) rw.thickness = w.thickness;
    return rw;
  });
}
function resolveWallsComposed(walls, fp, featPosition, featRotation, featMirror, areaPosition, areaRotation, areaMirror) {
  if (!walls || walls.length === 0) return void 0;
  const c = polygonCentroid(footprintVertices(fp));
  return walls.map((w) => {
    const pts = w.points.map((p) => {
      const local = orient({
        x: p.x - c.x,
        y: p.y - c.y
      }, featRotation, featMirror);
      const areaLocal = {
        x: local.x + featPosition.x,
        y: local.y + featPosition.y
      };
      const o = orient(areaLocal, areaRotation, areaMirror);
      return round4({
        x: o.x + areaPosition.x,
        y: o.y + areaPosition.y
      });
    });
    const rw = {
      points: pts
    };
    if (w.thickness !== void 0) rw.thickness = w.thickness;
    return rw;
  });
}
function resolvedIdName(piece) {
  return {
    id: piece.id ?? null,
    name: piece.name ?? null
  };
}
function resolvedComposedId(parent, feature, featureIndex) {
  if (!parent.id) return feature.id ?? null;
  return `${parent.id}--${feature.id ?? `feature-${featureIndex + 1}`}`;
}
var TerrainResolveError = class extends Error {
};
function resolveLayout(layout, templates) {
  const byId = /* @__PURE__ */ new Map();
  for (const t of templates) byId.set(t.id, t);
  const pieces = layout.pieces ?? [];
  const areasById = /* @__PURE__ */ new Map();
  for (const p of pieces) if (p.id) areasById.set(p.id, p);
  const footprintOf = (piece, where) => {
    if (piece.footprint) return piece.footprint;
    if (piece.template) {
      const t = byId.get(piece.template);
      if (!t) throw new TerrainResolveError(`${where}: unknown template "${piece.template}"`);
      return t.footprint;
    }
    throw new TerrainResolveError(`${where}: piece has neither footprint nor template`);
  };
  const out = [];
  for (const piece of pieces) {
    const where = piece.id ?? piece.name ?? "<piece>";
    const fp = footprintOf(piece, where);
    const rotation = piece.rotation_degrees ?? 0;
    const mirror = piece.mirror ?? "none";
    const pieceType = piece.piece_type ?? (piece.parent_area_id ? "feature" : "area");
    if (piece.parent_area_id) {
      const parent = areasById.get(piece.parent_area_id);
      if (!parent) {
        throw new TerrainResolveError(`${where}: unknown parent_area_id "${piece.parent_area_id}"`);
      }
      const areaLocal = placeFootprint(fp, piece.position, rotation, mirror);
      const aRot = parent.rotation_degrees ?? 0;
      const aMirror = parent.mirror ?? "none";
      const vertices2 = areaLocal.map((p) => {
        const o = orient(p, aRot, aMirror);
        return round4({
          x: o.x + parent.position.x,
          y: o.y + parent.position.y
        });
      });
      const tpl = piece.template ? byId.get(piece.template) : void 0;
      const resolved = {
        ...resolvedIdName(piece),
        piece_type: pieceType,
        floor: piece.floor ?? 0,
        vertices: vertices2
      };
      if (tpl) {
        const rw = resolveWallsComposed(tpl.walls, fp, piece.position, rotation, mirror, parent.position, aRot, aMirror);
        if (rw) resolved.walls = rw;
        if (tpl.has_roof) resolved.has_roof = true;
        if (tpl.terrain_category) resolved.terrain_category = tpl.terrain_category;
      }
      out.push(resolved);
      continue;
    }
    const vertices = placeFootprint(fp, piece.position, rotation, mirror).map(round4);
    const tplUnparented = piece.template ? byId.get(piece.template) : void 0;
    const resolvedPiece = {
      ...resolvedIdName(piece),
      piece_type: pieceType,
      floor: piece.floor ?? 0,
      vertices
    };
    if (tplUnparented) {
      const rw = resolveWalls(tplUnparented.walls, fp, piece.position, rotation, mirror);
      if (rw) resolvedPiece.walls = rw;
      if (tplUnparented.has_roof) resolvedPiece.has_roof = true;
      if (tplUnparented.terrain_category) resolvedPiece.terrain_category = tplUnparented.terrain_category;
    }
    out.push(resolvedPiece);
    if (piece.template) {
      const t = byId.get(piece.template);
      for (const [featureIndex, feat] of (t?.features ?? []).entries()) {
        const ft = byId.get(feat.template);
        if (!ft) {
          throw new TerrainResolveError(`${where}: composed feature references unknown template "${feat.template}"`);
        }
        const areaLocal = placeFootprint(ft.footprint, feat.position, feat.rotation_degrees ?? 0, feat.mirror ?? "none");
        const featVerts = areaLocal.map((p) => {
          const o = orient(p, rotation, mirror);
          return round4({
            x: o.x + piece.position.x,
            y: o.y + piece.position.y
          });
        });
        const resolvedFeat = {
          id: resolvedComposedId(piece, feat, featureIndex),
          name: ft.name ?? null,
          piece_type: "feature",
          floor: feat.floor ?? 0,
          vertices: featVerts
        };
        const rw = resolveWallsComposed(ft.walls, ft.footprint, feat.position, feat.rotation_degrees ?? 0, feat.mirror ?? "none", piece.position, rotation, mirror);
        if (rw) resolvedFeat.walls = rw;
        if (ft.has_roof) resolvedFeat.has_roof = true;
        if (ft.terrain_category) resolvedFeat.terrain_category = ft.terrain_category;
        out.push(resolvedFeat);
      }
    }
  }
  return out;
}
export {
  TerrainResolveError,
  footprintVertices,
  orientedOffsets,
  polygonCentroid,
  resolveLayout
};
