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
};

export function renderSlide(slide, theme, deck) {
  const renderer = layouts[slide.layout];
  if (!renderer) return `<section><h2>Unknown layout: ${slide.layout}</h2></section>`;

  const content = renderer(slide, theme, deck);
  const bgAttr = slide.background
    ? ` data-background="${slide.background.type === 'image' ? slide.background.value : ''}" ${slide.background.type !== 'image' ? `style="background: ${slide.background.value};"` : ''}`
    : '';
  const transAttr = slide.transition ? ` data-transition="${slide.transition}"` : '';

  return `<section${bgAttr}${transAttr}>\n${content}\n</section>`;
}
