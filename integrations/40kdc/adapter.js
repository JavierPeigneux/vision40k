import { resolveLayout, footprintVertices } from './vendor/resolve.js';
import { groupTerrainAreas, geometrySignature } from './terrain-links.js?v=pdf-audit-v1-3-r1';
import pdfRelations from './pdf-links.generated.js?v=pdf-audit-v1-3-r1';

export const BOARD_WIDTH_UM = 44;
export const BOARD_HEIGHT_UM = 60;
export const MAP_LAYOUTS = ['A', 'B', 'C'];
const FILES = ['terrain-layouts', 'terrain-templates', 'mission-matchups', 'deployment-patterns', 'force-dispositions'];
const SNAPSHOT = new URL('./snapshot/', import.meta.url);
const REPOSITORY = 'https://github.com/wn-mitch/40kdc-data';

async function getJson(url) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

export async function loadDataset({ offline = false } = {}) {
  let liveError;
  if (!offline) {
    try {
      const { sha } = await getJson('https://api.github.com/repos/wn-mitch/40kdc-data/commits/main');
      if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid upstream revision');
      const files = await Promise.all(FILES.map(name => getJson(`https://raw.githubusercontent.com/wn-mitch/40kdc-data/${sha}/data/core/${name}.json`)));
      const data = Object.fromEntries(FILES.map((name, index) => [name, files[index]]));
      validateDataset(data);
      return { data, meta: { commit: sha, mode: 'live', repository: REPOSITORY } };
    } catch (error) { liveError = error.message; }
  }
  const [metadata, ...files] = await Promise.all([getJson(new URL('metadata.json', SNAPSHOT)), ...FILES.map(name => getJson(new URL(name + '.json', SNAPSHOT)))]);
  const data = Object.fromEntries(FILES.map((name, index) => [name, files[index]]));
  validateDataset(data);
  return { data, meta: { ...metadata, mode: offline ? 'snapshot' : 'fallback', liveError } };
}

function validateDataset(data) {
  for (const name of FILES) {
    if (!Array.isArray(data[name]) || !data[name].length) throw new Error(`${name}: missing catalog`);
    const ids = data[name].map(row => row.id);
    if (ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) throw new Error(`${name}: invalid/duplicate ids`);
  }
}

// A rigid 90-degree rotation: the source's 60×44 landscape becomes 44×60.
// No stretching, reflection or guessed image calibration.
export const toPortrait = ({ x, y }) => ({ x: 44 - y, y: x });
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const points = vertices => vertices.map(p => `${p.x},${p.y}`).join(' ');
function polygon(vertices, attributes) { return `<polygon points="${points(vertices)}" ${attributes}/>`; }

export function adaptLayout(layout, data, meta) {
  if (layout.board && (layout.board.width !== 60 || layout.board.height !== 44)) throw new Error(`Unsupported board: ${layout.id}`);
  const matchup = data['mission-matchups'].find(item => item.id === layout.mission_matchup_id);
  const dispositions = new Map(data['force-dispositions'].map(item => [item.id, item.name]));
  if (!matchup || !MAP_LAYOUTS[layout.variant - 1]) throw new Error(`Unsupported matchup/variant: ${layout.id}`);
  const dispositionA = dispositions.get(matchup.disposition), dispositionB = dispositions.get(matchup.opponent_disposition);
  if (!dispositionA || !dispositionB) throw new Error(`Unknown disposition: ${layout.id}`);
  const rawById = new Map(layout.pieces.map(piece => [piece.id, piece]));
  const resolved = resolveLayout(layout, data['terrain-templates']).map(piece => ({
    ...piece,
    vertices: piece.vertices.map(toPortrait),
    walls: piece.walls?.map(wall => ({ ...wall, points: wall.points.map(toPortrait) })),
  }));
  for (const piece of resolved) {
    if (piece.vertices.length < 3 || piece.vertices.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) throw new Error(`Invalid polygon: ${layout.id}/${piece.id}`);
  }
  // Reuse Vision40K's existing 2D area-intersection policy, on exact area polygons.
  // Feature walls are drawn separately; this is not a full 3D/11e rules engine.
  const areas = resolved.filter(piece => piece.piece_type === 'area' && rawById.get(piece.id)?.terrain !== false).map(piece => ({
    id: piece.id, name: piece.name || piece.id, kind: 'ruin', x: 0, y: 0, rotation: 0,
    width: Math.max(...piece.vertices.map(p => p.x)) - Math.min(...piece.vertices.map(p => p.x)),
    height: Math.max(...piece.vertices.map(p => p.y)) - Math.min(...piece.vertices.map(p => p.y)),
    polygon: piece.vertices,
  }));
  const pdfRecord = pdfRelations.layouts[layout.id];
  const signatureMatches = pdfRecord?.signature === geometrySignature(resolved);
  const pdfApplicable = meta.pdfPolicy !== 'source-only' && signatureMatches && pdfRecord.symbols.every(symbol => symbol.pair.every(id => areas.some(area => area.id === id)));
  const terrain = groupTerrainAreas(areas, rawById, pdfApplicable ? pdfRecord.symbols : []);
  const pdfRules = {
    status: meta.pdfPolicy === 'source-only' ? 'disabled' : pdfApplicable ? 'applied' : pdfRecord ? 'geometry-changed' : 'not-reviewed',
    page: pdfRecord?.page, version: pdfRelations.source.version, url: pdfRelations.source.url,
  };
  const deployment = data['deployment-patterns'].find(row => row.id === layout.deployment_pattern_id);
  const zones = (deployment?.zones ?? []).map(zone => ({
    ...zone, vertices: footprintVertices(zone.shape).map(p => toPortrait({ x: p.x + zone.position.x, y: p.y + zone.position.y })),
  }));
  // Linked halves share one objective: use the mean of explicit marker positions.
  const markerGroups = new Map();
  for (const piece of layout.pieces) {
    if (!piece.is_objective || !piece.objective?.position) continue;
    const key = terrain.find(group => group.memberIds.includes(piece.id))?.id || piece.link_group || piece.id;
    if (!markerGroups.has(key)) markerGroups.set(key, []);
    markerGroups.get(key).push(piece.objective.position);
  }
  const markers = [...markerGroups.values()].map(group => toPortrait({ x: group.reduce((sum, p) => sum + p.x, 0) / group.length, y: group.reduce((sum, p) => sum + p.y, 0) / group.length }));
  const layoutLetter = MAP_LAYOUTS[layout.variant - 1];
  const svg = renderSvg({ resolved, terrain, zones, markers, areaRelations: pdfApplicable ? pdfRecord.symbols : [], title: `${dispositionA} / ${dispositionB} · ${layoutLetter}` });
  return {
    id: `${matchup.disposition}__${matchup.opponent_disposition}__layout-${layoutLetter.toLowerCase()}`,
    name: `${dispositionA} vs ${dispositionB} · ${layoutLetter} · 40kdc`,
    dispositionA, dispositionB, layout: layoutLetter,
    image: { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, originalSizePx: { width: 880, height: 1200 }, boardRectPx: { x: 0, y: 0, width: 880, height: 1200 } },
    terrain, source: { ...meta, upstreamId: layout.id, catalogSource: layout.source, gameVersion: layout.game_version, pdfRules },
    geometry: { resolved, zones, markers },
  };
}

function renderSvg({ resolved, terrain, zones, markers, areaRelations, title }) {
  const blocking = new Set(terrain.flatMap(piece => piece.memberIds));
  const layers = [];
  layers.push('<rect width="44" height="60" fill="#e5ddc8"/>');
  for (let x = 0; x <= 44; x += 1) layers.push(`<path d="M${x} 0V60" stroke="${x % 5 === 0 ? '#9b9588' : '#b2aa94'}" stroke-width="${x % 5 === 0 ? .055 : .025}"/>`);
  for (let y = 0; y <= 60; y += 1) layers.push(`<path d="M0 ${y}H44" stroke="${y % 5 === 0 ? '#9b9588' : '#b2aa94'}" stroke-width="${y % 5 === 0 ? .055 : .025}"/>`);
  for (const zone of zones) layers.push(polygon(zone.vertices, `fill="${zone.player === 'defender' ? '#5b98bc' : '#c57772'}" fill-opacity=".19" stroke="${zone.player === 'defender' ? '#397c9e' : '#a54f4a'}" stroke-width=".10" stroke-dasharray=".4 .25"`));
  for (const piece of resolved.filter(piece => piece.piece_type === 'area')) layers.push(polygon(piece.vertices, `fill="${blocking.has(piece.id) ? '#72777d' : '#c9c2ae'}" fill-opacity=".65" stroke="#454b52" stroke-width=".10"`));
  for (const piece of resolved.filter(piece => piece.piece_type === 'feature')) {
    layers.push(polygon(piece.vertices, 'fill="#484e55" fill-opacity=".94" stroke="#292e34" stroke-width=".07"'));
    for (const wall of piece.walls ?? []) layers.push(`<polyline points="${points(wall.points)}" fill="none" stroke="#20252a" stroke-width="${wall.thickness ?? 0.2}" stroke-linejoin="round"/>`);
  }
  for (const marker of markers) layers.push(`<circle cx="${marker.x}" cy="${marker.y}" r=".79" fill="#eee3ad" stroke="#7d5f16" stroke-width=".12"/><circle cx="${marker.x}" cy="${marker.y}" r=".18" fill="#7d5f16"/>`);
  for (const relation of areaRelations) {
    if (!relation.point) continue;
    const {x,y}=relation.point;
    layers.push(`<g transform="translate(${x} ${y})"><title>${escape(relation.linked ? 'Una sola área' : 'Áreas separadas')}</title><circle r=".88" fill="#777" stroke="white" stroke-width=".10"/><path d="M-.63 0 Q0 -.58 .63 0 Q0 .58 -.63 0Z" fill="none" stroke="white" stroke-width=".11"/><circle r=".18" fill="white"/>${relation.linked ? '' : '<path d="M-.62 -.62 L.62 .62" stroke="#777" stroke-width=".26"/><path d="M-.62 -.62 L.62 .62" stroke="white" stroke-width=".13"/>'}</g>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="1200" viewBox="0 0 44 60"><title>${escape(title)}</title>${layers.join('')}</svg>`;
}

function buildCatalog({ data, meta }) {
  const layouts = data['terrain-layouts'].filter(layout => layout.source === 'battlemaster-11e');
  const dispositions = data['force-dispositions'].map(row => row.name);
  const mapConfigs = layouts.map(layout => adaptLayout(layout, data, meta)).sort((a,b) =>
    dispositions.indexOf(a.dispositionA)-dispositions.indexOf(b.dispositionA) ||
    dispositions.indexOf(a.dispositionB)-dispositions.indexOf(b.dispositionB) || a.layout.localeCompare(b.layout));
  const keys = mapConfigs.map(map => map.id);
  if (new Set(keys).size !== keys.length || !keys.length) throw new Error('Duplicate/empty map catalog');
  const count = data['force-dispositions'].length;
  if (mapConfigs.length !== count * (count + 1) / 2 * MAP_LAYOUTS.length) throw new Error('Incomplete map catalog');
  return { BOARD_WIDTH_UM, BOARD_HEIGHT_UM, MAP_LAYOUTS, MAP_DISPOSITIONS: data['force-dispositions'].map(row => row.name), mapConfigs, meta };
}

export async function load40kdcMaps(options) {
  const dataset = await loadDataset(options);
  try { return buildCatalog(dataset); }
  catch (error) {
    if (dataset.meta.mode !== 'live') throw error;
    const fallback = await loadDataset({ offline: true });
    fallback.meta.mode = 'fallback';
    fallback.meta.liveError = `Upstream geometry/catalog changed: ${error.message}`;
    return buildCatalog(fallback);
  }
}
