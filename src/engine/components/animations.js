export function animationCSS() {
  return `
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes fadeInScale { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    @keyframes slideInNumber { from { opacity: 0; transform: translateY(12px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(var(--anim-color), 0); } 50% { box-shadow: 0 0 20px 4px rgba(var(--anim-color), 0.15); } }

    .reveal .slides section.present .anim-up { animation: fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .reveal .slides section.present .anim-left { animation: fadeInLeft 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .reveal .slides section.present .anim-right { animation: fadeInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .reveal .slides section.present .anim-scale { animation: fadeInScale 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .reveal .slides section.present .anim-number { animation: slideInNumber 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

    ${Array.from({length: 10}, (_, i) => `.reveal .slides section.present .d${i+1} { animation-delay: ${(i+1)*0.06}s; }`).join('\n    ')}

    .reveal .slides section:not(.present) .anim-up,
    .reveal .slides section:not(.present) .anim-left,
    .reveal .slides section:not(.present) .anim-right,
    .reveal .slides section:not(.present) .anim-scale,
    .reveal .slides section:not(.present) .anim-number { opacity: 0; }

    .metric-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .metric-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.2); }

    .reveal .slides section.present .timeline-item { animation: fadeInLeft 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
    ${Array.from({length: 8}, (_, i) => `.reveal .slides section.present .timeline-item:nth-child(${i+1}) { animation-delay: ${(i+1)*0.08}s; }`).join('\n    ')}
    .reveal .slides section:not(.present) .timeline-item { opacity: 0; }

    .reveal .slides section.present .data-table tbody tr { animation: fadeInUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) both; }
    ${Array.from({length: 10}, (_, i) => `.reveal .slides section.present .data-table tbody tr:nth-child(${i+1}) { animation-delay: ${(i+1)*0.04}s; }`).join('\n    ')}
    .reveal .slides section:not(.present) .data-table tbody tr { opacity: 0; }

    .reveal .slides section.present .highlight-box { animation: fadeInUp 0.6s ease 0.5s both; }
    .reveal .slides section:not(.present) .highlight-box { opacity: 0; }

    .reveal .slides section.present .bullet-item { animation: fadeInLeft 0.4s ease both; }
    ${Array.from({length: 8}, (_, i) => `.reveal .slides section.present .bullet-item:nth-child(${i+1}) { animation-delay: ${(i+1)*0.12}s; }`).join('\n    ')}
    .reveal .slides section:not(.present) .bullet-item { opacity: 0; }
  `;
}

export function autoAnimateJS() {
  return `
    function applyAnimations() {
      document.querySelectorAll('.reveal .slides section').forEach(section => {
        section.querySelectorAll('h1, h2, h3').forEach((el, i) => {
          el.classList.add('anim-up', 'd' + Math.min(i + 1, 10));
        });
        section.querySelectorAll('.metric-card').forEach((el, i) => {
          if (!el.classList.contains('anim-scale')) el.classList.add('anim-scale', 'd' + Math.min(i + 2, 10));
        });
        section.querySelectorAll('.grid-2, .grid-3, .grid-4').forEach((el, i) => {
          if (!el.classList.contains('anim-up')) el.classList.add('anim-up', 'd' + Math.min(i + 2, 10));
        });
        section.querySelectorAll('.chart-container').forEach(el => {
          el.classList.add('anim-scale', 'd3');
        });
        section.querySelectorAll('.gamma-badge').forEach(el => {
          if (!el.classList.contains('anim-scale')) el.classList.add('anim-scale', 'd1');
        });
        section.querySelectorAll('.quote-block').forEach(el => {
          el.classList.add('anim-up', 'd2');
        });
      });
    }
  `;
}
