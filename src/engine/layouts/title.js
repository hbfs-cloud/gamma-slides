export function renderTitle(slide, theme) {
  const badge = slide.badge ? `<div class="gamma-badge">${slide.badge}</div>` : '';
  const subtitle = slide.subtitle ? `<h3 style="color: ${theme.textMuted}; font-weight: 400; font-family: 'General Sans', system-ui, sans-serif; margin-top: 8px;">${slide.subtitle}</h3>` : '';

  return `
    ${badge}
    <h1 style="background: ${theme.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 14px 0 0; line-height: 1.05;">
      ${slide.title || ''}
    </h1>
    ${subtitle}
  `;
}
