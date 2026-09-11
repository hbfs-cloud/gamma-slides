import { escapeHtml } from '../engine/html.js';

const text = value => String(value ?? '').trim();
const paragraph = value => text(value) ? `<p>${escapeHtml(value)}</p>` : '';
const values = value => Array.isArray(value) ? value : [];

function list(items) {
  const entries = values(items).map(item => text(typeof item === 'object' ? item.text : item)).filter(Boolean);
  return entries.length ? `<ul>${entries.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '';
}

function comparison(columns) {
  const entries = values(columns).filter(column => text(column?.heading));
  return entries.length ? `<section class="comparison">${entries.map(column => `<div><h3>${escapeHtml(column.heading)}</h3>${list(column.items)}</div>`).join('')}</section>` : '';
}

function table(value) {
  const headers = values(value?.headers).map(text).filter(Boolean);
  const rows = values(value?.rows).map(row => values(row).map(text));
  if (!headers.length || !rows.length) return '';
  return `<div class="table-wrap"><table><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_header, index) => `<td>${escapeHtml(row[index] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function media(slide) {
  const asset = slide.media || slide.image || slide.visual;
  const source = text(asset?.src);
  if (!source) return '';
  const kind = text(slide.media?.kind) || (slide.visual ? 'animation or illustration' : 'image');
  const label = text(asset.alt) || source.split('/').pop() || 'Media';
  return `<p class="asset"><b>${escapeHtml(kind)}</b> · ${escapeHtml(label)} <span>${escapeHtml(source)}</span></p>`;
}

function slideBody(slide) {
  const quote = text(slide.quote);
  const citation = text(slide.author);
  return [
    text(slide.subtitle) ? `<p class="subtitle">${escapeHtml(slide.subtitle)}</p>` : '',
    quote ? `<blockquote>${escapeHtml(quote)}${citation ? `<footer>— ${escapeHtml(citation)}</footer>` : ''}</blockquote>` : '',
    list(slide.items),
    comparison(slide.columns),
    table(slide.table),
    media(slide),
  ].join('');
}

/**
 * A local, print-ready companion for an operator or attendee. It deliberately
 * carries semantic source content and notes rather than attempting a screenshot
 * of an interactive chart, 3D scene, or animation.
 */
export function renderHandoutHtml(deck = {}) {
  const title = text(deck.meta?.title) || 'Presentation handout';
  const slides = values(deck.slides);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} — handout</title><style>
    @page { size: A4; margin: 15mm; }
    :root { --paper: #F3F0E8; --surface: #FBF9F3; --ink: #111318; --muted: #62646B; --hairline: #CFC9BD; --accent: #1748D5; color-scheme: light; font-family: Archivo, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--surface); }
    * { box-sizing: border-box; } body { max-width: 210mm; margin: 0 auto; line-height: 1.5; } header { border-bottom: 2px solid var(--accent); margin-bottom: 12mm; padding-bottom: 5mm; } h1 { margin: 0; font-size: 28pt; letter-spacing: -.035em; } header p { margin: 2mm 0 0; color: var(--muted); } article { break-inside: avoid; border-bottom: 1px solid var(--hairline); padding: 0 0 8mm; margin: 0 0 8mm; } .number { color: var(--accent); font-size: 10pt; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; } h2 { margin: 1mm 0 2mm; font-size: 19pt; line-height: 1.12; } h3 { margin: 0; font-size: 12pt; } p { margin: 2mm 0; } .subtitle { color: var(--muted); font-size: 12pt; } ul { margin: 3mm 0; padding-left: 5mm; } li + li { margin-top: 1mm; } blockquote { border-left: 3px solid var(--accent); color: var(--ink); font-size: 14pt; margin: 4mm 0; padding: 1mm 0 1mm 4mm; } blockquote footer { color: var(--muted); font-size: 10pt; margin-top: 2mm; } .comparison { display: grid; gap: 3mm; grid-template-columns: repeat(auto-fit, minmax(55mm, 1fr)); margin: 3mm 0; } .comparison > div { background: var(--paper); border-radius: 4px; padding: 3mm; } .table-wrap { overflow: hidden; margin: 3mm 0; } table { border-collapse: collapse; font-size: 9.5pt; width: 100%; } th, td { border: 1px solid var(--hairline); padding: 2mm; text-align: left; vertical-align: top; } th { background: var(--paper); } .asset { background: var(--paper); border-radius: 4px; color: var(--ink); font-size: 9.5pt; padding: 2mm 3mm; } .asset span { color: var(--muted); display: block; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 8.5pt; overflow-wrap: anywhere; } .notes { background: var(--surface); border: 1px solid var(--hairline); border-radius: 4px; margin-top: 4mm; padding: 3mm 4mm; } .notes h3 { color: var(--accent); font-size: 9pt; letter-spacing: .07em; text-transform: uppercase; } .notes p { white-space: pre-wrap; } @media print { article { break-inside: avoid-page; } }
  </style></head><body><header><h1>${escapeHtml(title)}</h1><p>Speaker handout · ${slides.length} ${slides.length === 1 ? 'slide' : 'slides'} · Generated locally by Gamma Presenter</p></header>${slides.map((slide, index) => `<article><div class="number">Slide ${index + 1}</div><h2>${escapeHtml(text(slide?.title) || `Slide ${index + 1}`)}</h2>${slideBody(slide || {})}${text(slide?.notes || slide?.narration) ? `<section class="notes"><h3>Speaker notes</h3>${paragraph(slide.notes || slide.narration)}</section>` : ''}</article>`).join('')}</body></html>`;
}
