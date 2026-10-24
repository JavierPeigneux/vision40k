import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load40kdcMaps } from '../adapter.js';
const local = await load40kdcMaps({offline:true});
assert.equal(local.mapConfigs.length,45);
assert.equal(local.meta.mode,'snapshot');
console.log('PASS snapshot loading');
const originalFetch = globalThis.fetch;
globalThis.fetch = (url,options) => String(url).startsWith('https:') ? Promise.reject(new Error('simulated network outage')) : originalFetch(url,options);
const fallback = await load40kdcMaps();
assert.equal(fallback.meta.mode,'fallback');
assert.equal(fallback.mapConfigs.length,45);
assert.match(fallback.meta.liveError,/simulated network outage/);
console.log('PASS remote outage falls back to usable local maps');
globalThis.fetch = async (url,options) => {
  if (!String(url).startsWith('https:')) return originalFetch(url,options);
  if (String(url).includes('/commits/main')) return new Response(JSON.stringify({sha:'a'.repeat(40)}));
  const filename = String(url).split('/').pop();
  const rows = JSON.parse(readFileSync(new URL('../snapshot/'+filename,import.meta.url)));
  if(filename==='terrain-layouts.json') rows[0].pieces[0].template='missing-template-in-new-schema';
  return new Response(JSON.stringify(rows));
};
const incompatible = await load40kdcMaps();
assert.equal(incompatible.meta.mode,'fallback');
assert.equal(incompatible.mapConfigs.length,45);
assert.match(incompatible.meta.liveError,/geometry\/catalog changed/);
console.log('PASS incompatible upstream geometry falls back before app initialization');
globalThis.fetch = originalFetch;
if (Deno.args.includes('--live')) {
  const live = await load40kdcMaps();
  assert.equal(live.meta.mode,'live',live.meta.liveError);
  assert.equal(live.mapConfigs.length,45);
  console.log(`PASS live source: ${live.meta.commit}, ${live.mapConfigs.length} generated maps`);
}
