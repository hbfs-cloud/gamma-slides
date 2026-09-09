/** Runs in the browser. Composite text fill, translucent surfaces and ancestor opacity. */
export function presentationContrast() {
  const slide=Reveal.getCurrentSlide(),canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const rgba=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map(v=>v/255);};
  const over=(f,b)=>{const a=f[3]+b[3]*(1-f[3]);return a?[0,1,2].map(i=>(f[i]*f[3]+b[i]*b[3]*(1-f[3]))/a).concat(a):[0,0,0,0];};
  const lum=c=>c.slice(0,3).reduce((sum,v,i)=>sum+(v<=.04045?v/12.92:((v+.055)/1.055)**2.4)*[.2126,.7152,.0722][i],0);
  const results=[];
  for(const el of slide.querySelectorAll('h1,h2,h3,h4,p,th,td,span,strong,b,small,label,button,summary')) {
    const rect=el.getBoundingClientRect(),css=getComputedStyle(el);
    if(!rect.width||!rect.height||css.visibility!=='visible'||!el.textContent.trim()||el.closest('svg,template,details:not([open]),.gamma-orbit-managed'))continue;
    if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
    let foreground=rgba(css.webkitTextFillColor||css.color),background=[0,0,0,0];
    for(let parent=el;parent;parent=parent.parentElement){const style=getComputedStyle(parent),layer=rgba(style.backgroundColor);foreground=over(foreground,layer);background=over(background,layer);foreground[3]*=Number(style.opacity);background[3]*=Number(style.opacity);}
    foreground=over(foreground,[1,1,1,1]);background=over(background,[1,1,1,1]);const a=lum(foreground),b=lum(background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(css.fontSize)>=24||(parseFloat(css.fontSize)>=18.66&&parseInt(css.fontWeight)>=700);
    results.push({text:el.textContent.trim().slice(0,90),element:el.tagName,ratio:+ratio.toFixed(2),required:large?3:4.5});
  }
  return {checked:results.length,minimum:Math.min(...results.map(r=>r.ratio)),failures:results.filter(r=>r.ratio+.02<r.required)};
}
