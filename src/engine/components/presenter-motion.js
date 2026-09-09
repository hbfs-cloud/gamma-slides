// Finite, composition-aware reveals. Content remains visible without JavaScript.
function initPresenterMotion() {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), print=matchMedia('print');
  const exported=new URLSearchParams(location.search).has('gamma-export')||new URLSearchParams(location.search).has('print-pdf');
  let animations=[];
  const stop=()=>{animations.forEach(animation=>animation.cancel());animations=[];};
  const animate=()=>{
    stop();if(reduced.matches||print.matches||exported||document.hidden)return;
    const slide=Reveal.getCurrentSlide();if(!slide)return;
    const header=slide.querySelector('.slide-header,.experience-cover-copy');
    if(header)animations.push(header.animate([{opacity:.35,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:520,easing:'cubic-bezier(.2,.7,.2,1)'}));
    // Read ledgers and decisions in order; reveal quantitative fields as one surface.
    const rows=[...slide.querySelectorAll('.strategy-item,.experience-chapter-map a,.bullet-item,tbody tr,.timeline-item,.metric-card,.dashboard-panel')].slice(0,8);
    rows.forEach((row,index)=>animations.push(row.animate([{opacity:.25,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:480,delay:90+index*65,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'})));
    const surface=slide.querySelector('.archify-canvas,.story-chart-plot');
    if(surface)animations.push(surface.animate([{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],{duration:650,delay:100,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));
  };
  Reveal.on('slidechanged',animate);reduced.addEventListener('change',stop);print.addEventListener('change',stop);document.addEventListener('visibilitychange',stop);window.addEventListener('pagehide',stop);animate();
  window.__gammaPresenterMotion={stop,get active(){return animations.filter(animation=>animation.playState==='running').length;}};
}
export function presenterMotionJS(){return `(${initPresenterMotion.toString()})();`;}
