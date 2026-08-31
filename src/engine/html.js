export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function safeUrl(value = '') {
  const url = String(value).trim();
  if (!url) return '';
  if (/^(?:https?:|data:image\/|\.\/|\.\.\/|\/)/i.test(url)) return escapeHtml(url);
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) return '';
  return escapeHtml(url);
}

export function richText(value = '') {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
