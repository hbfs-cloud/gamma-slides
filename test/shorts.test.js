import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCard,metadata,fingerprint,stableAsset} from '../src/shorts/cards.js';
import {checkMedia} from '../src/shorts/render.js';
const card={ticker:'HPE',name:'Hewlett Packard Enterprise',category:'intraday',currency:'USD',levels:[59,59.15],protocol:'Zone touch followed by a later fifteen-minute close; five-minute IOC window.',catalyst:'Reported earnings',setup:'Conditional pullback',confirmation:'Later 15m close above 59',invalidation:'Return to 59 before entry',catalyst_confidence:'High',entry_confidence:'Unconfirmed',expectation:'Scenario only',stop:'57.80',targets:'62.10 / 64.20',narration:'Wait for the signal.',asof:'2026-09-11',status:'conditional',source_urls:['https://www.hpe.com']};
test('unconfirmed cards remain conditional and do not gain a probability',()=>{
 assert.equal(validateCard({...card}).status,'conditional');
 assert.throws(()=>validateCard({...card,catalyst_confidence:'90%'}),/qualitative/);
 assert.throws(()=>validateCard({...card,entry_confidence:'Confirmed'}),/Unconfirmed/);
});
test('long narration and absent evidence fail before production',()=>{
 assert.throws(()=>validateCard({...card,narration:'word '.repeat(49)}),/shorten/);
 assert.throws(()=>validateCard({...card,source_urls:[]}),/primary/);
});
test('cache changes for a price correction, not only a ticker',()=>{
 assert.notEqual(fingerprint(card,[]),fingerprint({...card,stop:'57.70'},[]));
});
test('metadata keeps provenance and only approved promotional destination',()=>{
 const m=metadata(card,'SEP 14–18');assert.match(m.description,/substack.com/);assert.match(m.description,/2026-09-11/);
 assert.throws(()=>metadata(card,'SEP 14–18','https://dailytickers.com'),/Substack/);
});
test('video QA refuses landscape, missing audio, and 30-second output',()=>{
 const p={streams:[{codec_type:'video',codec_name:'h264',width:1080,height:1920,nb_frames:'870'},{codec_type:'audio',codec_name:'aac'}],format:{duration:'29.000'}};
 assert.equal(checkMedia(p).duration,29);
 assert.throws(()=>checkMedia({...p,format:{duration:'30'}}),/strictly/);
 assert.throws(()=>checkMedia({...p,streams:[{...p.streams[0],width:1920,height:1080}]}),/1080x1920/);
});

test('incomplete conditional protocol and inverted brackets cannot render',()=>{assert.throws(()=>validateCard({...card,protocol:{confirmation:'invalid shape'}}),/protocol/);assert.throws(()=>validateCard({...card,bracket:{zone_low:58.5,zone_high:58.9,reclaim:59,entry_max:59.15,stop:60,tp1:62.1,tp2:64.2}}),/bracket/);});

test("display references and stable provenance are validated",()=>{assert.throws(()=>validateCard({...card,reference_levels:["bad"]}),/reference_levels/);const a={source_kind:"Finviz",asof:"2026-09-11",fetchedAt:"yesterday"};assert.deepEqual(stableAsset(a),stableAsset({...a,fetchedAt:"today"}));});
