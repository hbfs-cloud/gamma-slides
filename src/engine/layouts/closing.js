export function renderClosing(slide, theme, deck) {
  const badge = slide.badge ? `<div class="gamma-badge">${slide.badge}</div>` : '';
  const metrics = (slide.metrics || []).map(m =>
    `<div class="metric-card" style="text-align: center;">
      <div class="label">${m.label}</div>
      <div class="value" style="font-size: 1.5em;">${m.value}</div>
    </div>`
  ).join('');

  const metricsGrid = metrics
    ? `<div class="grid-${Math.min(slide.metrics.length, 4)}" style="margin-top: 20px; max-width: 750px; margin-left: auto; margin-right: auto;">${metrics}</div>`
    : '';

  const contact = slide.contact
    ? `<p style="color: ${theme.textMuted}; font-size: 0.65em; margin-top: 18px; font-family: 'General Sans', system-ui, sans-serif;">
        ${slide.contact.email || ''} ${slide.contact.website ? `&middot; ${slide.contact.website}` : ''}
      </p>`
    : '';

  const meta = deck.meta || {};

  return `
    ${badge}
    <h1 style="background: ${theme.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 14px 0 0;">
      ${slide.title || 'Thank You'}
    </h1>
    ${slide.subtitle ? `<h3 style="color: ${theme.textMuted}; font-weight: 400; margin-top: 6px;">${slide.subtitle}</h3>` : ''}
    ${metricsGrid}
    ${contact}
  `;
}
