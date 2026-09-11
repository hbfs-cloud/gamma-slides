import PptxGenJS from 'pptxgenjs';
import { access } from 'fs/promises';
import { isAbsolute, resolve } from 'path';

const palette = Object.freeze({ canvas: '050912', pane: '111B2B', ink: 'F5F7FC', muted: 'AAB7CA', line: '2A3850', accent: '315DFF', highlight: '87A2FF' });
const text = value => String(value ?? '').trim();
const array = value => Array.isArray(value) ? value : [];
const textOptions = { margin: 0, breakLine: false, valign: 'mid', fit: 'shrink' };

function addFrame(slide, number) {
  slide.background = { color: palette.canvas };
  slide.addShape('rect', { x: 0, y: 0, w: 13.333, h: 0.10, fill: { color: palette.accent }, line: { color: palette.accent } });
  slide.addText(`GAMMA PRESENTER  ·  ${String(number).padStart(2, '0')}`, { x: 0.55, y: 7.05, w: 4, h: 0.18, fontFace: 'Aptos', fontSize: 7, charSpacing: 1.2, color: palette.muted, ...textOptions });
}

function addTitle(slide, slideData) {
  slide.addText(text(slideData.title) || 'Untitled slide', { x: 0.7, y: 0.6, w: 11.9, h: 0.62, fontFace: 'Aptos Display', fontSize: 30, bold: true, color: palette.ink, ...textOptions });
  if (text(slideData.subtitle)) slide.addText(text(slideData.subtitle), { x: 0.73, y: 1.34, w: 11.5, h: 0.42, fontFace: 'Aptos', fontSize: 14, color: palette.muted, ...textOptions });
}

function addBullets(slide, items) {
  const runs = array(items).map(item => ({ text: text(typeof item === 'object' ? item.text : item), options: { bullet: { indent: 18 }, hanging: 4, breakLine: true } })).filter(item => item.text);
  if (runs.length) slide.addText(runs, { x: 0.85, y: 2.05, w: 11.4, h: 3.9, fontFace: 'Aptos', fontSize: 19, color: palette.ink, breakLine: false, paraSpaceAfterPt: 13, valign: 'top', fit: 'shrink', margin: 0.04 });
}

function addQuote(slide, slideData) {
  if (!text(slideData.quote)) return;
  slide.addShape('line', { x: 1.0, y: 2.05, w: 0, h: 2.7, line: { color: palette.accent, width: 2 } });
  slide.addText(`“${text(slideData.quote)}”`, { x: 1.38, y: 2.1, w: 10.4, h: 1.9, fontFace: 'Aptos Display', fontSize: 28, italic: true, color: palette.ink, breakLine: false, valign: 'mid', fit: 'shrink', margin: 0 });
  if (text(slideData.author)) slide.addText(`— ${text(slideData.author)}`, { x: 1.4, y: 4.22, w: 8.8, h: 0.35, fontFace: 'Aptos', fontSize: 14, color: palette.highlight, ...textOptions });
}

function addComparison(slide, columns) {
  const entries = array(columns).filter(column => text(column?.heading));
  if (!entries.length) return;
  const gap = 0.24, width = Math.min(5.7, (11.6 - gap * Math.max(0, entries.length - 1)) / entries.length);
  entries.forEach((column, index) => {
    const x = 0.85 + index * (width + gap);
    slide.addShape('rect', { x, y: 2.05, w: width, h: 3.8, rectRadius: 0.08, fill: { color: palette.pane }, line: { color: palette.line, width: 1 } });
    slide.addText(text(column.heading), { x: x + 0.22, y: 2.28, w: width - 0.44, h: 0.38, fontFace: 'Aptos Display', fontSize: 18, bold: true, color: palette.highlight, ...textOptions });
    const runs = array(column.items).map(item => ({ text: text(item), options: { bullet: { indent: 14 }, hanging: 3, breakLine: true } })).filter(item => item.text);
    if (runs.length) slide.addText(runs, { x: x + 0.22, y: 2.82, w: width - 0.42, h: 2.65, fontFace: 'Aptos', fontSize: 13, color: palette.ink, breakLine: false, paraSpaceAfterPt: 9, valign: 'top', fit: 'shrink', margin: 0.02 });
  });
}

function addTable(slide, data) {
  const headers = array(data?.headers).map(text).filter(Boolean);
  const rows = array(data?.rows).map(row => array(row).map(text));
  if (!headers.length || !rows.length) return;
  slide.addTable([headers, ...rows], { x: 0.8, y: 2.0, w: 11.7, h: 3.9, border: { type: 'solid', color: palette.line, pt: 1 }, fill: palette.pane, color: palette.ink, fontFace: 'Aptos', fontSize: 12, bold: false, autoFit: false, margin: 0.08, rowH: 0.32, valign: 'mid', fill: palette.pane });
}

async function addLocalImage(slide, asset, sourceDirectory) {
  const src = text(asset?.src);
  if (!src || /^(?:https?:|data:)/i.test(src)) return false;
  const path = isAbsolute(src) ? src : resolve(sourceDirectory, src);
  try { await access(path); } catch { return false; }
  slide.addImage({ path, x: 1.05, y: 2.0, w: 11.2, h: 3.95, sizing: { type: 'contain', x: 1.05, y: 2.0, w: 11.2, h: 3.95 } });
  return true;
}

function addRuntimeReference(slide, slideData) {
  const asset = slideData.media || slideData.visual || slideData.image;
  const reference = text(asset?.src);
  const label = slideData.layout === 'chart' ? 'Interactive chart' : slideData.layout === 'diagram' ? 'Interactive diagram' : slideData.three ? '3D scene' : text(slideData.media?.kind) ? `${text(slideData.media.kind)} media` : 'Interactive Gamma scene';
  slide.addShape('rect', { x: 0.9, y: 2.25, w: 11.45, h: 2.7, fill: { color: palette.pane }, line: { color: palette.line, width: 1 } });
  slide.addText(label, { x: 1.25, y: 2.8, w: 10.6, h: 0.45, fontFace: 'Aptos Display', fontSize: 22, bold: true, color: palette.highlight, ...textOptions });
  slide.addText(reference ? `Source: ${reference}` : 'This scene remains fully interactive in Gamma Presenter HTML and Stage.', { x: 1.25, y: 3.55, w: 10.6, h: 0.45, fontFace: 'Aptos', fontSize: 13, color: palette.muted, breakLine: false, valign: 'mid', fit: 'shrink', margin: 0 });
}

/** Generate a portable PowerPoint file without pretending interactive Gamma scenes are editable native charts. */
export async function writeDeckPptx(deck, fileName, { sourceDirectory = process.cwd() } = {}) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Gamma Presenter';
  pptx.company = 'Gamma Slides';
  pptx.subject = 'Gamma Presenter export';
  pptx.title = text(deck?.meta?.title) || 'Gamma presentation';
  pptx.lang = 'en-US';
  for (const [index, slideData] of array(deck?.slides).entries()) {
    const slide = pptx.addSlide();
    addFrame(slide, index + 1);
    addTitle(slide, slideData || {});
    const data = slideData || {};
    const localImage = await addLocalImage(slide, data.image || data.visual, sourceDirectory);
    if (!localImage && text(data.quote)) addQuote(slide, data);
    else if (!localImage && array(data.columns).length) addComparison(slide, data.columns);
    else if (!localImage && data.table) addTable(slide, data.table);
    else if (!localImage && array(data.items).length) addBullets(slide, data.items);
    else if (!localImage) addRuntimeReference(slide, data);
    if (text(data.notes || data.narration)) slide.addNotes(text(data.notes || data.narration));
  }
  await pptx.writeFile({ fileName, compression: true });
}
