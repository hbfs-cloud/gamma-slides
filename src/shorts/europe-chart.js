import {writeFileSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sma(values,n){return values.map((_,i)=>i<n-1?null:values.slice(i-n+1,i+1).reduce((a,b)=>a+b,0)/n);}
export function europeanChart(payload,{ticker,from,asof,levels=[]}){
 const bars=payload.bars;
 if(!bars?.length||!ticker||!from||!asof)throw Error('Daily bars, ticker and explicit window required');
 for(let i=0;i<bars.length;i++){const b=bars[i];if(b.length<6||b.slice(1,6).some(x=>!Number.isFinite(x))||b[2]<Math.max(b[1],b[4])||b[3]>Math.min(b[1],b[4])||b[5]<0||b[0]>asof||(i&&bars[i-1][0]>=b[0]))throw Error('Invalid or unordered OHLCV');}
 if(bars.at(-1)[0]!==asof)throw Error('Last daily bar must match reference date');
 const start=bars.findIndex(b=>b[0]>=from);if(start<0)throw Error('No bars in visible window');
 const data=bars.slice(start),close=bars.map(b=>b[4]),averages=[20,50,200].map(n=>sma(close,n).slice(start));
 const values=[...data.flatMap(b=>[b[2],b[3]]),...averages.flat().filter(x=>x!==null),...levels];
 const lo=Math.min(...values),hi=Math.max(...values),pad=Math.max((hi-lo)*.08,.01),y=v=>306-(v-lo+pad)/(hi-lo+2*pad)*230;
 const x=i=>49+i/Math.max(1,data.length-1)*698,body=Math.max(2,Math.min(8,530/data.length));
 const last=data.at(-1),previous=bars.at(-2),change=previous?(last[4]/previous[4]-1)*100:0;
 const fmt=n=>n.toFixed(2),vol=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(0)+'K':String(n);
 const colors=['#d77ccb','#e6a354','#cbb777'];let marks='';
 for(let i=0;i<6;i++){const value=lo+(hi-lo)*i/5,yy=y(value);marks+=`<path d="M38 ${yy}H780" stroke="#ccd1d6" stroke-dasharray="4 4"/><text x="789" y="${yy+5}" font-size="15">${fmt(value)}</text>`;}
 const maxV=Math.max(...data.map(b=>b[5]),1);
 data.forEach((b,i)=>{const color=b[4]>=b[1]?'#149443':'#d93445';marks+=`<path d="M${x(i)} ${y(b[2])}V${y(b[3])}" stroke="${color}" stroke-width="1.4"/><rect x="${x(i)-body/2}" y="${Math.min(y(b[1]),y(b[4]))}" width="${body}" height="${Math.max(1,Math.abs(y(b[1])-y(b[4])))}" fill="${color}"/><rect x="${x(i)-body/2}" y="${360-b[5]/maxV*43}" width="${body}" height="${b[5]/maxV*43}" fill="${color}" opacity=".45"/>`;});
 averages.forEach((a,j)=>{const valid=a.map((v,i)=>v===null?null:[x(i),y(v)]).filter(Boolean);if(valid.length)marks+=`<polyline points="${valid.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${colors[j]}" stroke-width="1.8"/>`;});
 levels.forEach(v=>{marks+=`<path d="M38 ${y(v)}H780" stroke="#7b52ad" stroke-width="1" stroke-dasharray="3 3"/>`;});
 let month='';data.forEach((b,i)=>{if(b[0].slice(0,7)!==month){month=b[0].slice(0,7);marks+=`<text x="${x(i)}" y="382" font-size="17">${new Date(b[0]+'T12:00Z').toLocaleString('en',{month:'short',timeZone:'UTC'})}</text>`;}});
 return `<svg xmlns="http://www.w3.org/2000/svg" width="836" height="396" viewBox="0 0 836 396"><rect width="836" height="396" fill="white"/><g font-family="Arial,sans-serif" fill="#555"><text x="12" y="25" font-size="25" font-weight="bold">${escape(ticker)}</text><text x="190" y="24" font-size="17">${escape(asof)} · DAILY EUR</text><text x="590" y="24" font-size="18" fill="${change>=0?'#149443':'#d93445'}">${fmt(last[4])} (${change>=0?'+':''}${fmt(change)}%)</text><text x="12" y="48" font-size="16">O ${fmt(last[1])}  H ${fmt(last[2])}  L ${fmt(last[3])}  C ${fmt(last[4])}  V ${vol(last[5])}</text>${averages.map((a,j)=>`<text x="${12+j*248}" y="69" fill="${colors[j]}" font-size="16">SMA ${[20,50,200][j]} · ${a.at(-1)===null?'unavailable':fmt(a.at(-1))}</text>`).join('')}${marks}<text x="10" y="330" font-size="13">Vol</text><text x="10" y="348" font-size="13">${vol(maxV)}</text><text x="605" y="48" font-size="12">Dotted lines: plan levels</text></g></svg>`;
}
// Standalone CLI: normalized {bars:[[date,open,high,low,close,volume],...]} input.
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [input,ticker,from,asof,output]=process.argv.slice(2);
 if(!output)throw Error('Usage: europe-chart.js input.json ticker from asof output.svg');
 writeFileSync(output,europeanChart(JSON.parse(readFileSync(input,'utf8')),{ticker,from,asof}));
}
