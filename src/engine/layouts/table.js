export function renderTable(slide, theme) {
  const spec = slide.table;
  if (!spec) return '';

  const colTypes = spec.column_types || [];
  const maxRows = spec.max_rows || 20;
  const rows = spec.rows.slice(0, maxRows);
  const remaining = spec.rows.length - maxRows;

  const headers = spec.headers.map(h => `<th>${h}</th>`).join('');

  const renderCell = (val, colIdx) => {
    const type = colTypes[colIdx] || 'text';
    switch (type) {
      case 'tag': return `<span class="tag tag-primary">${val}</span>`;
      case 'mono': return `<span style="font-family: 'JetBrains Mono', monospace; font-size: 0.9em;">${val}</span>`;
      case 'amount': return `<span class="amount">${val}</span>`;
      case 'date': return `<span style="white-space: nowrap;">${val}</span>`;
      default: return val;
    }
  };

  const bodyRows = rows.map(row =>
    `<tr>${row.map((cell, i) => `<td${colTypes[i] === 'amount' ? ' class="amount"' : ''}>${renderCell(cell, i)}</td>`).join('')}</tr>`
  ).join('');

  const overflow = remaining > 0 ? `<tr><td colspan="${spec.headers.length}" style="text-align: center; color: ${theme.textMuted}; font-style: italic; font-size: 0.85em;">... and ${remaining} more rows</td></tr>` : '';

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${slide.title}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${slide.subtitle}</p>` : ''}
    <div style="margin-top: 14px; width: 100%;">
      <table class="data-table">
        <thead><tr>${headers}</tr></thead>
        <tbody>${bodyRows}${overflow}</tbody>
      </table>
    </div>
  `;
}
