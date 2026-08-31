export const themes = {
  fipto: {
    name: 'Fipto',
    primary: '#6C5CE7',
    secondary: '#00B894',
    accent: '#FD79A8',
    background: '#0F0A1F',
    surface: '#1A1432',
    surfaceLight: '#2D2548',
    text: '#FFFFFF',
    textMuted: '#A29BCC',
    gradient: 'linear-gradient(135deg, #6C5CE7 0%, #00B894 100%)',
    gradientAlt: 'linear-gradient(135deg, #6C5CE7 0%, #FD79A8 100%)',
    fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    css: `
      .reveal { font-family: 'Inter', system-ui, sans-serif; }
      .reveal h1, .reveal h2, .reveal h3 { font-weight: 800; letter-spacing: -0.02em; }
      .reveal h1 { font-size: 2.6em; }
      .reveal h2 { font-size: 1.8em; }
      .reveal h3 { font-size: 1.2em; }

      .slide-background { background: #0F0A1F !important; }

      .fipto-badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 16px; border-radius: 100px;
        background: rgba(108, 92, 231, 0.15);
        border: 1px solid rgba(108, 92, 231, 0.3);
        color: #A29BCC; font-size: 0.75em; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.08em;
      }

      .metric-card {
        background: linear-gradient(145deg, #1A1432 0%, #2D2548 100%);
        border: 1px solid rgba(108, 92, 231, 0.2);
        border-radius: 14px; padding: 18px 22px;
        text-align: left; position: relative; overflow: hidden;
      }
      .metric-card::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0;
        height: 3px; background: linear-gradient(90deg, #6C5CE7, #00B894);
      }
      .metric-card .label { color: #A29BCC; font-size: 0.7em; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
      .metric-card .value { color: #FFFFFF; font-size: 1.7em; font-weight: 800; line-height: 1.1; }
      .metric-card .delta { font-size: 0.75em; font-weight: 600; margin-top: 4px; }
      .metric-card .delta.positive { color: #00B894; }
      .metric-card .delta.negative { color: #FD79A8; }

      .data-table {
        width: 100%; border-collapse: separate; border-spacing: 0;
        font-size: 0.58em; border-radius: 10px; overflow: hidden;
        border: 1px solid rgba(108, 92, 231, 0.2);
      }
      .data-table thead th {
        background: rgba(108, 92, 231, 0.2); color: #A29BCC;
        padding: 8px 12px; text-align: left; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.85em;
      }
      .data-table tbody td {
        padding: 6px 12px; border-bottom: 1px solid rgba(108, 92, 231, 0.1);
        color: #E2DEFF;
      }
      .data-table tbody tr:last-child td { border-bottom: none; }
      .data-table tbody tr:hover td { background: rgba(108, 92, 231, 0.08); }
      .data-table .amount { font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: right; }
      .data-table .positive { color: #00B894; }
      .data-table .negative { color: #FD79A8; }

      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
      .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

      .tag { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 0.7em; font-weight: 600; }
      .tag-purple { background: rgba(108, 92, 231, 0.2); color: #A78BFA; }
      .tag-green { background: rgba(0, 184, 148, 0.2); color: #00B894; }
      .tag-pink { background: rgba(253, 121, 168, 0.2); color: #FD79A8; }
      .tag-blue { background: rgba(9, 132, 227, 0.2); color: #74B9FF; }

      .timeline { position: relative; padding-left: 30px; text-align: left; }
      .timeline::before { content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, #6C5CE7, #00B894); }
      .timeline-item { position: relative; margin-bottom: 24px; }
      .timeline-item::before { content: ''; position: absolute; left: -26px; top: 6px; width: 12px; height: 12px; border-radius: 50%; background: #6C5CE7; border: 2px solid #0F0A1F; }
      .timeline-item h4 { color: #FFFFFF; margin: 0 0 4px; font-weight: 700; font-size: 0.95em; }
      .timeline-item p { color: #A29BCC; margin: 0; font-size: 0.8em; }

      .highlight-box {
        background: linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(0, 184, 148, 0.1));
        border-left: 4px solid #6C5CE7; border-radius: 0 12px 12px 0;
        padding: 20px 24px; text-align: left; margin: 16px 0;
      }

      .chart-container { background: #1A1432; border-radius: 16px; padding: 20px; border: 1px solid rgba(108,92,231,0.15); }

      .footer-bar {
        position: fixed; bottom: 0; left: 0; right: 0;
        padding: 12px 40px; display: flex; justify-content: space-between; align-items: center;
        background: rgba(15, 10, 31, 0.9); border-top: 1px solid rgba(108, 92, 231, 0.15);
        font-size: 0.6em; color: #A29BCC; z-index: 100;
      }
    `
  },

  dark: {
    name: 'Dark',
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#111827',
    surface: '#1F2937',
    surfaceLight: '#374151',
    text: '#FFFFFF',
    textMuted: '#9CA3AF',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
    fontFamily: "'Inter', system-ui, sans-serif",
    css: `
      .reveal { font-family: 'Inter', system-ui, sans-serif; }
      .slide-background { background: #111827 !important; }
    `
  },

  light: {
    name: 'Light',
    primary: '#6C5CE7',
    secondary: '#00B894',
    accent: '#FD79A8',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceLight: '#F3F4F6',
    text: '#1F2937',
    textMuted: '#6B7280',
    gradient: 'linear-gradient(135deg, #6C5CE7 0%, #00B894 100%)',
    fontFamily: "'Inter', system-ui, sans-serif",
    css: `
      .reveal { font-family: 'Inter', system-ui, sans-serif; }
      .slide-background { background: #FAFAFA !important; }
      .metric-card { background: #FFFFFF; border-color: #E5E7EB; }
      .metric-card .label { color: #6B7280; }
      .metric-card .value { color: #1F2937; }
      .data-table thead th { background: #F3F4F6; color: #6B7280; }
      .data-table tbody td { color: #374151; border-color: #E5E7EB; }
    `
  }
};
