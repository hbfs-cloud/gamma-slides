import { cinematicModel, cinematicHTML } from '../components/cinematic-comparison.js';
import { buildChartHTML } from '../components/chart-builder.js';
import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderInsight, renderSource } from '../components/slide-header.js';
import { spatialModel, immersiveChartHTML, formatSpatialValue } from '../components/immersive-data.js';
import { d3WebGPUHTML } from '../components/d3-webgpu.js';

export function renderChart(slide, theme, deck) {
  if (!slide.chart) return `<div class="empty-state">Chart data is missing</div>`;
  if (slide.variant === 'd3-webgpu') return d3WebGPUHTML(slide, slide.chart, deck?.meta?.language)+renderSource(slide);
  const chart = buildChartHTML(slide.chart);

  if (slide.variant === 'cinematic') {
    const model=cinematicModel(slide.chart);
    if(model)return cinematicHTML(slide,chart,model,deck?.meta?.language)+renderSource(slide);
    return `${renderSlideHeader(slide)}<div style="flex:1; min-height:0;">${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}</div>${renderSource(slide)}`;
  }

  if (slide.variant === 'immersive') {
    const model = spatialModel(slide.chart);
    if (model) return `${renderSlideHeader(slide)}${immersiveChartHTML(model, chart, deck?.meta?.language)}${renderSource(slide)}`;
    return `${renderSlideHeader(slide)}<div style="flex:1; min-height:0;">${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}</div>${renderSource(slide)}`;
  }

  if (slide.variant === 'video-chart') {
    let candle='';
    if(slide.chart.type==='stock'){
      const bars=slide.chart.data.datasets?.[0]?.values||slide.chart.data.values||[];
      const candidates=bars.map((v,i)=>({v,i})).filter(({v})=>Array.isArray(v)&&v.length===4&&v.every(Number.isFinite));
      const sample=candidates.slice(-30).sort((a,b)=>Math.abs(b.v[1]-b.v[0])-Math.abs(a.v[1]-a.v[0]))[0];
      if(sample){const [open,close,low,high]=sample.v, y=v=>45+(high-v)/Math.max(high-low,.00001)*310,upper=Math.max(open,close),lower=Math.min(open,close),day=slide.chart.data.labels?.[sample.i]||'';
        const label=(value,at,name,anchor=115)=>`<path d="M${anchor} ${y(value)} H130 L150 ${at} H155"/><circle cx="${anchor}" cy="${y(value)}" r="3"/><text x="165" y="${at+7}">${escapeHtml(name)}</text>`;
        candle=`<figure class="video-candle"><svg viewBox="0 0 380 400" role="img" aria-label="${escapeHtml(day+': open '+open+', close '+close+', low '+low+', high '+high)}"><g class="video-candle-lines"><path d="M90 45 V355"/>${label(high,35,'High',90)}${label(upper,140,close>=open?'Close':'Open')}${label(lower,250,close>=open?'Open':'Close')}${label(low,365,'Low',90)}</g><rect x="65" y="${y(upper)}" width="50" height="${Math.max(2,y(lower)-y(upper))}"/></svg><figcaption>${escapeHtml(day)}</figcaption></figure>`;
      }
    }
    return `<article class="video-chart"><h2>${escapeHtml(slide.title)}</h2><p class="video-chart-context">${escapeHtml(slide.subtitle||'')}</p><div class="video-chart-plot${candle?' video-chart-with-candle':''}">${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}${candle}</div><p class="video-chart-insight">${escapeHtml(slide.insight||'')}</p><p class="video-chart-source">${escapeHtml(slide.source||'')}</p></article>`;
  }

  if (slide.variant === 'story') {
    let mobileKey = '';
    if (deck?.meta?.experience && slide.chart.type === 'sankey') mobileKey = `<details class="experience-flow-labels"><summary>Full flow labels</summary><ul>${(slide.chart.data.nodes || []).map(node => `<li>${escapeHtml(typeof node === 'string' ? node : node.name)}</li>`).join('')}</ul></details>`;
    if (deck?.meta?.experience && slide.chart.type === 'waterfall') mobileKey = `<ol class="experience-chart-key" aria-label="Bridge components">${slide.chart.data.labels.map((label, index) => `<li><b>${index + 1}</b><span>${escapeHtml(label)}</span><strong>${escapeHtml(formatSpatialValue(slide.chart.data.datasets[0].values[index], slide.chart.options?.format_y))}</strong></li>`).join('')}</ol>`;
    return `<div class="story-chart">
      <div class="story-chart-copy">${renderSlideHeader(slide)}${renderInsight(slide)}</div>
      <div class="story-chart-visual">${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}</div>
      ${mobileKey}
    </div>${renderSource(slide)}`;
  }

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${escapeHtml(slide.title)}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <div style="flex: 1; min-height: 0; margin-top: 10px; width: 100%;">
      ${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}
    </div>
  `;
}
