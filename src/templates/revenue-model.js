export function buildRevenueModelSlides(data, theme) {
  const t = theme;
  const streams = data.revenue_streams;
  const totals = data.totals;
  const quarters = data.quarterly_breakdown;
  const cohort = data.cohort_analysis;
  const unit = data.unit_economics;

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return [
    // Slide 1: Title
    `<section>
      <div class="fipto-badge">Revenue Model • ${data.period}</div>
      <h1 style="background: ${t.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 16px 0;">
        Revenue Model
      </h1>
      <h3 style="color: ${t.textMuted}; font-weight: 400;">${data.company} — ${data.model_type}</h3>
      <p style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 24px;">
        ${streams.length} revenue streams • ${totals.growth.toFixed(0)}% YoY growth • ${totals.gross_margin}% gross margin
      </p>
    </section>`,

    // Slide 2: Revenue Overview
    `<section>
      <h2 style="color: ${t.text};">Overview</h2>
      <div class="grid-4" style="margin-top: 18px;">
        <div class="metric-card">
          <div class="label">Revenue FY25</div>
          <div class="value">${fmt(totals.revenue_2025)}</div>
          <div class="delta positive">+${totals.growth.toFixed(0)}% YoY</div>
        </div>
        <div class="metric-card">
          <div class="label">Gross Margin</div>
          <div class="value">${totals.gross_margin}%</div>
          <div class="delta positive">Top quartile</div>
        </div>
        <div class="metric-card">
          <div class="label">LTV/CAC</div>
          <div class="value">${totals.ltv_cac_ratio}x</div>
          <div class="delta positive">&gt; 3x target</div>
        </div>
        <div class="metric-card">
          <div class="label">Net Revenue Retention</div>
          <div class="value">${totals.nrr}%</div>
          <div class="delta positive">&gt; 120% best-in-class</div>
        </div>
      </div>
      <div class="highlight-box" style="margin-top: 18px;">
        <span style="color: ${t.textMuted};">Hybrid <strong style="color: ${t.secondary};">transaction-based + SaaS</strong> model: cross-border fees capture volume growth, while SaaS provides a predictable recurring base.</span>
      </div>
    </section>`,

    // Slide 3: Revenue Streams Breakdown
    `<section>
      <h2 style="color: ${t.text};">Revenue Streams</h2>
      <div class="grid-2" style="margin-top: 14px;">
        <div class="chart-container">
          <canvas id="revenueStreamsChart" width="400" height="300"></canvas>
        </div>
        <div>
          ${streams.map((s, i) => {
            const colors = ['#6C5CE7', '#00B894', '#FD79A8', '#74B9FF', '#FFEAA7'];
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; margin-bottom: 5px; background: rgba(108,92,231,0.06); border-radius: 8px; border-left: 3px solid ${colors[i]};">
                <div>
                  <div style="color: ${t.text}; font-weight: 600; font-size: 0.75em;">${s.name}</div>
                  <div style="color: ${t.textMuted}; font-size: 0.6em;">${s.type} • ${s.pricing}</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: ${t.text}; font-weight: 700; font-size: 0.8em;">${fmt(s.revenue_2025)}</div>
                  <div style="color: ${t.secondary}; font-size: 0.65em; font-weight: 600;">+${s.growth}%</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    </section>`,

    // Slide 4: Cross-border Fees Deep Dive
    `<section>
      <h2 style="color: ${t.text};">Deep Dive: Cross-border Fees</h2>
      <p style="color: ${t.textMuted}; font-size: 0.75em;">${streams[0].description}</p>
      <div class="grid-3" style="margin-top: 18px;">
        <div class="metric-card">
          <div class="label">Transfers YTD</div>
          <div class="value" style="font-size: 1.5em;">${streams[0].volume_drivers.total_transfers.toLocaleString('en-US')}</div>
        </div>
        <div class="metric-card">
          <div class="label">Avg Transfer Size</div>
          <div class="value" style="font-size: 1.5em;">${fmt(streams[0].volume_drivers.avg_transfer_size)}</div>
        </div>
        <div class="metric-card">
          <div class="label">Avg Fee Rate</div>
          <div class="value" style="font-size: 1.5em;">${(streams[0].volume_drivers.avg_fee_rate * 100).toFixed(1)}%</div>
        </div>
      </div>
      <div class="highlight-box" style="margin-top: 14px;">
        <strong style="color: ${t.primary};">Formula</strong><br>
        <code style="color: ${t.secondary}; font-family: monospace; font-size: 0.85em;">
          Revenue = Transfers x Avg Size x Fee Rate = ${streams[0].volume_drivers.total_transfers.toLocaleString()} x ${fmt(streams[0].volume_drivers.avg_transfer_size)} x ${(streams[0].volume_drivers.avg_fee_rate * 100).toFixed(1)}% = <strong>${fmt(streams[0].revenue_2025)}</strong>
        </code>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 12px;">
        <span class="tag tag-green">52% of total revenue</span>
        <span class="tag tag-purple">+100% YoY</span>
        <span class="tag tag-blue">Primary growth driver</span>
      </div>
    </section>`,

    // Slide 5: Quarterly Trajectory
    `<section>
      <h2 style="color: ${t.text};">Quarterly Trajectory</h2>
      <div class="grid-2" style="margin-top: 18px;">
        <div class="chart-container">
          <canvas id="quarterlyChart" width="400" height="300"></canvas>
        </div>
        <div>
          <table class="data-table">
            <thead>
              <tr><th>Quarter</th><th class="amount">Revenue</th><th class="amount">Txns</th><th class="amount">New Clients</th></tr>
            </thead>
            <tbody>
              ${quarters.map((q, i) => `
                <tr>
                  <td style="font-weight: 600;">${q.quarter}</td>
                  <td class="amount">${fmt(q.revenue)}</td>
                  <td class="amount">${q.transactions.toLocaleString('en-US')}</td>
                  <td class="amount positive">+${q.new_clients}</td>
                </tr>`
              ).join('')}
            </tbody>
          </table>
          <div class="highlight-box" style="margin-top: 12px;">
            <strong style="color: ${t.secondary};">Avg QoQ Growth</strong><br>
            <span style="color: ${t.text}; font-size: 1.3em; font-weight: 800;">~15%</span>
          </div>
        </div>
      </div>
    </section>`,

    // Slide 6: Unit Economics
    `<section>
      <h2 style="color: ${t.text};">Unit Economics</h2>
      <div class="grid-3" style="margin-top: 18px;">
        <div class="metric-card">
          <div class="label">CAC</div>
          <div class="value">${fmt(unit.cac)}</div>
          <div style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 4px;">Customer acquisition cost</div>
        </div>
        <div class="metric-card">
          <div class="label">LTV</div>
          <div class="value" style="color: ${t.secondary};">${fmt(unit.ltv)}</div>
          <div style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 4px;">Lifetime value</div>
        </div>
        <div class="metric-card">
          <div class="label">LTV / CAC</div>
          <div class="value" style="color: ${t.secondary};">${totals.ltv_cac_ratio}x</div>
          <div class="delta positive">Best-in-class &gt; 5x</div>
        </div>
        <div class="metric-card">
          <div class="label">Payback Period</div>
          <div class="value">${unit.payback_months}</div>
          <div style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 4px;">months</div>
        </div>
        <div class="metric-card">
          <div class="label">Annual ARPC</div>
          <div class="value">${fmt(unit.avg_revenue_per_client)}</div>
          <div style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 4px;">Avg revenue per client</div>
        </div>
        <div class="metric-card">
          <div class="label">Txns / Client / Month</div>
          <div class="value">${unit.transactions_per_client_month}</div>
          <div class="delta positive">High engagement</div>
        </div>
      </div>
    </section>`,

    // Slide 7: Cohort Analysis
    `<section>
      <h2 style="color: ${t.text};">Cohort Analysis</h2>
      <div class="grid-2" style="margin-top: 18px;">
        <div>
          <h3 style="color: ${t.secondary}; font-size: 0.9em;">Retention</h3>
          <div class="chart-container">
            <canvas id="retentionChart" width="400" height="180"></canvas>
          </div>
          <table class="data-table" style="margin-top: 8px;">
            <thead>
              <tr>${cohort.months.map(m => `<th class="amount">M${m}</th>`).join('')}</tr>
            </thead>
            <tbody>
              <tr>${cohort.retention.map(r => `<td class="amount ${r >= 80 ? 'positive' : ''}">${r}%</td>`).join('')}</tr>
            </tbody>
          </table>
        </div>
        <div>
          <h3 style="color: ${t.primary}; font-size: 0.9em;">Revenue Expansion</h3>
          <div class="chart-container">
            <canvas id="expansionChart" width="400" height="180"></canvas>
          </div>
          <table class="data-table" style="margin-top: 8px;">
            <thead>
              <tr>${cohort.months.map(m => `<th class="amount">M${m}</th>`).join('')}</tr>
            </thead>
            <tbody>
              <tr>${cohort.revenue_expansion.map(r => `<td class="amount ${r > 100 ? 'positive' : ''}">${r}%</td>`).join('')}</tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="highlight-box" style="margin-top: 14px;">
        <strong style="color: ${t.secondary};">NRR ${totals.nrr}%</strong> — Existing clients increase transaction volume, more than offsetting the ${100 - cohort.retention[cohort.retention.length-1]}% M12 churn rate.
      </div>
    </section>`,

    // Slide 8: Revenue by Stream YoY
    `<section>
      <h2 style="color: ${t.text};">YoY Growth by Stream</h2>
      <div style="margin-top: 18px;">
        ${streams.map((s, i) => {
          const colors = ['#6C5CE7', '#00B894', '#FD79A8', '#74B9FF', '#FFEAA7'];
          const barWidth = (s.revenue_2025 / Math.max(...streams.map(x => x.revenue_2025)) * 100);
          const barWidth24 = (s.revenue_2024 / Math.max(...streams.map(x => x.revenue_2025)) * 100);
          return `
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                <span style="color: ${t.text}; font-weight: 600; font-size: 0.8em;">${s.name}</span>
                <span style="color: ${t.secondary}; font-weight: 700; font-size: 0.8em;">+${s.growth}%</span>
              </div>
              <div style="position: relative; height: 28px; background: rgba(108,92,231,0.08); border-radius: 8px; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${barWidth24}%; background: rgba(108,92,231,0.2); border-radius: 8px;"></div>
                <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${barWidth}%; background: ${colors[i]}; border-radius: 8px; opacity: 0.85;"></div>
                <div style="position: absolute; top: 50%; left: 10px; transform: translateY(-50%); color: white; font-weight: 600; font-size: 0.7em; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${fmt(s.revenue_2025)}</div>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 3px;">
                <span style="color: ${t.textMuted}; font-size: 0.6em;">FY24: ${fmt(s.revenue_2024)}</span>
                <span style="color: ${t.textMuted}; font-size: 0.6em;">•</span>
                <span style="color: ${t.textMuted}; font-size: 0.6em;">Share: ${s.share}%</span>
              </div>
            </div>`;
        }).join('')}
      </div>
    </section>`,

    // Slide 9: Growth Levers
    `<section>
      <h2 style="color: ${t.text};">Growth Levers</h2>
      <div class="grid-2" style="margin-top: 18px;">
        <div class="timeline">
          <div class="timeline-item">
            <h4>Geographic Expansion</h4>
            <p>Opening Latam (Brazil, Mexico) and SEA — new high-margin cross-border corridors</p>
          </div>
          <div class="timeline-item">
            <h4>New Stablecoins</h4>
            <p>USDT, PYUSD and local stablecoin support — higher conversion volume</p>
          </div>
          <div class="timeline-item">
            <h4>Enterprise Upsell</h4>
            <p>Migrate clients to Premium/Enterprise tiers — 2.5x ARPC on top accounts</p>
          </div>
          <div class="timeline-item">
            <h4>Treasury Optimization</h4>
            <p>Increase avg float via T+0 settlement — growing passive yield</p>
          </div>
          <div class="timeline-item">
            <h4>Embedded Compliance</h4>
            <p>Compliance-as-a-Service for partner fintechs — high-retention revenue stream</p>
          </div>
        </div>
        <div>
          <div class="metric-card" style="margin-bottom: 12px;">
            <div class="label">FY26 Target</div>
            <div class="value" style="font-size: 1.7em; background: ${t.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${fmt(28000000)}</div>
            <div class="delta positive">+74% vs FY25</div>
          </div>
          <div class="metric-card" style="margin-bottom: 12px;">
            <div class="label">Target Gross Margin</div>
            <div class="value" style="font-size: 1.7em;">78%</div>
            <div class="delta positive">+6pts vs FY25</div>
          </div>
          <div class="metric-card">
            <div class="label">Target Clients</div>
            <div class="value" style="font-size: 1.7em;">200+</div>
            <div class="delta positive">2.4x vs FY25</div>
          </div>
        </div>
      </div>
    </section>`,

    // Slide 10: Closing
    `<section>
      <div class="fipto-badge">Revenue Model Complete</div>
      <h1 style="background: ${t.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 24px 0;">
        ${data.company}
      </h1>
      <h3 style="color: ${t.textMuted}; font-weight: 400;">Cross-border payments, powered by stablecoins</h3>
      <div class="grid-3" style="margin-top: 24px; max-width: 700px; margin-left: auto; margin-right: auto;">
        <div class="metric-card" style="text-align: center;">
          <div class="label">Revenue</div>
          <div class="value" style="font-size: 1.3em;">${fmt(totals.revenue_2025)}</div>
        </div>
        <div class="metric-card" style="text-align: center;">
          <div class="label">Growth</div>
          <div class="value" style="font-size: 1.3em; color: ${t.secondary};">+${totals.growth.toFixed(0)}%</div>
        </div>
        <div class="metric-card" style="text-align: center;">
          <div class="label">NRR</div>
          <div class="value" style="font-size: 1.3em; color: ${t.secondary};">${totals.nrr}%</div>
        </div>
      </div>
      <p style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 24px;">
        ${data.company} • ${data.period} • Generated by Fipto Slides
      </p>
    </section>`
  ];
}
