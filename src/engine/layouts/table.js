import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderInsight, renderSource } from '../components/slide-header.js';

export function renderTable(slide, theme) {
  const spec = slide.table;
  if (!spec) return '';

  const colTypes = spec.column_types || [];
  const maxRows = Number.isInteger(spec.max_rows) && spec.max_rows > 0 ? Math.min(spec.max_rows, 20) : 20;
  const rows = spec.rows.slice(0, maxRows);
  const remaining = Math.max(0, spec.rows.length - rows.length);

  const highlightColumn = Number.isInteger(spec.highlight_column) ? spec.highlight_column : -1;
  const headers = spec.headers.map((h, index) => `<th scope="col" data-column="${index}"${index === highlightColumn ? ' class="col-highlight"' : ''}>${escapeHtml(h)}</th>`).join('');

  const tagClass = (value) => {
    const normalized = String(value).toLowerCase();
    if (/expand|active|complete|approved|healthy/.test(normalized)) return 'tag-positive';
    if (/risk|blocked|late|declin|failed/.test(normalized)) return 'tag-negative';
    if (/upgrad|pending|review/.test(normalized)) return 'tag-accent';
    return 'tag-primary';
  };

  const renderCell = (val, colIdx) => {
    const type = colTypes[colIdx] || 'text';
    switch (type) {
      case 'tag': return `<span class="tag ${tagClass(val)}">${escapeHtml(val)}</span>`;
      case 'mono': return `<span style="font-family: '${theme.fontMono || 'JetBrains Mono'}', monospace; font-size: 0.9em;">${escapeHtml(val)}</span>`;
      case 'amount': {
        const signClass = String(val).trim().startsWith('+') ? ' positive' : String(val).trim().startsWith('-') ? ' negative' : '';
        return `<span class="amount${signClass}">${escapeHtml(val)}</span>`;
      }
      case 'date': return `<span style="white-space: nowrap;">${escapeHtml(val)}</span>`;
      default: return escapeHtml(val);
    }
  };

  const bodyRows = rows.map((row, rowIndex) =>
    `<tr data-row="${rowIndex + 1}">${row.map((cell, i) => {
      const type = colTypes[i] || 'text';
      const classes = [`cell-${type}`, type === 'amount' ? 'amount' : '', i === highlightColumn ? 'col-highlight' : ''].filter(Boolean).join(' ');
      return `<td class="${classes}" data-label="${escapeHtml(spec.headers[i] || '')}" data-column="${i}">${renderCell(cell, i)}</td>`;
    }).join('')}</tr>`
  ).join('');

  const overflow = remaining > 0 ? `<tr class="table-overflow"><td colspan="${spec.headers.length}">… and ${remaining} more rows</td></tr>` : '';
  const tableLabel = escapeHtml(slide.title || 'Data table');

  if (slide.variant === 'editorial') {
    return `${renderSlideHeader(slide)}<div class="editorial-table-wrap"><table class="data-table" data-columns="${spec.headers.length}" aria-label="${tableLabel}">
      <thead><tr>${headers}</tr></thead><tbody>${bodyRows}${overflow}</tbody>
    </table></div>${renderInsight(slide)}${renderSource(slide)}`;
  }

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${escapeHtml(slide.title)}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <div style="margin-top: 14px; width: 100%;">
      <table class="data-table" data-columns="${spec.headers.length}" aria-label="${tableLabel}">
        <thead><tr>${headers}</tr></thead>
        <tbody>${bodyRows}${overflow}</tbody>
      </table>
    </div>
  `;
}
