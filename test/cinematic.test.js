import test from 'node:test';
import assert from 'node:assert/strict';
import { cinematicModel } from '../src/engine/components/cinematic-comparison.js';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';
const spec=(a,b,options={})=>({type:'bar',data:{labels:a.map((_,i)=>String(i)),datasets:[{values:a},{values:b}]},options});
test('cinematic additive totals and directional contributions remain financially valid',()=>{
 const demo=cinematicModel(loadDeck('presentations/cinematic-revenue.yaml').slides[1].chart);
 assert.deepEqual(demo.totals,[8300000,16200000]);assert.equal(demo.winner,1);assert.equal(demo.changes[1],2600000);
 assert.equal(cinematicModel(spec([10,1,1],[1,7,6])).winner,1);
 assert.equal(cinematicModel(spec([1,7,6],[10,1,1])).winner,1);
 assert.equal(cinematicModel(spec([60,70],[70,80],{format_y:'percent'})),null);
 assert.equal(cinematicModel(spec([1e-300],[1e300])),null);
 assert.equal(cinematicModel(spec([null],[1])),null);
 assert.equal(cinematicModel(spec([-1],[1])),null);
 assert.equal(cinematicModel(spec([1,2],[2,1])).growth,0);
});
test('cinematic fallback preserves source and script injection remains escaped',()=>{
 const d=loadDeck('presentations/cinematic-revenue.yaml');d.slides[1].source='PROVENANCE_SENTINEL';d.slides[1].footnote='FOOTNOTE_SENTINEL';
 d.slides[1].chart.options.stacked=true;const fallback=renderDeck({...d,slides:[d.slides[1]]});
 assert.ok(fallback.includes('PROVENANCE_SENTINEL'));assert.ok(fallback.includes('FOOTNOTE_SENTINEL'));assert.ok(!fallback.includes('class="cinema-stage"'));
 d.slides[1].chart.options.stacked=false;d.slides[1].chart.data.labels[0]='</script><img src=x onerror=alert(1)>';
 assert.ok(!renderDeck(d).includes('</script><img src=x onerror=alert(1)>'));
});
