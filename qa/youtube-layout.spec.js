import { test, expect } from '@playwright/test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';
import { serveRepositoryPresentation } from '../src/repository/server.js';

let directory, live;

test.beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'gamma-youtube-layout-'));
  writeFileSync(join(directory, 'index.html'), renderDeck(loadDeck('presentations/gamma-presenter-capabilities.yaml')));
  live = await serveRepositoryPresentation(directory, { port: 0 });
});

test.afterAll(async () => {
  await new Promise(resolve => live.server.close(resolve));
  rmSync(directory, { recursive: true, force: true });
});

const scenarios = [
  ['desktop-tall', { width: 2016, height: 1230 }],
  ['desktop', { width: 1440, height: 900 }],
  ['desktop-short', { width: 1280, height: 720 }],
  ['mobile', { width: 390, height: 844 }],
];

for (const [mode, query] of [['normal', 'gamma-qa=1'], ['clean', 'gamma-clean=qa']]) {
  for (const [name, viewport] of scenarios) {
    test(`YouTube uses the available scene row at ${name} in ${mode} output`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto(`${live.url}?${query}`);
      await page.waitForFunction(() => window.__GAMMA_READY__);
      await page.evaluate(() => Reveal.slide(3));
      // Reveal applies a 3D transform while changing scenes. Measure the
      // settled scene, not its transition projection.
      await page.waitForTimeout(500);

      const geometry = await page.locator('section.present').evaluate(section => {
        const rect = node => node.getBoundingClientRect().toJSON();
        const player = section.querySelector('.studio-youtube-media');
        const caption = section.querySelector('.studio-content-slide > p:last-child');
        const action = section.querySelector('.studio-slide-actions');
        const reveal = document.querySelector('.reveal');
        const nav = document.querySelector('.experience-nav');
        return {
          player: rect(player),
          caption: rect(caption),
          action: rect(action),
          reveal: rect(reveal),
          nav: nav ? rect(nav) : null,
          clean: document.documentElement.classList.contains('gamma-clean-stage'),
          actionDisplay: action ? getComputedStyle(action).display : '',
          sectionScrollHeight: section.scrollHeight,
          sectionClientHeight: section.clientHeight,
        };
      });

      expect(geometry.player.width / geometry.player.height).toBeCloseTo(16 / 9, 2);
      expect(geometry.player.left).toBeGreaterThanOrEqual(geometry.reveal.left - 1);
      expect(geometry.player.right).toBeLessThanOrEqual(geometry.reveal.right + 1);
      expect(geometry.player.top).toBeGreaterThanOrEqual(geometry.reveal.top - 1);
      expect(geometry.player.bottom).toBeLessThanOrEqual(geometry.reveal.bottom + 1);
      expect(geometry.caption.top).toBeGreaterThanOrEqual(geometry.reveal.top - 1);
      expect(geometry.caption.bottom).toBeLessThanOrEqual(geometry.reveal.bottom + 1);
      expect(geometry.sectionScrollHeight).toBeLessThanOrEqual(geometry.sectionClientHeight + 1);

      if (geometry.clean) {
        expect(geometry.actionDisplay).toBe('none');
        await expect(page.locator('.experience-nav')).toBeHidden();
      } else {
        expect(geometry.action.top).toBeGreaterThanOrEqual(geometry.reveal.top - 1);
        expect(geometry.action.bottom).toBeLessThanOrEqual(geometry.reveal.bottom + 1);
        expect(geometry.nav).not.toBeNull();
        expect(geometry.nav.top).toBeGreaterThanOrEqual(geometry.reveal.bottom - 1);
        await expect(page.getByRole('link', { name: 'Open on YouTube' })).toBeVisible();
        await expect(page.locator('.experience-nav')).toBeVisible();
      }

      const screenshot = testInfo.outputPath(`youtube-${name}-${mode}.png`);
      await page.screenshot({ path: screenshot });
      await testInfo.attach(`youtube-${name}-${mode}`, { path: screenshot, contentType: 'image/png' });
    });
  }
}
