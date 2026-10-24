import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
if(process.argv.length!==3)throw new Error('Usage: generate-pdf-links.mjs event-companion-v1.3.pdf');
import {adaptLayout} from '../adapter.js';
import {geometrySignature} from '../terrain-links.js';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const data=Object.fromEntries(['terrain-layouts','terrain-templates','mission-matchups','deployment-patterns','force-dispositions'].map(n=>[n,JSON.parse(readFileSync(root+'integrations/40kdc/snapshot/'+n+'.json'))]));
const audit=JSON.parse(readFileSync(root+'integrations/40kdc/tests/fixtures/gw-eye-audit.json'));
const layouts={};
for(const layout of data['terrain-layouts'].filter(l=>l.source==='battlemaster-11e')){
 const map=adaptLayout(layout,data,{});const icons=audit.filter(i=>i.layout===layout.id);
 layouts[layout.id]={page:icons[0].page,signature:geometrySignature(map.geometry.resolved),symbols:icons.map(i=>({pair:i.pair,linked:i.linked,point:i.point}))};
}
const result={source:{url:'https://assets.warhammer-community.com/eng_14-10_wh40k_event_companion-rdwnqprl4c-nj8oqogadv.pdf',version:'1.3',sha256:createHash('sha256').update(readFileSync(process.argv[2])).digest('hex'),legendPage:8,upstreamCommit:JSON.parse(readFileSync(root+'integrations/40kdc/snapshot/metadata.json')).commit,method:'vector eye symbols cross-checked against rasterized pages; nearest area contours; rotational-symmetry check',singleAreaPairs:audit.filter(i=>i.linked).length,separateAreaPairs:audit.filter(i=>!i.linked).length},layouts};
writeFileSync(root+'integrations/40kdc/pdf-links.generated.js','// Supplemental relationships audited against GW Event Companion v1.3. Geometry remains upstream data.\nexport default '+JSON.stringify(result,null,2)+';\n');
console.log('Generated PDF relationship table for '+Object.keys(layouts).length+' maps');
