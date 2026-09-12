import {test,expect} from '@playwright/test';
import {presentationContrast} from '../src/repository/contrast.js';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadDeck} from '../src/loader/index.js';
import {renderDeck} from '../src/engine/renderer.js';
import {serveRepositoryPresentation} from '../src/repository/server.js';
let base,live,dir;
test.beforeAll(async()=>{dir=mkdtempSync(join(tmpdir(),'gamma-orbit-qa-'));writeFileSync(join(dir,'index.html'),renderDeck(loadDeck('presentations/repository-review.yaml')));live=await serveRepositoryPresentation(dir,{port:0,terminal:true});base=live.url;});
test.afterAll(async()=>{if(live)await new Promise(r=>live.server.close(r));if(dir)rmSync(dir,{recursive:true,force:true});});
const open=async(page,index=5,theme='signal-room')=>{await page.goto(base+'?theme='+theme+'#/'+index);await page.waitForFunction(()=>window.__GAMMA_READY__);if(index>=5&&index<=9)await page.waitForSelector('.archify-slide[data-ready=true]');};
async function orbit(page,action){await page.locator('.gamma-orbit-hub').click();await page.locator('[data-orbit='+action+']').click();}
for(const mobile of [false,true]){
 test(`M interactions and fullscreen ${mobile?'mobile':'desktop'}`,async({page})=>{
  if(mobile)await page.setViewportSize({width:390,height:844});const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);await orbit(page,'actions');const panel=page.locator('.gamma-orbit-panel');await expect(panel).toBeVisible();
  await panel.getByLabel('Component or step').selectOption('mcp');const frame=page.frames().find(f=>f.parentFrame());await expect.poll(()=>frame.evaluate(()=>Archify.focus.active())).toBe('mcp');
  await panel.getByRole('button',{name:'Play story',exact:true}).click();await expect.poll(()=>frame.evaluate(()=>Archify.guidedViews.isPlaying())).toBe(true);
  await page.locator('.gamma-orbit-hub').click();await page.locator('[data-orbit=full]').click();await expect(page.locator('.archify-fullscreen')).toBeVisible();await expect(page.locator('.archify-fullscreen .gamma-orbit')).toHaveCount(1);await expect(page.locator('.archify-fullscreen .archify-slide')).toHaveAttribute('data-ready','true');
  await page.locator('.gamma-orbit-hub').click();await expect(page.locator('.archify-fullscreen h2')).toBeVisible();await expect(page.locator('.archify-fullscreen [data-archify-status]')).toBeVisible();await page.locator('.gamma-orbit-hub').press('Escape');
  const fullframe=page.frames().find(f=>f.parentFrame());await expect.poll(()=>fullframe.evaluate(()=>Archify.guidedViews.isPlaying())).toBe(true);
  await orbit(page,'actions');await page.locator('.gamma-orbit-panel').getByRole('button',{name:'Pause',exact:true}).click();await expect.poll(()=>fullframe.evaluate(()=>Archify.guidedViews.isPlaying())).toBe(false);
  await page.locator('.gamma-orbit-hub').press('Escape');await page.locator('.gamma-orbit-hub').press('Escape');await expect(page.locator('.archify-fullscreen')).not.toBeVisible();await expect(page.locator('section.present .archify-slide')).toHaveAttribute('data-ready','true');await expect(page.locator('.gamma-orbit-hub')).toBeFocused();
  if(mobile){await page.evaluate(()=>Reveal.slide(15));await expect(page.locator('[data-experience-scroll]')).toBeVisible();const hubBox=await page.locator('.gamma-orbit-hub').boundingBox(),railBox=await page.locator('[data-experience-scroll]').boundingBox();expect(hubBox.y+hubBox.height+8).toBeLessThanOrEqual(railBox.y);}
  await page.evaluate(()=>Reveal.slide(10));await expect(page.locator('.archify-canvas iframe')).toHaveCount(0);expect(errors).toEqual([]);
 });
 test(`all slides three themes contrast ${mobile?'mobile':'desktop'}`,async({page})=>{
  test.setTimeout(120000);if(mobile)await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await open(page,0);
  const failures=[];for(const theme of ['signal-room','analyst-proof','cutting-room','analyst-proof']){await page.evaluate(t=>applyPresentationTheme(t,{animate:false}),theme);for(let i=0;i<21;i++){await page.evaluate(i=>Reveal.slide(i),i);await page.evaluate(()=>document.getAnimations().forEach(a=>{if(a.effect.getComputedTiming().iterations!==Infinity)a.finish();}));await page.waitForTimeout(30);const result=await page.evaluate(presentationContrast);if(result.failures.length)failures.push({theme,slide:i+1,...result});}}
  expect(failures).toEqual([]);
 });
}
test('local terminal runs a command, moves, restores and reopens',async({page})=>{
 await open(page,15);await orbit(page,'terminal');const terminal=page.getByTestId('studio-terminal');await expect(terminal).toBeVisible();const before=await terminal.boundingBox();await terminal.getByTestId('studio-terminal-drag').dragTo(page.locator('.reveal'));const moved=await terminal.boundingBox();expect(moved.x).not.toBe(before.x);await expect(terminal).not.toHaveClass(/is-docked/);await terminal.locator('[data-command=pwd]').click();await expect(terminal.locator('.gamma-terminal-output')).toContainText('/gamma-slides');await terminal.getByRole('button',{name:'Minimize console'}).click();await expect(terminal).not.toBeVisible();await page.getByTestId('studio-terminal-restore').click();await expect(terminal).toBeVisible();await terminal.getByRole('button',{name:'Close console'}).click();await page.locator('body').press('t');await expect(terminal).toBeVisible();
});
test('touch and keyboard menu, fallback fullscreen and modal isolation',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();await open(page);await page.evaluate(()=>Element.prototype.requestFullscreen=undefined);await page.locator('.gamma-orbit-hub').tap();await expect(page.locator('[data-orbit=full]')).toBeVisible();await page.locator('[data-orbit=full]').tap();await expect(page.locator('.archify-fullscreen')).toBeVisible();await page.locator('.gamma-orbit-hub').press('Escape');await expect(page.locator('.archify-fullscreen')).not.toBeVisible();await orbit(page,'studio');await expect(page.locator('.gamma-live-panel')).toBeVisible();await expect(page.getByTestId('studio-wizard')).not.toBeVisible();await context.close();
});

test('radial menu stays circular, centered and inside the viewport',async({page})=>{
 await open(page,15);
 for(const size of [{width:1920,height:1176},{width:834,height:1194},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await page.setViewportSize(size);await page.mouse.move(0,0);await page.locator('body').press('m');await page.waitForTimeout(280);
  const geometry=await page.locator('.gamma-orbit').evaluate(root=>{const box=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,cx:r.x+r.width/2,cy:r.y+r.height/2};};return {hub:box(root.querySelector('.gamma-orbit-hub')),circle:box(root.querySelector('.gamma-orbit-canopy')),buttons:[...root.querySelectorAll('.gamma-orbit-branch')].map(box),labels:[...root.querySelectorAll('.gamma-orbit-branch span')].map(box)};});
  const {hub,circle,buttons,labels}=geometry;expect(Math.abs(circle.w-circle.h)).toBeLessThan(1);expect(Math.abs(hub.cx-circle.cx)).toBeLessThan(1);expect(Math.abs(hub.cy-circle.cy)).toBeLessThan(1);
  const radii=buttons.map(b=>Math.hypot(b.cx-hub.cx,b.cy-hub.cy));expect(Math.max(...radii)-Math.min(...radii)).toBeLessThan(1);
  for(const b of [circle,...buttons,...labels]){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.w).toBeLessThanOrEqual(size.width);expect(b.y+b.h).toBeLessThanOrEqual(size.height);}
  await page.locator('.gamma-orbit-hub').press('Escape');
 }
});
for(const mobile of [false,true])test(`ArrowUp opens slide carousel and selection returns ${mobile?'mobile':'desktop'}`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});await open(page,15);await page.locator('body').press('ArrowUp');await expect.poll(()=>page.evaluate(()=>Reveal.isOverview())).toBe(true);await page.waitForTimeout(350);
 const boxes=await page.locator('.reveal .slides>section').evaluateAll(nodes=>nodes.slice(14,17).map(n=>{const r=n.getBoundingClientRect();return {x:r.x,w:r.width};}));expect(boxes[1].x-boxes[0].x).toBeGreaterThan(boxes[0].w);expect(boxes[2].x-boxes[1].x).toBeGreaterThan(boxes[1].w);
 await page.keyboard.press('ArrowRight');expect(await page.evaluate(()=>Reveal.getIndices().h)).toBe(16);await page.keyboard.press('Enter');await expect.poll(()=>page.evaluate(()=>Reveal.isOverview())).toBe(false);await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowDown');await expect.poll(()=>page.evaluate(()=>Reveal.isOverview())).toBe(false);
 await orbit(page,'terminal');const input=page.getByTestId('studio-terminal').locator('input');await input.fill('draft');await input.press('ArrowUp');expect(await page.evaluate(()=>Reveal.isOverview())).toBe(false);
});

test('hover menu remains open under a stationary pointer',async({page})=>{
 await open(page,15);await page.locator('.gamma-orbit-hub').hover();await page.waitForTimeout(1600);await expect(page.locator('.gamma-orbit')).toHaveAttribute('data-open','true');await expect(page.locator('[data-orbit=studio]')).toBeVisible();await page.mouse.move(0,0);await expect(page.locator('.gamma-orbit')).toHaveAttribute('data-open','false');
});
