export function renderImage(slide, theme) {
  const img = slide.image || {};
  const caption = img.caption ? `<p style="color: ${theme.textMuted}; font-size: 0.7em; margin-top: 10px; font-style: italic;">${img.caption}</p>` : '';

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${slide.title}</h2>` : ''}
    <div style="margin-top: 18px;">
      <img src="${img.src || ''}" alt="${img.alt || ''}" style="max-width: 90%; max-height: 480px; object-fit: ${img.fit || 'contain'}; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
      ${caption}
    </div>
  `;
}
