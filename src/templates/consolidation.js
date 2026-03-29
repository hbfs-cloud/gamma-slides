export function buildConsolidationSlides(data, theme) {
  const t = theme;
  const group = data.group;
  const entities = data.entities;
  const elim = data.intercompany_eliminations;
  const pl = data.consolidated_pl;
  const bs = data.consolidated_bs;
  const fx = data.fx_impacts;

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return [
    // Slide 1: Title
    `<section>
      <div class="fipto-badge">Consolidation • ${group.closing_date}</div>
      <h1 style="background: ${t.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 16px 0;">
        Consolidated<br>Financial Statements
      </h1>
      <h3 style="color: ${t.textMuted}; font-weight: 400;">${group.method} • Currency: ${group.currency}</h3>
      <p style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 24px;">
        ${entities.length} entities • ${entities.map(e => e.country).filter((v,i,a) => a.indexOf(v) === i).length} countries • ${elim.length} intercompany flows
      </p>
    </section>`,

    // Slide 2: Group Structure
    `<section>
      <h2 style="color: ${t.text};">Consolidation Scope</h2>
      <table class="data-table" style="margin-top: 14px;">
        <thead>
          <tr><th>Entity</th><th>Country</th><th>CCY</th><th class="amount">Ownership</th><th>Method</th><th class="amount">Revenue</th><th class="amount">EBITDA</th></tr>
        </thead>
        <tbody>
          ${entities.map(e => `
            <tr>
              <td style="font-weight: 600; color: ${t.text};">${e.name}</td>
              <td>${e.country}</td>
              <td><span class="tag tag-blue">${e.currency}</span></td>
              <td class="amount">${e.ownership}%</td>
              <td><span class="tag tag-purple">${e.method}</span></td>
              <td class="amount">${fmt(e.revenue)}</td>
              <td class="amount positive">${fmt(e.ebitda)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>`,

    // Slide 3: Revenue by Entity
    `<section>
      <h2 style="color: ${t.text};">Revenue by Entity</h2>
      <div class="grid-2" style="margin-top: 18px;">
        <div class="chart-container">
          <canvas id="revenueByEntityChart" width="400" height="300"></canvas>
        </div>
        <div>
          ${entities.map((e, i) => {
            const colors = ['#6C5CE7', '#00B894', '#FD79A8', '#74B9FF', '#FFEAA7'];
            const share = (e.revenue / entities.reduce((s, x) => s + x.revenue, 0) * 100).toFixed(1);
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; margin-bottom: 6px; background: rgba(108,92,231,0.06); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 10px; height: 10px; border-radius: 3px; background: ${colors[i]};"></div>
                  <span style="color: ${t.text}; font-weight: 500; font-size: 0.8em;">${e.name}</span>
                </div>
                <div style="text-align: right;">
                  <span style="color: ${t.text}; font-weight: 700; font-size: 0.8em;">${fmt(e.revenue)}</span>
                  <span style="color: ${t.textMuted}; font-size: 0.65em; margin-left: 6px;">${share}%</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    </section>`,

    // Slide 4: Intercompany Eliminations
    `<section>
      <h2 style="color: ${t.text};">Intercompany Eliminations</h2>
      <div class="grid-2" style="margin-top: 18px;">
        <div>
          <table class="data-table">
            <thead>
              <tr><th>From</th><th>To</th><th>Type</th><th class="amount">Amount</th></tr>
            </thead>
            <tbody>
              ${elim.map(e => `
                <tr>
                  <td style="font-weight: 500;">${e.from.replace('Fipto ', '')}</td>
                  <td style="font-weight: 500;">${e.to.replace('Fipto ', '')}</td>
                  <td><span class="tag tag-pink">${e.type}</span></td>
                  <td class="amount negative">${fmt(e.amount)}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: 700; border-top: 2px solid ${t.primary};">
                <td colspan="3" style="color: ${t.text};">Total eliminated</td>
                <td class="amount negative">${fmt(elim.reduce((s, e) => s + e.amount, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="highlight-box">
          <h3 style="color: ${t.accent}; margin-top: 0;">Revenue Impact</h3>
          <p style="color: ${t.textMuted}; font-size: 0.8em;">
            Aggregate revenue: <strong style="color: ${t.text};">${fmt(pl.revenue)}</strong><br>
            Eliminations: <strong style="color: ${t.accent};">${fmt(pl.eliminations_revenue)}</strong><br>
            <span style="font-size: 1.2em; font-weight: 800; color: ${t.secondary};">Consolidated: ${fmt(pl.consolidated_revenue)}</span>
          </p>
        </div>
      </div>
    </section>`,

    // Slide 5: Consolidated P&L
    `<section>
      <h2 style="color: ${t.text};">Consolidated P&L</h2>
      <div class="grid-2" style="margin-top: 14px;">
        <div>
          <table class="data-table">
            <thead>
              <tr><th>Line Item</th><th class="amount">Amount</th><th class="amount">Margin</th></tr>
            </thead>
            <tbody>
              <tr><td style="font-weight: 600;">Consolidated Revenue</td><td class="amount positive">${fmt(pl.consolidated_revenue)}</td><td class="amount">100%</td></tr>
              <tr><td>Cost of Revenue</td><td class="amount negative">${fmt(pl.cost_of_revenue)}</td><td class="amount">${(pl.cost_of_revenue/pl.consolidated_revenue*100).toFixed(1)}%</td></tr>
              <tr style="background: rgba(0,184,148,0.08);"><td style="font-weight: 700; color: ${t.secondary};">Gross Profit</td><td class="amount positive" style="font-weight: 700;">${fmt(pl.gross_profit)}</td><td class="amount positive" style="font-weight: 700;">${(pl.gross_profit/pl.consolidated_revenue*100).toFixed(1)}%</td></tr>
              <tr><td>OPEX</td><td class="amount negative">${fmt(pl.opex)}</td><td class="amount">${(pl.opex/pl.consolidated_revenue*100).toFixed(1)}%</td></tr>
              <tr style="background: rgba(108,92,231,0.08);"><td style="font-weight: 700; color: ${t.primary};">EBITDA</td><td class="amount positive" style="font-weight: 700;">${fmt(pl.ebitda)}</td><td class="amount positive" style="font-weight: 700;">${(pl.ebitda/pl.consolidated_revenue*100).toFixed(1)}%</td></tr>
              <tr><td>D&A</td><td class="amount negative">${fmt(pl.depreciation)}</td><td></td></tr>
              <tr><td style="font-weight: 600;">EBIT</td><td class="amount positive">${fmt(pl.ebit)}</td><td class="amount">${(pl.ebit/pl.consolidated_revenue*100).toFixed(1)}%</td></tr>
              <tr><td>Financial Result</td><td class="amount negative">${fmt(pl.financial_result)}</td><td></td></tr>
              <tr><td>Income Tax</td><td class="amount negative">${fmt(pl.tax)}</td><td></td></tr>
              <tr style="background: rgba(0,184,148,0.12);"><td style="font-weight: 800; color: ${t.secondary};">Group Net Income</td><td class="amount positive" style="font-weight: 800; font-size: 1.1em;">${fmt(pl.group_net_income)}</td><td class="amount positive" style="font-weight: 700;">${(pl.group_net_income/pl.consolidated_revenue*100).toFixed(1)}%</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div class="metric-card" style="margin-bottom: 12px;">
            <div class="label">Minority Interests</div>
            <div class="value" style="font-size: 1.3em;">${fmt(pl.minority_interests)}</div>
            <div style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 4px;">UAE (20%) + Latam (40%)</div>
          </div>
          <div class="chart-container">
            <canvas id="plWaterfallChart" width="400" height="220"></canvas>
          </div>
        </div>
      </div>
    </section>`,

    // Slide 6: Consolidated Balance Sheet
    `<section>
      <h2 style="color: ${t.text};">Consolidated Balance Sheet</h2>
      <div class="grid-2" style="margin-top: 14px;">
        <div>
          <h3 style="color: ${t.secondary}; font-size: 0.9em; margin-bottom: 8px;">ASSETS</h3>
          <table class="data-table">
            <tbody>
              <tr><td colspan="2" style="color: ${t.textMuted}; font-weight: 600; text-transform: uppercase; font-size: 0.8em;">Non-current Assets</td></tr>
              <tr><td>Intangible</td><td class="amount">${fmt(bs.assets.intangible)}</td></tr>
              <tr><td>Tangible</td><td class="amount">${fmt(bs.assets.tangible)}</td></tr>
              <tr><td>Financial</td><td class="amount">${fmt(bs.assets.financial)}</td></tr>
              <tr style="background: rgba(108,92,231,0.08);"><td style="font-weight: 600;">Subtotal</td><td class="amount" style="font-weight: 600;">${fmt(bs.assets.total_non_current)}</td></tr>
              <tr><td colspan="2" style="color: ${t.textMuted}; font-weight: 600; text-transform: uppercase; font-size: 0.8em; padding-top: 10px;">Current Assets</td></tr>
              <tr><td>Receivables</td><td class="amount">${fmt(bs.assets.receivables)}</td></tr>
              <tr><td>Stablecoin Wallets</td><td class="amount positive">${fmt(bs.assets.stablecoin_wallets)}</td></tr>
              <tr><td>Cash</td><td class="amount positive">${fmt(bs.assets.cash)}</td></tr>
              <tr style="background: rgba(0,184,148,0.08);"><td style="font-weight: 700;">Total Assets</td><td class="amount positive" style="font-weight: 800; font-size: 1.05em;">${fmt(bs.assets.total)}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h3 style="color: ${t.accent}; font-size: 0.9em; margin-bottom: 8px;">LIABILITIES & EQUITY</h3>
          <table class="data-table">
            <tbody>
              <tr><td>Shareholders' Equity</td><td class="amount">${fmt(bs.liabilities.equity)}</td></tr>
              <tr><td>Minority Interests</td><td class="amount">${fmt(bs.liabilities.minority)}</td></tr>
              <tr><td colspan="2" style="color: ${t.textMuted}; font-weight: 600; text-transform: uppercase; font-size: 0.8em; padding-top: 10px;">Non-current Liabilities</td></tr>
              <tr><td>Long-term Debt</td><td class="amount">${fmt(bs.liabilities.long_term_debt)}</td></tr>
              <tr><td colspan="2" style="color: ${t.textMuted}; font-weight: 600; text-transform: uppercase; font-size: 0.8em; padding-top: 10px;">Current Liabilities</td></tr>
              <tr><td>Short-term Debt</td><td class="amount">${fmt(bs.liabilities.short_term_debt)}</td></tr>
              <tr><td>Payables</td><td class="amount">${fmt(bs.liabilities.payables)}</td></tr>
              <tr><td>Tax Liabilities</td><td class="amount">${fmt(bs.liabilities.tax_liabilities)}</td></tr>
              <tr style="background: rgba(253,121,168,0.08);"><td style="font-weight: 700;">Total L&E</td><td class="amount" style="font-weight: 800; font-size: 1.05em;">${fmt(bs.liabilities.total)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>`,

    // Slide 7: FX Impact
    `<section>
      <h2 style="color: ${t.text};">Foreign Exchange Impact</h2>
      <p style="color: ${t.textMuted}; font-size: 0.75em;">Currency translation adjustments on consolidated accounts</p>
      <table class="data-table" style="margin-top: 14px;">
        <thead>
          <tr><th>Entity</th><th>Pair</th><th class="amount">Opening Rate</th><th class="amount">Closing Rate</th><th class="amount">Impact</th></tr>
        </thead>
        <tbody>
          ${fx.map(f => `
            <tr>
              <td style="font-weight: 500;">${f.entity}</td>
              <td><span class="tag tag-blue">${f.currency}</span></td>
              <td class="amount">${f.rate_open.toFixed(4)}</td>
              <td class="amount">${f.rate_close.toFixed(4)}</td>
              <td class="amount ${f.translation_impact >= 0 ? 'positive' : 'negative'}">${fmt(f.translation_impact)}</td>
            </tr>
          `).join('')}
          <tr style="background: rgba(108,92,231,0.08);">
            <td colspan="4" style="font-weight: 700; color: ${t.text};">Net Translation Impact</td>
            <td class="amount positive" style="font-weight: 700;">${fmt(fx.reduce((s, f) => s + f.translation_impact, 0))}</td>
          </tr>
        </tbody>
      </table>
      <div class="highlight-box" style="margin-top: 14px;">
        <strong style="color: ${t.primary};">Key Takeaway</strong><br>
        <span style="color: ${t.textMuted};">Using stablecoins (USDC, EURC) for intercompany flows significantly reduces FX exposure compared to traditional SWIFT transfers.</span>
      </div>
    </section>`,

    // Slide 8: Key Ratios
    `<section>
      <h2 style="color: ${t.text};">Key Consolidated Ratios</h2>
      <div class="grid-3" style="margin-top: 18px;">
        <div class="metric-card">
          <div class="label">Gross Margin</div>
          <div class="value">${(pl.gross_profit/pl.consolidated_revenue*100).toFixed(1)}%</div>
          <div class="delta positive">Target &gt; 55%</div>
        </div>
        <div class="metric-card">
          <div class="label">EBITDA Margin</div>
          <div class="value">${(pl.ebitda/pl.consolidated_revenue*100).toFixed(1)}%</div>
          <div class="delta positive">Target &gt; 20%</div>
        </div>
        <div class="metric-card">
          <div class="label">Net Margin</div>
          <div class="value">${(pl.group_net_income/pl.consolidated_revenue*100).toFixed(1)}%</div>
          <div class="delta positive">Target &gt; 10%</div>
        </div>
        <div class="metric-card">
          <div class="label">Gearing</div>
          <div class="value">${((bs.liabilities.long_term_debt + bs.liabilities.short_term_debt) / bs.liabilities.equity * 100).toFixed(1)}%</div>
          <div class="delta positive">Well controlled</div>
        </div>
        <div class="metric-card">
          <div class="label">Stablecoin / Cash</div>
          <div class="value">${(bs.assets.stablecoin_wallets / (bs.assets.stablecoin_wallets + bs.assets.cash) * 100).toFixed(1)}%</div>
          <div class="delta positive">Growing</div>
        </div>
        <div class="metric-card">
          <div class="label">Current Ratio</div>
          <div class="value">${(bs.assets.total_current / bs.liabilities.total_current).toFixed(2)}x</div>
          <div class="delta positive">&gt; 1.5x</div>
        </div>
      </div>
    </section>`,

    // Slide 9: Consolidation Process
    `<section>
      <h2 style="color: ${t.text};">Consolidation Process</h2>
      <div class="timeline" style="margin-top: 24px;">
        <div class="timeline-item">
          <h4>1. Reporting Package Collection</h4>
          <p>Receive subsidiary packages with chart of accounts mapping to group standard</p>
        </div>
        <div class="timeline-item">
          <h4>2. Homogeneity Adjustments</h4>
          <p>Align accounting policies — depreciation, provisions, crypto cut-off rules</p>
        </div>
        <div class="timeline-item">
          <h4>3. Currency Translation</h4>
          <p>Apply ECB rates + stablecoin rates for non-eurozone entities</p>
        </div>
        <div class="timeline-item">
          <h4>4. Intercompany Eliminations</h4>
          <p>Management fees, license fees, commissions — auto-reconciled via blockchain</p>
        </div>
        <div class="timeline-item">
          <h4>5. Minority Interest Allocation</h4>
          <p>P&L share allocated to UAE (20%) and Latam (40%) non-controlling interests</p>
        </div>
      </div>
    </section>`,

    // Slide 10: Closing
    `<section>
      <div class="fipto-badge">Consolidation Complete</div>
      <h1 style="background: ${t.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 24px 0;">
        Group Summary
      </h1>
      <div class="grid-4" style="margin-top: 24px;">
        <div class="metric-card" style="text-align: center;">
          <div class="label">Revenue</div>
          <div class="value" style="font-size: 1.2em;">${fmt(pl.consolidated_revenue)}</div>
        </div>
        <div class="metric-card" style="text-align: center;">
          <div class="label">EBITDA</div>
          <div class="value" style="font-size: 1.2em;">${fmt(pl.ebitda)}</div>
        </div>
        <div class="metric-card" style="text-align: center;">
          <div class="label">Net Income</div>
          <div class="value" style="font-size: 1.2em;">${fmt(pl.group_net_income)}</div>
        </div>
        <div class="metric-card" style="text-align: center;">
          <div class="label">Total Assets</div>
          <div class="value" style="font-size: 1.2em;">${fmt(bs.assets.total)}</div>
        </div>
      </div>
      <p style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 24px;">
        ${group.name} • ${entities.length} entities • Closing ${group.closing_date} • Generated by Fipto Slides
      </p>
    </section>`
  ];
}
