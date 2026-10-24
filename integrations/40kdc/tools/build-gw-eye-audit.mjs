import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
if(process.argv.length!==5)throw new Error('Usage: build-gw-eye-audit.mjs extracted-icons.json pages.txt output.json');
import {adaptLayout} from '../adapter.js';
import {pointSegmentDistance} from '../terrain-links.js';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const data=Object.fromEntries(['terrain-layouts','terrain-templates','mission-matchups','deployment-patterns','force-dispositions'].map(n=>[n,JSON.parse(readFileSync(root+'integrations/40kdc/snapshot/'+n+'.json'))]));
const pages=JSON.parse(readFileSync(process.argv[2]));
const texts=readFileSync(process.argv[3],'utf8').split(/=== PDF PAGE \d+ ===/).slice(1);
const dispositions=['Take and Hold','Purge the Foe','Disruption','Reconnaissance','Priority Assets'];
const results=[];
for(const page of pages){
const text=texts[page.page-1];const ds=dispositions.filter(d=>text.includes(d.toUpperCase()));
const letter=text.match(/LAYOUT\s+([ABC])/)[1];
if(ds.length===1)ds.push(ds[0]);
const layout=data['terrain-layouts'].find(l=>{if(l.source!=='battlemaster-11e'||l.variant!=='ABC'.indexOf(letter)+1)return false;const mm=data['mission-matchups'].find(m=>m.id===l.mission_matchup_id);const ids=ds.map(d=>d.toLowerCase().replaceAll(' ','-'));return [mm.disposition,mm.opponent_disposition].sort().join('|')===ids.sort().join('|')});
if(!layout)throw Error('missing '+page.page);
const map=adaptLayout(layout,data,{});
for(const icon of page.icons){
const pt={x:(icon.x-127.991)/340.158*44,y:(564.116-icon.y)/462.613*60};
const nearby=map.geometry.resolved.filter(p=>p.piece_type==='area').map(p=>({id:p.id,d:Math.min(...p.vertices.map((v,i)=>pointSegmentDistance(pt,v,p.vertices[(i+1)%p.vertices.length])))})).sort((a,b)=>a.d-b.d);
results.push({page:page.page,layout:layout.id,linked:icon.linked,point:pt,pair:nearby.slice(0,2).map(p=>p.id).sort(),distances:nearby.slice(0,3).map(p=>+p.d.toFixed(3))});
}
}
writeFileSync(process.argv[4],JSON.stringify(results,null,2)+'\n');
console.log(`${results.length} symbol-to-area associations. Review ambiguous/changed layouts before generating overrides.`);
