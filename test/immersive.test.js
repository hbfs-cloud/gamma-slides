import test from 'node:test';
import assert from 'node:assert/strict';
import { spatialModel, formatSpatialValue } from '../src/engine/components/immersive-data.js';
import { renderDeck } from '../src/engine/renderer.js';
import { loadDeck } from '../src/loader/index.js';

test('spatial data preserves values and rejects ambiguous or missing observations',()=>{
  const chart={type:'bar',data:{labels:['A','B'],datasets:[{label:'Year',values:[-123456789,2]}]}};
  assert.equal(spatialModel(chart).points[0].y,-123456789);
  assert.equal(formatSpatialValue(123456789),'123456789');
  assert.deepEqual(spatialModel(chart).ranges.y,[-123456789,2]);
  assert.equal(spatialModel({...chart,options:{stacked:true}}),null);
  assert.equal(spatialModel({...chart,data:{...chart.data,datasets:[{values:[null,2]}]}}),null);
  assert.equal(spatialModel({...chart,data:{...chart.data,datasets:[{values:[2]}]}}),null);
});
test('constant large coordinates have finite nonzero spans',()=>{
  const model=spatialModel({type:'scatter',data:{datasets:[{points:[{x:1e20,y:0,z:3},{x:1e20,y:1,z:3}]}]}});
  for(const range of Object.values(model.ranges)) assert.ok(Number.isFinite(range[1]-range[0])&&range[1]>range[0]);
});
test('spatial markup cannot close its JSON script and fallback retains provenance',()=>{
  const deck=loadDeck('presentations/immersive-data.yaml');
  deck.slides[0].chart.data.labels[0]='</script><img src=x onerror=alert(1)>';
  const html=renderDeck(deck);
  assert.ok(!html.includes('</script><img src=x onerror=alert(1)>'));
  deck.slides[0].chart.options.stacked=true;
  const fallback=renderDeck({...deck,slides:[deck.slides[0]]});
  assert.ok(fallback.includes('Segment totals reconcile'));
  assert.ok(!fallback.includes('class="immersive-chart"'));
});
