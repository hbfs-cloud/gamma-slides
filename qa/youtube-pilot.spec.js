import { test, expect } from '@playwright/test';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';
import { serveRepositoryPresentation } from '../src/repository/server.js';
let live, studio, directory;
const evidence = resolve('output/youtube-review');
test.beforeAll(async () => {
  mkdirSync(evidence, { recursive:true });
  directory = mkdtempSync(join(tmpdir(), 'gamma-pilot-'));
  writeFileSync(join(directory,'index.html'), renderDeck(loadDeck('presentations/youtube-pilot.yaml')));
  mkdirSync(join(directory,'studio'));
  writeFileSync(join(directory,'studio/index.html'), renderDeck(loadDeck('presentations/studio-demo.yaml')));
  live = await serveRepositoryPresentation(directory,{port:0});
  studio = await serveRepositoryPresentation(join(directory,'studio'),{port:0});
});
test.afterAll(async () => { await Promise.all([live,studio].map(server=>new Promise(done=>server.server.close(done)))); rmSync(directory,{recursive:true,force:true}); });
const ready = async page => page.waitForFunction(()=>window.__GAMMA_READY__);
const frame = async page => (await page.locator('section.present .archify-canvas iframe').elementHandle()).contentFrame();
const outside = async iframe => iframe.evaluate(() => {
  const svg=document.querySelector('.diagram-container>svg'), box=svg.getBoundingClientRect();
  return [...svg.querySelectorAll('[data-node-id]')].filter(node=>{
    const rect=node.getBoundingClientRect();
    return rect.left<box.left-1 || rect.right>box.right+1 || rect.top<box.top-1 || rect.bottom>box.bottom+1;
  }).map(node=>node.dataset.nodeId);
});
test('the 20 fixed video scenes keep primary text large and inside the 1280×720 frame',async({page})=>{
  await page.setViewportSize({width:1280,height:720}); await page.goto(live.url+'?gamma-export=1'); await ready(page);
  const failures=[];
  for(let index=0;index<20;index++){
    await page.evaluate(index=>Reveal.slide(index),index);
    const issue=await page.locator('section.present').evaluate(section=>{
      const primary=[...section.querySelectorAll('.video-story h2,.video-story-message,.video-story-points strong,.video-story-code,.slide-header h2')];
      return {overflow:section.scrollWidth>section.clientWidth+1 || section.scrollHeight>section.clientHeight+1,small:primary.filter(node=>parseFloat(getComputedStyle(node).fontSize)<40).map(node=>node.textContent)};
    });
    if(issue.overflow || issue.small.length)failures.push({slide:index+1,...issue});
  }
  expect(failures).toEqual([]);
});
test('the existing architecture fits its settled overview, mobile overview, and fullscreen',async({page})=>{
  await page.goto(studio.url);await ready(page);await page.evaluate(()=>Reveal.slide(2));
  await page.waitForSelector('section.present .archify-slide[data-ready=true]');
  await expect.poll(async()=>outside(await frame(page))).toEqual([]);
  await page.screenshot({path:join(evidence,'architecture-overview-desktop.png')});
  await page.locator('section.present [data-archify-action=fullscreen]').evaluate(button=>button.click());
  await expect(page.locator('.archify-fullscreen')).toBeVisible();
  const fullscreen=await page.locator('.archify-fullscreen iframe').elementHandle().then(handle=>handle.contentFrame());
  await expect.poll(()=>outside(fullscreen)).toEqual([]);
  await page.screenshot({path:join(evidence,'architecture-overview-fullscreen.png')});
  await page.locator('.archify-fullscreen [data-archify-action=close]').evaluate(button=>button.click());
  await page.setViewportSize({width:390,height:844});
  await page.locator('section.present [data-archify-action=reset]').evaluate(button=>button.click());
  await expect.poll(async()=>outside(await frame(page))).toEqual([]);
  await page.screenshot({path:join(evidence,'architecture-overview-mobile.png')});
});
test('video closeups retain readable labels in live and deterministic SVG output',async({page})=>{
  await page.setViewportSize({width:1280,height:720});await page.goto(live.url);await ready(page);await page.evaluate(()=>Reveal.slide(4));
  await page.waitForSelector('section.present .archify-slide[data-ready=true]');
  const iframe=await frame(page);await expect.poll(()=>outside(iframe)).toEqual([]);
  const labels=await iframe.evaluate(()=>[...document.querySelectorAll('text[data-node-label]')].map(node=>({font:parseFloat(getComputedStyle(node).fontSize),height:node.getBoundingClientRect().height})));
  expect(labels.every(label=>label.font===22 && label.height>=40)).toBe(true);
  const svg=await page.locator('section.present .archify-static').getAttribute('src');
  expect(Buffer.from(svg.split(',')[1],'base64').toString()).toContain("svg { font-family:'JetBrains Mono',ui-monospace,monospace; }");
});
