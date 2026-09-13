import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

export const SHORTS_VERSION = 'signal-room-shorts-v1';
export const DURATION = 29;
const fields = ['ticker','name','category','catalyst','setup','confirmation','invalidation',
  'catalyst_confidence','entry_confidence','expectation','stop','targets','narration','asof','status'];
export function validateCard(card) {
  const errors=[];
  for (const key of fields) if(typeof card[key]!=='string'||!card[key].trim()) errors.push(`${key}: required text`);
  if(!/^[A-Z0-9.-]{1,20}$/.test(card.ticker||'')) errors.push('invalid ticker');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(card.asof||'')) errors.push('asof: ISO date required');
  if(card.status==='conditional'&&(typeof card.protocol!=='string'||!card.protocol.trim()))errors.push('conditional card requires complete protocol text');
  if(!['USD','EUR'].includes(card.currency))errors.push('currency: USD or EUR required');
  if(!Array.isArray(card.levels)||card.levels.some(n=>!Number.isFinite(n)||n<=0))errors.push('levels: positive numeric array required');
  if(card.reference_levels!==undefined&&(!Array.isArray(card.reference_levels)||card.reference_levels.some(n=>!Number.isFinite(n)||n<=0)))errors.push('reference_levels: positive numeric array required');
  if(card.bracket){const b=card.bracket;const keys=['zone_low','zone_high','reclaim','entry_max','stop','tp1','tp2'];if(keys.some(k=>!Number.isFinite(b[k])||b[k]<=0)||!(b.stop<b.zone_low&&b.zone_low<=b.zone_high&&b.zone_high<b.reclaim&&b.reclaim<=b.entry_max&&b.entry_max<b.tp1&&b.tp1<=b.tp2))errors.push('invalid long pullback bracket');}
  if(!['conditional','watch_only'].includes(card.status)) errors.push('status: conditional or watch_only required');
  if(!['High','Medium','Unrated'].includes(card.catalyst_confidence)) errors.push('catalyst confidence: qualitative evidence rating required');
  if(card.entry_confidence!=='Unconfirmed') errors.push('entry confidence must remain Unconfirmed for premarket preparation');
  if(!Array.isArray(card.source_urls)||card.source_urls.some(x=>!/^https:\/\//.test(x))||(!card.source_urls.length&&!(card.status==='watch_only'&&card.catalyst_confidence==='Unrated'&&card.evidence_note))) errors.push('source_urls: primary references required, or explicit unverified watch evidence');
  if((card.narration||'').trim().split(/\s+/).length>48) errors.push('narration exceeds 48 words; shorten, never accelerate');
  for(const key of ['catalyst','setup','confirmation','invalidation','expectation','stop','targets'])
    if((card[key]||'').length>150) errors.push(`${key}: exceeds mobile text budget`);
  if(errors.length) throw Error(`${card.ticker||'card'}: ${errors.join('; ')}`);
  return card;
}
export function loadBatch(file) {
  const input=JSON.parse(readFileSync(file,'utf8'));
  const cards=Array.isArray(input)?input:input.cards||input.items;
  if(!Array.isArray(cards)||!cards.length) throw Error('Nonempty cards array required');
  cards.forEach(validateCard);
  if(new Set(cards.map(x=>x.ticker)).size!==cards.length) throw Error('Duplicate ticker');
  return cards;
}
export function localAsset(path, root) {
  const full=resolve(root,path);
  if(!existsSync(full))throw Error(`Missing asset: ${full}`);
  return full;
}
export function stableAsset(a){return {source_kind:a.source_kind,source_url:a.source_url,coverage_warning:a.coverage_warning,asof:a.asof,identity:a.identity};}
export function fingerprint(card, assets, options={}) {
  const h=createHash('sha256');h.update(JSON.stringify({version:SHORTS_VERSION,card,options}));
  for(const file of assets)h.update(readFileSync(file));
  return h.digest('hex');
}
export function metadata(card, week, link='https://dailytickers.substack.com') {
  if(link!=='https://dailytickers.substack.com')throw Error('Promotional URL must be approved Substack');
  return {
    title:`${card.ticker}: ${card.category==='intraday'?'The Pullback Plan':card.status==='watch_only'?'What We Are Watching':'The Setup to Watch'} | ${week} #Shorts`.slice(0,100),
    description:[`${card.name} — preparation for ${week}.`,card.catalyst,
      `Setup: ${card.setup}`,`Confirmation: ${card.confirmation}`,`Invalidation: ${card.invalidation}`,
      `Stop: ${card.stop}`,`Targets: ${card.targets}`,`Catalyst confidence: ${card.catalyst_confidence}. Entry: ${card.entry_confidence}.`,
      `Scenario: ${card.expectation}`,
      ...(card.evidence_note?[`Evidence note: ${card.evidence_note}`]:[]),
      card.protocol||'Incomplete fields remain pending validation; this is a watchlist, not an executable order.',
      `Price references: ${card.asof}. Recheck Monday news and prices. Net expectancy unknown.`,
      `Research: ${link}`,...card.source_urls.map(x=>`Source: ${x}`),
      'English custom synthetic narration. Educational research; no guaranteed outcome.',
      '#Shorts #StockMarket #DailyTickers'].join('\n\n'),
    tags:['Shorts','DailyTickers',card.ticker,'Stock market','Weekly preparation'],
    language:'en',categoryId:'27',privacyStatus:'private'
  };
}
