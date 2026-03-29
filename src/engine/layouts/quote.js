export function renderQuote(slide, theme) {
  const avatar = slide.image
    ? `<img src="${slide.image}" alt="${slide.author || ''}" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; margin-bottom: 16px; border: 2px solid rgba(${hexToRgb(theme.primary)}, 0.2);">`
    : '';

  return `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;">
      ${avatar}
      <div class="quote-block">${slide.quote || ''}</div>
      <div class="quote-author">
        <strong style="color: ${theme.text};">${slide.author || ''}</strong>
        ${slide.role ? `<br><span style="opacity: 0.7;">${slide.role}</span>` : ''}
      </div>
    </div>
  `;
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '128, 128, 128';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
