import { presentationContrast } from './contrast.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { serveRepositoryPresentation } from './server.js';
import { launchBrowser } from '../browser.js';

/** Browser evidence for the exact built artifact; not an aesthetic or security certification. */
export async function verifyRepositoryPresentation(file, directory) {
  mkdirSync(directory,{recursive:true});
  const live=await serveRepositoryPresentation(dirname(resolve(file)),{port:0});
  const browser=await launchBrowser({headless:true});
  const report={checkedAt:new Date().toISOString(),passed:false,errors:[],viewports:[]};
  try {
    for(const viewport of [{name:'desktop',width:1440,height:900,deviceScaleFactor:1},{name:'mobile',width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}]) {
    for(const theme of ['signal-room','analyst-proof','cutting-room']) {
      const page=await browser.newPage();await page.setViewport(viewport);
      page.on('pageerror',error=>report.errors.push(`${viewport.name}: ${error.message}`));
      await page.goto(live.url+'?theme='+theme,{waitUntil:'load'});
      await page.waitForFunction(()=>window.__GAMMA_READY__===true);
      const count=await page.evaluate(()=>Reveal.getTotalSlides());
      const result={...viewport,theme,slides:[]};
      for(let index=0;index<count;index++) {
        await page.evaluate(index=>{Reveal.slide(index);Reveal.getCurrentSlide().scrollTop=0;},index);
        await page.waitForFunction(index=>Reveal.getIndices().h===index&&getComputedStyle(Reveal.getCurrentSlide()).opacity==='1',{},index);
        await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>setTimeout(r,850));document.getAnimations().forEach(a=>{try{a.finish();}catch{}});});
        const diagram=await page.$('section.present .archify-slide');
        if(diagram) await page.waitForFunction(()=>document.querySelector('section.present .archify-slide')?.dataset.ready==='true');
        const state=await page.evaluate(()=>{
          const slide=Reveal.getCurrentSlide(),box=slide.getBoundingClientRect(),root=slide.querySelector('.archify-slide');
          const visible=[...slide.querySelectorAll('h1,h2,h3,p,td,.brief-value,.strategy-item')].filter(el=>{const b=el.getBoundingClientRect();return b.width&&b.height&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('details:not([open])');});
          return {title:slide.querySelector('h1,h2')?.textContent||'',brokenImages:[...slide.querySelectorAll('img')].filter(img=>!img.closest('template')&&(!img.complete||!img.naturalWidth)).map(img=>img.alt||'image'),horizontalOverflow:slide.scrollWidth>slide.clientWidth+2,verticalOverflow:slide.scrollHeight>slide.clientHeight+2,diagram:root?{type:root.dataset.archifyType,ready:root.dataset.ready,staticLoaded:root.querySelector('img').complete&&root.querySelector('img').naturalWidth>0,sandbox:root.querySelector('iframe').getAttribute('sandbox')}:null,frames:document.querySelectorAll('.archify-canvas iframe').length,height:box.height};
        });
        if(state.brokenImages.length)report.errors.push(`${viewport.name} slide ${index+1}: broken image ${state.brokenImages.join(', ')}`);
        if(state.horizontalOverflow)report.errors.push(`${viewport.name} slide ${index+1}: horizontal overflow`);
        if(viewport.name==='desktop'&&state.verticalOverflow)report.errors.push(`desktop slide ${index+1}: vertical overflow`);
        state.contrast=await page.evaluate(presentationContrast);
        if(state.contrast.failures.length)report.errors.push(`${viewport.name} ${theme} slide ${index+1}: contrast ${JSON.stringify(state.contrast.failures)}`);
        if(state.diagram&&!state.diagram.staticLoaded)report.errors.push(`${viewport.name} slide ${index+1}: missing static diagram`);
        if(state.frames>(state.diagram?1:0))report.errors.push(`${viewport.name} slide ${index+1}: inactive diagram iframe`);
        const captures=[];
        for(let part=0;part<12;part++) {
          const filename=`${viewport.name}-${theme}-${String(index+1).padStart(2,'0')}${part?'-part'+(part+1):''}.png`;
          await page.screenshot({path:resolve(directory,filename)});captures.push(filename);
          if(viewport.name!=='mobile')break;
          const moved=await page.evaluate(()=>{const s=Reveal.getCurrentSlide(),before=s.scrollTop;s.scrollTop=Math.min(s.scrollHeight-s.clientHeight,before+s.clientHeight*.8);return s.scrollTop>before+1;});
          if(!moved)break;
        }
        if(diagram&&theme==='signal-room') {
          const frame=page.frames().find(frame=>frame.parentFrame());
          try {
            await page.click('.gamma-orbit-hub');
            await page.waitForFunction(()=>document.querySelector('.gamma-orbit').dataset.open==='true');
            await page.evaluate(()=>Promise.all(document.querySelector('.gamma-orbit').getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
            await page.click('[data-orbit=actions]');
            await page.waitForSelector('.gamma-orbit-panel:not([hidden]) [data-orbit-control=archify-node]',{visible:true});
            await page.evaluate(()=>Promise.all(document.querySelector('.gamma-orbit').getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
            await page.select('[data-orbit-control=archify-node]',await frame.evaluate(()=>document.querySelector('[data-node-id]').dataset.nodeId));
            await page.waitForFunction(()=>document.querySelector('section.present [data-archify-status]').textContent.length>0);
            await page.click('[data-orbit-action="reset"]');
            await page.click('[data-orbit-action="play"]');
            await frame.waitForFunction(()=>Archify.guidedViews.isPlaying());
            const first=await frame.evaluate(()=>Archify.guidedViews.beat()?.nodeId);
            await frame.waitForFunction(id=>Archify.guidedViews.beat()?.nodeId&&Archify.guidedViews.beat().nodeId!==id,{timeout:12000},first);
            await page.click('[data-orbit-action="play"]');
            await frame.waitForFunction(()=>!Archify.guidedViews.isPlaying());
            const paused=await frame.evaluate(()=>Archify.guidedViews.beat()?.nodeId);
            await new Promise(r=>setTimeout(r,400));
            if(await frame.evaluate(()=>Archify.guidedViews.beat()?.nodeId)!==paused)throw new Error('Pause did not stabilize the beat');
            state.diagram.playback=true;
            const view=await frame.evaluate(()=>document.querySelector('[data-view-id]')?.dataset.viewId);
            const choice=await page.$eval('section.present [data-archify-view]',select=>[...select.options].find(option=>option.value)?.value);
            if(choice){await page.select('[data-orbit-control=archify-view]',choice);await frame.waitForFunction(id=>Archify.guidedViews.active()===id,{},choice);}
            state.diagram.selection=true;
          }catch(error){report.errors.push(`${viewport.name} slide ${index+1}: diagram interaction ${error.message}`);}
        }
        result.slides.push({index:index+1,...state,captures});
      }
      report.viewports.push(result);await page.close();
    }}
    report.passed=report.errors.length===0;
  } catch(error){report.errors.push(error.message);} finally {await browser.close();await new Promise(r=>live.server.close(r));}
  writeFileSync(resolve(directory,'report.json'),JSON.stringify(report,null,2));
  return report;
}
