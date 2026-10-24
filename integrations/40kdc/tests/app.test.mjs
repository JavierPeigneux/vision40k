// DOM integration test. Canvas calls are recorded, not rasterized; this is not visual QA.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Window } from 'npm:happy-dom@21.0.4';
const compatibilityUrl = Deno.args.includes('--compat-url');
const window = new Window({ url: `http://localhost/${compatibilityUrl ? '?source=40kdc&a=Priority+Assets&b=Reconnaissance&layout=A' : ''}`, settings: { disableCSSFileLoading:true, disableJavaScriptFileLoading:true } });
const root = new URL('../../../', import.meta.url);
window.document.body.innerHTML = readFileSync(new URL('index.html',root),'utf8').split('<body>')[1].split('</body>')[0];
for (const name of ['window','document','localStorage','location','navigator','HTMLElement','HTMLInputElement','HTMLSelectElement','SVGElement','Event','MouseEvent']) Object.defineProperty(globalThis,name,{value: name==='window'?window:window[name], configurable:true});
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
const draws=[];
const context = new Proxy({}, {get:(_target,key)=>key==='drawImage'? (...args)=>draws.push(args): ()=>{}});
window.HTMLCanvasElement.prototype.getContext = ()=>context;
window.HTMLElement.prototype.getBoundingClientRect = ()=>({x:0,y:0,width:880,height:1200,left:0,top:0,right:880,bottom:1200});
globalThis.Image = class {
  complete=true; naturalWidth=880; naturalHeight=1200;
  set src(value) { this._src=value; } get src() { return this._src; }
};
const fetched=[];
globalThis.fetch = async url => {
  const input = String(url); fetched.push(input);
  if (input.startsWith('https:')) throw new Error('offline DOM test');
  const file = input.startsWith('file:') ? new URL(input) : new URL(input.split('?')[0],root);
  return new Response(readFileSync(file),{status:200});
};
const geometry = await import(new URL('../../../app.js',import.meta.url));
const doc=window.document;
assert.equal(doc.querySelectorAll('#disposition-a-select option').length,5);
assert.equal(doc.querySelectorAll('#layout-select option').length,3);
assert.ok(draws.length>0,'board canvas receives generated image');
{
  assert.match(doc.querySelector('#map-source').textContent,/45 map/);
  assert.ok(!fetched.some(url=>url.includes('pdf-maps')||url.includes('map-configs')),'default application never requests removed map assets');
  assert.ok(!fetched.some(url=>url.includes('configs/editable')),'PDF calibration must not override generated geometry');
  assert.ok(draws.some(args=>args[0]?.src?.startsWith('data:image/svg+xml')),'generated vector map rendered via existing canvas pipeline');
}
const layout=doc.querySelector('#layout-select'); layout.value='C'; layout.dispatchEvent(new window.Event('change'));
assert.match(window.location.search,/layout=C/);
assert.ok(doc.querySelector('#terrain-layer').children.length > 0);

const add=doc.querySelector('#add-blue'); assert.ok(add); add.click();
assert.ok(doc.querySelectorAll('.unit').length>0,'existing base placement works');
const en=doc.querySelector('[data-language="en"]'); en.click();
assert.match(doc.querySelector('#map-source').textContent,/generated maps/i);
console.log(`PASS ${compatibilityUrl?'compatibility URL':'default generated'} app initialization, canvas source, selectors, base creation and language toggle`);
// Regression: one logical terrain feature can have disconnected contours.
const rect=(x0,x1)=>[{x:x0,y:2},{x:x1,y:2},{x:x1,y:6},{x:x0,y:6}];
const linked={id:'linked:test',x:0,y:0,rotation:0,width:10,height:4,polygons:[rect(2,6),rect(8,12)]};
assert.equal(geometry.isPointInsideTerrain({x:3,y:4},linked),true);
assert.equal(geometry.isPointInsideTerrain({x:9,y:4},linked),true);
assert.equal(geometry.isPointInsideTerrain({x:7,y:4},linked),false,'gap is not terrain');
assert.equal(geometry.segmentIntersectsTerrain({x:7,y:0},{x:7,y:8},linked),false,'no invented connector across the gap');
assert.equal(geometry.segmentIntersectsTerrain({x:1,y:4},{x:13,y:4},linked),true);
assert.equal(geometry.getTerrainRayIntersections({x:0,y:4},0,linked).length,4);
const touching={...linked,polygons:[rect(2,6),rect(6,12)]};
assert.deepEqual(geometry.getTerrainRayIntersections({x:0,y:4},0,touching).map(hit=>hit.distance),[2,12],'shared seam is not an outer boundary');
const straddling={shape:'round',sizeMm:25.4,x:6,y:4,rotation:0};
assert.equal(geometry.getUnitTerrainState(straddling,touching).fullyInside,true,'base crossing a shared seam is inside the single logical feature');
assert.equal(geometry.getUnitTerrainState({...straddling,x:7},linked).fullyInside,false,'base in a genuine gap is outside the logical feature');
console.log('PASS logical compound terrain, unit spanning a shared seam, real gaps and removal of internal ray seams');
{
  for(const [selector,value] of [['#disposition-b-select','Reconnaissance'],['#disposition-a-select','Priority Assets'],['#layout-select','A']]) {
    const select=doc.querySelector(selector);select.value=value;select.dispatchEvent(new window.Event('change'));
  }
  const current=geometry.getCurrentMap();
  assert.equal(current.source.upstreamId,'bm-recon-vs-assets-01');
  assert.equal(current.terrain.length,11);
  assert.ok(current.terrain.some(group=>['area-08','area-16'].every(id=>group.memberIds.includes(id))));
  for(const pair of [['area-02','area-03'],['area-10','area-11'],['area-04','area-05'],['area-12','area-13']]) {
    assert.ok(current.terrain.some(group=>pair.every(id=>group.memberIds.includes(id))),`PDF single-area symbol links ${pair}`);
  }
  for(const pair of [['area-06','area-07'],['area-14','area-15']]) {
    assert.ok(!current.terrain.some(group=>pair.every(id=>group.memberIds.includes(id))),`PDF crossed-eye symbol keeps ${pair} separate`);
  }
  const center=current.terrain.find(t=>t.linkGroup==='objective-center');
  const { polygonCentroid } = await import('../vendor/resolve.js');
  for(const contour of center.polygons) {
    const point=polygonCentroid(contour);
    const occupant={shape:'round',sizeMm:25,...point};
    assert.equal(geometry.getUnitTerrainState(occupant,center).fullyInside,true);
    assert.ok(geometry.getIgnoredTerrainsForSource(occupant).has(center.id),'source in either part recognizes the same logical feature');
    assert.ok(geometry.getIgnoredTerrainsForTarget(occupant).has(center.id),'target in either part recognizes the same logical feature');
  }
  const unit={shape:'round',sizeMm:25,x:22,y:30};
  assert.equal(geometry.getUnitTerrainState(unit,center).fullyInside,true,'submillimetre seam must not split the central terrain');
  assert.ok(geometry.getIgnoredTerrainsForSource(unit).has(center.id),'vision-from recognizes the complete central feature');
  const {load40kdcMaps}=await import('../adapter.js');
  const catalog=await load40kdcMaps({offline:true});
  let centers=0;
  for(const map of catalog.mapConfigs) for(const group of map.terrain.filter(t=>t.linkGroup==='objective-center')) {
    assert.equal(geometry.getUnitTerrainState(unit,group).fullyInside,true,map.source.upstreamId+' central seam'); centers++;
  }
  console.log(`PASS reported Recon/Assets A: 5 PDF single-area pairs, 2 separate-area pairs, both central halves share source/target identity, and ${centers} central joins across the catalog`);
}
if (Deno.args.includes('--benchmark')) {
  let seed=42;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const rays=Array.from({length:5000},()=>[{x:random()*44,y:random()*60},{x:random()*44,y:random()*60}]);
  const start=performance.now();let blocked=0;
  for(const [a,b] of rays)if(geometry.lineBlockedByTerrainForVision(a,b))blocked++;
  console.log(`BENCH 5000 vision rays: ${(performance.now()-start).toFixed(1)} ms, blocked=${blocked}`);
}
{
  doc.querySelector('#clear-selection').click();
  doc.querySelector('#add-blue').click();
  let clicked=doc.querySelector('.unit');
  const id=clicked.dataset.unitId;
  const gesture=(node,pointerId,jitter=0)=> {
    node.dispatchEvent(new window.PointerEvent('pointerdown',{pointerId,clientX:160,clientY:600,bubbles:true}));
    if(jitter)window.dispatchEvent(new window.PointerEvent('pointermove',{pointerId,clientX:160+jitter,clientY:600+jitter}));
    window.dispatchEvent(new window.PointerEvent('pointerup',{pointerId,clientX:160+jitter,clientY:600+jitter}));
    assert.ok(node.isConnected,'pointerup must preserve the target for the subsequent native click');
    node.click();
  };
  gesture(clicked,41);
  clicked=doc.querySelector(`[data-unit-id="${id}"]`);
  assert.ok(clicked.classList.contains('selected'),'pointer click selects');
  const left=clicked.style.left;
  gesture(clicked,42,1);
  clicked=doc.querySelector(`[data-unit-id="${id}"]`);
  assert.ok(!clicked.classList.contains('selected'),'second pointer click deselects');
  assert.equal(clicked.style.left,left,'click jitter must not move the base');
  doc.querySelector('#clear-selection').click();
  console.log('PASS full pointerdown/pointerup/click selection, deselection and jitter tolerance');
}
{
  doc.querySelector('#add-blue').click();
  let dragged=doc.querySelector('.unit');dragged.click();dragged=doc.querySelector('.unit');
  const frames=new Map();let serial=0;
  window.requestAnimationFrame=callback=>{frames.set(++serial,callback);return serial;};
  window.cancelAnimationFrame=id=>frames.delete(id);
  doc.querySelector('#vision-from').click();
  const leftBefore=dragged.style.left;
  dragged.dispatchEvent(new window.PointerEvent('pointerdown',{pointerId:7,clientX:160,clientY:600,bubbles:true}));
  for(let i=0;i<100;i++) window.dispatchEvent(new window.PointerEvent('pointermove',{pointerId:7,clientX:300+i,clientY:610}));
  assert.equal(frames.size,1,'a burst of pointer events schedules one frame');
  assert.equal(dragged.style.left,leftBefore,'movement waits for the frame');
  const callback=[...frames.values()][0];frames.clear();callback();
  assert.equal(doc.querySelector('.unit'),dragged,'drag does not rebuild the unit node');
  assert.notEqual(dragged.style.left,leftBefore);
  const finalLeft=dragged.style.left;
  window.dispatchEvent(new window.PointerEvent('pointerup',{pointerId:7,clientX:399,clientY:610}));
  assert.equal(doc.querySelector('.unit').style.left,finalLeft,'release commits the last position');
  doc.querySelector('.unit').click();
  assert.ok(doc.querySelector('.unit').classList.contains('selected'),'the synthetic click following a drag must not toggle selection');
  for(let i=0;i<200 && !doc.querySelector('#vision-layer').classList.contains('is-visible');i++) await new Promise(resolve=>setTimeout(resolve,5));
  assert.ok(doc.querySelector('#vision-layer').classList.contains('is-visible'),'latest asynchronous vision job completes');
  doc.querySelector('#vision-from').click();
  await new Promise(resolve=>setTimeout(resolve,25));
  assert.ok(!doc.querySelector('#vision-layer').classList.contains('is-visible'),'a cancelled vision job cannot repaint the overlay');
  dragged=doc.querySelector('.unit');
  dragged.dispatchEvent(new window.PointerEvent('pointerdown',{pointerId:8,clientX:399,clientY:610,bubbles:true}));
  window.dispatchEvent(new window.PointerEvent('pointermove',{pointerId:8,clientX:450,clientY:620}));
  window.dispatchEvent(new window.PointerEvent('pointerup',{pointerId:8,clientX:450,clientY:620}));
  assert.equal(frames.size,0,'release cancels a pending animation frame');
  assert.ok(Math.abs(parseFloat(doc.querySelector('.unit').style.left)-450/880*100)<1e-6,'release flushes the newest queued movement');
  console.log('PASS coalesced pointer bursts, stable drag DOM, final/pending positions and cancellable asynchronous vision');
}
{
  const reference=await import('./geometry-reference.js');
  const catalog=await (await import('../adapter.js')).load40kdcMaps({offline:true});
  let seed=17,cases=0;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(const map of catalog.mapConfigs)for(const terrain of map.terrain)for(let i=0;i<40;i++) {
    const a={x:random()*44,y:random()*60},b={x:random()*44,y:random()*60};
    assert.equal(geometry.isPointInsideTerrain(a,terrain),reference.isPointInsideTerrain(a,terrain));
    assert.equal(geometry.segmentIntersectsTerrain(a,b,terrain),reference.segmentIntersectsTerrain(a,b,terrain));
    cases++;
  }
  for(const point of [{x:1,y:1},{x:-1,y:1},{x:1,y:-1},{x:0,y:0}]) {
    const rectangle={x:0,y:0,width:2,height:2,rotation:0};
    assert.equal(geometry.isPointInsideTerrain(point,rectangle),reference.isPointInsideTerrain(point,rectangle));
  }
  console.log(`PASS accelerated geometry matches the pre-optimization algorithm in ${cases} cases across 45 maps and rectangle boundaries`);
}
await window.happyDOM.abort();
