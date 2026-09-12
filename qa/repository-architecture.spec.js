import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadDeck} from '../src/loader/index.js';
import {renderDeck} from '../src/engine/renderer.js';
const directory=resolve('output/architecture-review');mkdirSync(directory,{recursive:true});
const file=resolve(directory,'playwright.html');writeFileSync(file,renderDeck(loadDeck('presentations/repository-review.yaml')));
async function open(page,index=0,query=''){await page.goto(pathToFileURL(file).href+query+'#/'+index);await page.waitForFunction(()=>window.__GAMMA_READY__);if(index>=5&&index<=9&&!query.includes('gamma-export'))await page.waitForSelector('section.present .archify-slide[data-ready=true]');}
for(const mobile of [false,true])test(`complete technical deck and real Archify playback ${mobile?'mobile':'desktop'}`,async({page})=>{
  test.setTimeout(90_000);if(mobile)await page.setViewportSize({width:390,height:844});const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);await expect(page.locator('.reveal .slides>section')).toHaveCount(21);
  for(let index=0;index<21;index++){
    await page.evaluate(i=>Reveal.slide(i),index);await expect(page.locator('section.present h1,section.present h2').first()).toBeVisible();
    if(index<5||index>9){await expect(page.locator('.archify-canvas iframe')).toHaveCount(0);continue;}
    await page.waitForSelector('section.present .archify-slide[data-ready=true]');const frame=page.frames().find(f=>f.parentFrame());await expect(page.locator('.archify-canvas iframe')).toHaveCount(1);
    expect(await frame.evaluate(()=>typeof Archify.guidedViews.play)).toBe('function');await page.locator('.gamma-orbit-hub').click();await page.locator('[data-orbit=actions]').click();
    await page.locator('[data-orbit-action=reset]').click();await page.locator('[data-orbit-action=play]').click();
    await expect.poll(()=>frame.evaluate(()=>Archify.guidedViews.isPlaying())).toBe(true);
    const beat=await frame.evaluate(()=>Archify.guidedViews.beat()?.nodeId);await expect.poll(()=>frame.evaluate(()=>Archify.guidedViews.beat()?.nodeId),{timeout:12000}).not.toBe(beat);
    await page.locator('[data-orbit-action=play]').click();await expect.poll(()=>frame.evaluate(()=>Archify.guidedViews.isPlaying())).toBe(false);
    const second=await page.locator('[data-orbit-control=archify-node] option').nth(2).getAttribute('value');await page.locator('[data-orbit-control=archify-node]').selectOption(second);await expect.poll(()=>frame.evaluate(()=>Archify.focus.active())).toBe(second);
    await page.locator('[data-orbit-action=reset]').click();await page.evaluate(()=>Reveal.next());await page.evaluate(i=>Reveal.slide(i),index);await page.waitForSelector('section.present .archify-slide[data-ready=true]');
    expect(await page.locator('section.present .archify-static').evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
});
test('theme contrast follows analyst-proof and reduced motion retains manual reading',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page,5,'?theme=analyst-proof');const frame=page.frames().find(f=>f.parentFrame());await expect.poll(()=>frame.evaluate(()=>document.documentElement.dataset.theme)).toBe('light');
 expect(await frame.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--text').trim())).not.toBe('#F3F6F2');
 await page.locator('.gamma-orbit-hub').click();await page.locator('[data-orbit=actions]').click();await page.locator('[data-orbit-action=play]').click();expect(await frame.evaluate(()=>Archify.guidedViews.isPlaying())).toBe(false);expect(await page.evaluate(()=>window.__gammaPresenterMotion.active)).toBe(0);
 await page.locator('[data-orbit-control=archify-node]').selectOption('mcp');await expect(page.locator('section.present [data-archify-status]')).toContainText('MCP server');
 await frame.locator('body').press('Escape');await expect(page.locator('.gamma-orbit-hub')).toBeFocused();
 await page.emulateMedia({media:'print'});await expect(page.locator('.archify-canvas iframe')).toHaveCount(0);await expect(page.locator('section.present .archify-static')).toBeVisible();
});
test('export renders all five static diagrams without executing iframe runtimes',async({page})=>{
 await open(page,5,'?gamma-export=1');await expect(page.locator('.archify-canvas iframe')).toHaveCount(0);const results=await page.locator('.archify-static').evaluateAll(images=>images.map(img=>({loaded:img.complete&&img.naturalWidth>0,source:img.src.startsWith('data:image/svg+xml')})));expect(results).toHaveLength(5);expect(results.every(r=>r.loaded&&r.source)).toBe(true);
});
