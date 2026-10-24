import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveLayout } from '../vendor/resolve.js';
import { adaptLayout, toPortrait } from '../adapter.js';
const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const cases = json('./conformance.json');
for (const test of cases) {
  const pieces = resolveLayout(test.layout, test.templates);
  assert.deepEqual(pieces, test.expected.pieces, test.name);
}
console.log(`PASS ${cases.length} upstream geometry conformance cases`);
const data = Object.fromEntries(['terrain-layouts','terrain-templates','mission-matchups','deployment-patterns','force-dispositions'].map(name => [name,json(`../snapshot/${name}.json`)]));
const layouts = data['terrain-layouts'].filter(row => row.source === 'battlemaster-11e');
const maps = layouts.map(layout => adaptLayout(layout,data,{commit:'test'}));
assert.equal(maps.length,45);
assert.equal(new Set(maps.map(map => map.id)).size,45);
let pieces = 0;
for (const map of maps) {
  assert.ok(map.terrain.length > 0);
  const raw = layouts.find(row => row.id === map.source.upstreamId);
  const expected = resolveLayout(raw,data['terrain-templates']).filter(piece => piece.piece_type === 'area' && raw.pieces.find(row => row.id === piece.id)?.terrain !== false);
  const contours = map.terrain.flatMap(piece => (piece.polygons ?? [piece.polygon]).map((polygon,i) => ({id:piece.memberIds[i],polygon})));
  assert.equal(contours.length,expected.length);
  for (const piece of contours) {
    assert.deepEqual(piece.polygon,expected.find(row=>row.id===piece.id).vertices.map(toPortrait));
    for (const p of piece.polygon) { assert.ok(p.x >= -0.1 && p.x <= 44.1 && p.y >= -0.1 && p.y <= 60.1, `${map.id} out of bounds`); }
    const svg = decodeURIComponent(map.image.src.split(',').slice(1).join(','));
    assert.ok(svg.includes(`points="${piece.polygon.map(p => `${p.x},${p.y}`).join(' ')}"`),'visual and collision geometry must match');
    pieces++;
  }
  const links = new Map();
  for (const piece of raw.pieces) if(piece.link_group) {
    if(!links.has(piece.link_group)) links.set(piece.link_group,[]);
    links.get(piece.link_group).push(piece.id);
  }
  for(const [link,ids] of links) {
    const feature=map.terrain.find(row=>row.linkGroup===link);
    assert.deepEqual(feature.memberIds,ids);
    assert.equal(map.terrain.filter(row=>row.linkGroup===link).length,1);
  }
}
assert.deepEqual(toPortrait({x:0,y:0}),{x:44,y:0});
assert.deepEqual(toPortrait({x:60,y:44}),{x:0,y:60});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
assert.equal(distance({x:1,y:2},{x:4,y:6}),distance(toPortrait({x:1,y:2}),toPortrait({x:4,y:6})));
console.log(`PASS ${maps.length} unique maps, ${pieces} area polygons, bounds, rigid transform and visual/collision parity`);
// Explicitly cover open/non-terrain footprints so they do not become LOS blockers.
const empty = structuredClone(layouts[0]); empty.pieces[0].terrain = false;
assert.ok(!adaptLayout(empty,data,{}).terrain.some(piece=>piece.memberIds.includes(empty.pieces[0].id)));
console.log('PASS non-terrain footprints excluded from collision geometry');

console.log(`PASS link_group preserved: ${maps.reduce((sum,map)=>sum+map.terrain.length,0)} logical terrain features from ${pieces} contours`);
