import { orbitAction } from './orbit-helpers.js';
import {test,expect} from '@playwright/test';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadDeck} from '../src/loader/index.js';
import {renderDeck} from '../src/engine/renderer.js';
const out=resolve('output/cinematic-qa');mkdirSync(out,{recursive:true});
const file=resolve('output/cinematic-revenue.html');writeFileSync(file,renderDeck(loadDeck('presentations/cinematic-revenue.yaml')));
const url=pathToFileURL(file).href;
async function open(page,query=''){await page.goto(url+query);await page.waitForFunction(()=>window.__GAMMA_READY__);const skip=page.locator('[data-studio-action="skip"]');if(await skip.isVisible())await skip.click();await page.evaluate(()=>Reveal.slide(1));await page.waitForFunction(()=>document.querySelector('section.present .cinema-stage'));await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});}
async function split(page){await (await orbitAction(page,page.locator('section.present [data-cinema-action=split]'))).click();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('section.present .cinema-stage').dataset.cinemaMoving!=='true');}
async function bounds(page){const bad=await page.evaluate(()=>{const stage=document.querySelector('section.present .cinema-stage').getBoundingClientRect();return [...document.querySelectorAll('section.present .cinema-heading,section.present .cinema-amount,section.present .cinema-feature,section.present .cinema-segment-labels > div,section.present .cinema-actions')].filter(e=>{const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none')return false;const r=e.getBoundingClientRect();return r.left<stage.left-1||r.right>stage.right+1||r.top<stage.top-1||r.bottom>stage.bottom+1;}).map(e=>e.className);});expect(bad).toEqual([]);}
test('cinematic story, exact data, finite GPU work and restored presentation',async({page})=>{
 const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});await open(page);
 await expect(page.locator('section.present .cinema-stage')).toHaveAttribute('data-cinema-renderer','webgl');await expect(page.locator('#gamma-theme-chooser')).toBeHidden();await expect(page.locator('.gamma-studio-toolbar')).toHaveCount(1);
 await expect(page.locator('section.present .cinema-after')).toContainText('$16.2M');await expect(page.locator('section.present .cinema-takeaway')).toContainText('Platforms');await bounds(page);
 await page.screenshot({path:out+'/desktop-total.png'});await split(page);await expect(page.locator('section.present .cinema-feature')).toContainText('+$2.6M');await expect(page.locator('section.present .cinema-feature')).toContainText('32.9');await expect(page.locator('section.present .cinema-segment-labels > div')).toHaveCount(5);await bounds(page);await page.screenshot({path:out+'/desktop-split.png'});
 const count=await page.locator('section.present .cinema-stage').getAttribute('data-cinema-frames');await page.waitForTimeout(300);expect(await page.locator('section.present .cinema-stage').getAttribute('data-cinema-frames')).toBe(count);
 const gpu=await page.locator('section.present .cinema-canvas canvas').evaluate(c=>({pixels:c.width*c.height,coverage:c.width/c.getBoundingClientRect().width,error:c.getContext('webgl2').getError()}));expect(gpu.pixels).toBeLessThanOrEqual(2005000);expect(gpu.error).toBe(0);expect(gpu.coverage).toBeGreaterThanOrEqual(.95);
 await (await orbitAction(page,page.locator('section.present [data-cinema-action=values]'))).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('row').filter({hasText:'Platforms'})).toContainText('$1.4M');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();
 await split(page);await expect(page.locator('section.present .cinema-heading')).toContainText('Revenue changes');expect(errors).toEqual([]);expect(network).toEqual([]);
});
test('cinematic phone composition and reduced motion',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await open(page);await bounds(page);await page.screenshot({path:out+'/mobile-total.png'});await split(page);await expect(page.locator('section.present .cinema-stage')).toHaveAttribute('data-cinema-mode','split');await expect(page.locator('section.present .cinema-feature')).toBeVisible();await bounds(page);await page.screenshot({path:out+'/mobile-split.png'});
 for(const source of await page.locator('section.present .cinema-actions button').all()){const b=await orbitAction(page,source);expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);}
 await (await orbitAction(page,page.locator('section.present [data-cinema-action=values]'))).click();await expect(page.getByRole('dialog')).toBeVisible();
});
test('cinematic GPU loss falls back cleanly and restoration works',async({page})=>{
 await open(page);await split(page);await page.evaluate(()=>{window.testLoss=document.querySelector('section.present .cinema-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context');window.testLoss.loseContext();});
 await expect(page.locator('section.present .cinema-stage')).toHaveAttribute('data-cinema-renderer','svg');await expect(page.locator('section.present .cinema-fallback svg')).toBeVisible();await expect(page.locator('section.present .cinema-canvas')).toBeHidden();await expect(page.locator('section.present .cinema-segment-labels')).toBeHidden();
 await page.evaluate(()=>window.testLoss.restoreContext());await expect(page.locator('section.present .cinema-stage')).toHaveAttribute('data-cinema-renderer','webgl');
});
test('cinematic no GPU and export retain readable chart and provenance',async({page})=>{
 await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});await open(page);await expect(page.locator('section.present .cinema-fallback svg')).toBeVisible();await expect(page.locator('section.present [data-cinema-action=split]')).toBeDisabled();await expect(page.locator('section.present .slide-source')).toContainText('Illustrative data');
 await open(page,'?gamma-export=1');await expect(page.locator('section.present .cinema-fallback svg')).toBeVisible();await expect(page.locator('section.present .cinema-canvas canvas')).toHaveCount(0);await page.screenshot({path:out+'/export.png'});
});
test('cinematic themes, interrupted navigation, and print lifecycle',async({page})=>{
 const d=loadDeck('presentations/cinematic-revenue.yaml');d.slides.push({layout:'chart',variant:'cinematic',title:'Evidence',chart:structuredClone(d.slides[1].chart)});
 const navFile=resolve('output/cinematic-qa/navigation.html');writeFileSync(navFile,renderDeck(d));await page.goto(pathToFileURL(navFile).href+'?theme=signal-room');await page.waitForFunction(()=>window.__GAMMA_READY__);const skip=page.locator('[data-studio-action="skip"]');if(await skip.isVisible())await skip.click();await page.evaluate(()=>Reveal.slide(1));await page.waitForFunction(()=>document.querySelector('section.present .cinema-stage'));
 const canvas=page.locator('section.present .cinema-canvas canvas');const initial=await canvas.screenshot();
 for(const theme of ['analyst-proof','cutting-room','signal-room']){
   await page.evaluate(theme=>applyPresentationTheme(theme,{animate:false}),theme);await expect(page.locator('body')).toHaveAttribute('data-presentation-theme',theme);
   await page.waitForFunction(()=>!document.querySelector('.cinema-stage[data-cinema-moving="true"]'));
   await page.screenshot({path:out+'/theme-'+theme+'.png'});
   if(theme==='analyst-proof')expect((await canvas.screenshot()).equals(initial)).toBe(false);
 }
 await (await orbitAction(page,page.locator('section.present [data-cinema-action=split]'))).click();await page.keyboard.press('Escape');await page.evaluate(()=>Reveal.slide(2));await page.evaluate(()=>Reveal.slide(1));await expect(page.locator('section.present .cinema-stage')).toHaveAttribute('data-cinema-moving','false');await expect(page.locator('section.present .cinema-stage')).toHaveAttribute('data-cinema-mode','split');
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await expect(page.locator('section.present .cinema-fallback svg')).toBeVisible();await expect(canvas).toBeHidden();
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await expect(canvas).toBeVisible();
});
