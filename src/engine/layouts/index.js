import { renderTitle } from './title.js';
import { renderClosing } from './closing.js';
import { renderMetrics } from './metrics.js';
import { renderChart } from './chart.js';
import { renderSplit } from './split.js';
import { renderTable } from './table.js';
import { renderTimeline } from './timeline.js';
import { renderBullets } from './bullets.js';
import { renderImage } from './image.js';
import { renderComparison } from './comparison.js';
import { renderQuote } from './quote.js';
import { renderBlank } from './blank.js';
import { renderAgenda } from './agenda.js';
import { renderDashboard } from './dashboard.js';
import { escapeHtml, safeUrl } from '../html.js';

const layouts = {
  title: renderTitle,
  closing: renderClosing,
  metrics: renderMetrics,
  chart: renderChart,
  split: renderSplit,
  table: renderTable,
  timeline: renderTimeline,
  bullets: renderBullets,
  image: renderImage,
  comparison: renderComparison,
  quote: renderQuote,
  blank: renderBlank,
  agenda: renderAgenda,
  dashboard: renderDashboard,
};

export function renderSlide(slide, theme, deck) {
  const renderer = layouts[slide.layout];
  if (!renderer) return `<section><h2>Unknown layout: ${escapeHtml(slide.layout)}</h2></section>`;

  const content = renderer(slide, theme, deck);
  const background = slide.background;
  const bgAttr = background?.type === 'image'
    ? ` data-background-image="${safeUrl(background.value)}"`
    : background?.type === 'gradient'
      ? ` data-background-gradient="${escapeHtml(background.value)}"`
      : background?.value ? ` data-background-color="${escapeHtml(background.value)}"` : '';
  const transAttr = slide.transition ? ` data-transition="${escapeHtml(slide.transition)}"` : '';
  const notes = slide.notes || slide.narration || '';
  const notesHtml = notes ? `<aside class="notes">${escapeHtml(notes).replaceAll('\n', '<br>')}</aside>` : '';
  const layoutClass = `layout-${escapeHtml(slide.layout)}`;
  const variantClass = `variant-${escapeHtml(slide.variant || 'default')}`;
  const toneClass = `tone-${escapeHtml(slide.tone || 'default')}`;

  return `<section class="${layoutClass} ${variantClass} ${toneClass}" data-layout="${escapeHtml(slide.layout)}" data-variant="${escapeHtml(slide.variant || 'default')}"${bgAttr}${transAttr}>\n${content}\n${notesHtml}\n</section>`;
}
