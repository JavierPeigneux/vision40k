import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import rules from '../pdf-links.generated.js';
import {adaptLayout} from '../adapter.js';
const json=path=>JSON.parse(readFileSync(new URL(path,import.meta.url)));
const data=Object.fromEntries(['terrain-layouts','terrain-templates','mission-matchups','deployment-patterns','force-dispositions'].map(n=>[n,json('../snapshot/'+n+'.json')]));
const audit=json('./fixtures/gw-eye-audit.json');
let open=0,closed=0,missing=0;
for(const raw of data['terrain-layouts'].filter(l=>l.source==='battlemaster-11e')){
 const map=adaptLayout(raw,data,{}),source=adaptLayout(raw,data,{pdfPolicy:'source-only'});
 assert.equal(map.source.pdfRules.status,'applied');
 const grouped=(catalog,pair)=>catalog.terrain.some(t=>pair.every(id=>t.memberIds.includes(id)));
 for(const icon of audit.filter(i=>i.layout===raw.id)){
  assert.equal(grouped(map,icon.pair),icon.linked,`${raw.id} PDF page ${icon.page}, ${icon.pair}`);
  const symbol=rules.layouts[raw.id].symbols.find(s=>s.pair.join()===icon.pair.join());
  assert.equal(symbol.linked,icon.linked);
  if(icon.linked){open++;if(!grouped(source,icon.pair))missing++;}else closed++;
  // Every audit relation has a corresponding rotated relation (or is self-symmetric).
  const twin=id=>{
   const p=raw.pieces.find(p=>p.id===id);
   return raw.pieces.reduce((best,q)=>Math.hypot(q.position.x-(60-p.position.x),q.position.y-(44-p.position.y))<Math.hypot(best.position.x-(60-p.position.x),best.position.y-(44-p.position.y))?q:best).id;
  };
  const reflected=icon.pair.map(twin).sort();
  assert.ok(audit.some(i=>i.layout===raw.id && i.linked===icon.linked && i.pair.join()===reflected.join()),'pair assignment preserves board symmetry');
 }
}
assert.equal(open,103);assert.equal(closed,112);assert.equal(missing,82);
const changed=structuredClone(data['terrain-layouts'].find(l=>l.id==='bm-recon-vs-assets-01'));
changed.pieces[0].position.x+=1;
const revised=adaptLayout(changed,data,{});
assert.equal(revised.source.pdfRules.status,'geometry-changed');
assert.equal(revised.terrain.length,15,'unreviewed geometry uses upstream links, never stale PDF overrides');
console.log(`PASS all 45 maps: ${open} single-area and ${closed} separate-area PDF symbols; ${missing} missing upstream links supplemented; symmetry and geometry-change guard`);
