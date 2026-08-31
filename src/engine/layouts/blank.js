import { escapeHtml } from '../html.js';

export function renderBlank(slide) {
  if (!slide.html) return '';
  return `<iframe class="gamma-sandboxed-html" sandbox="" referrerpolicy="no-referrer" srcdoc="${escapeHtml(slide.html)}" title="Custom slide content" style="width:100%;height:100%;border:0;background:transparent"></iframe>`;
}
