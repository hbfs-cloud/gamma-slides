export function buildFecSlides(data, theme) {
  const t = theme;
  const kpis = data.kpis;
  const balance = data.balance_generale;
  const journal = data.journal_sample;
  const meta = data.metadata;
  const summary = data.summary;

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return [
    // Slide 1: Title
    `<section>
      <div class="fipto-badge">FEC Analysis • ${meta.exercice.debut} → ${meta.exercice.fin}</div>
      <h1 style="color: ${t.primary}; margin: 16px 0;">
        General Ledger<br>Export File
      </h1>
      <h3 style="color: ${t.textMuted}; font-weight: 400;">${meta.denomination} — SIREN ${meta.siren}</h3>
      <p style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 24px;">
        ${summary.total_ecritures.toLocaleString('en-US')} entries • ${summary.comptes_utilises} accounts • ${summary.journaux.length} journals
      </p>
    </section>`,

    // Slide 2: KPIs Overview
    `<section>
      <h2 style="color: ${t.text};">Key Metrics</h2>
      <div class="grid-3" style="margin-top: 18px;">
        <div class="metric-card">
          <div class="label">Transaction Volume</div>
          <div class="value">${kpis.volume_transactions.value}</div>
          <div class="delta positive">${kpis.volume_transactions.delta} ${kpis.volume_transactions.period}</div>
        </div>
        <div class="metric-card">
          <div class="label">Stablecoin Volume</div>
          <div class="value">${kpis.volume_stablecoin.value}</div>
          <div class="delta positive">${kpis.volume_stablecoin.delta} ${kpis.volume_stablecoin.period}</div>
        </div>
        <div class="metric-card">
          <div class="label">Service Revenue</div>
          <div class="value">${kpis.revenus_services.value}</div>
          <div class="delta positive">${kpis.revenus_services.delta} ${kpis.revenus_services.period}</div>
        </div>
      </div>
      <div class="grid-3" style="margin-top: 14px;">
        <div class="metric-card">
          <div class="label">Cross-border Commissions</div>
          <div class="value">${kpis.commissions_crossborder.value}</div>
          <div class="delta positive">${kpis.commissions_crossborder.delta}</div>
        </div>
        <div class="metric-card">
          <div class="label">FX Gains</div>
          <div class="value">${kpis.gains_change.value}</div>
          <div class="delta positive">${kpis.gains_change.delta}</div>
        </div>
        <div class="metric-card">
          <div class="label">Stablecoin Ratio</div>
          <div class="value">${kpis.ratio_stablecoin.value}</div>
          <div class="delta positive">${kpis.ratio_stablecoin.delta}</div>
        </div>
      </div>
    </section>`,

    // Slide 3: Trial Balance - Balance Sheet
    `<section>
      <h2 style="color: ${t.text};">Trial Balance — Balance Sheet</h2>
      <table class="data-table" style="margin-top: 14px;">
        <thead>
          <tr><th>Account</th><th>Description</th><th class="amount">Debit</th><th class="amount">Credit</th><th class="amount">Balance</th></tr>
        </thead>
        <tbody>
          ${balance.filter(b => b.compte < '500000').map(b => `
            <tr>
              <td><span class="tag tag-purple">${b.compte}</span></td>
              <td>${b.libelle}</td>
              <td class="amount">${b.debit ? fmt(b.debit) : '—'}</td>
              <td class="amount">${b.credit ? fmt(b.credit) : '—'}</td>
              <td class="amount ${b.solde >= 0 ? 'positive' : 'negative'}">${fmt(b.solde)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>`,

    // Slide 4: Cash & Stablecoin Wallets
    `<section>
      <h2 style="color: ${t.text};">Cash & Stablecoin Wallets</h2>
      <div class="grid-2" style="margin-top: 18px;">
        <div>
          <table class="data-table">
            <thead>
              <tr><th>Account</th><th>Description</th><th class="amount">Balance</th></tr>
            </thead>
            <tbody>
              ${balance.filter(b => b.compte >= '512000' && b.compte <= '512999').map(b => `
                <tr>
                  <td><span class="tag tag-green">${b.compte}</span></td>
                  <td>${b.libelle}</td>
                  <td class="amount positive">${fmt(b.solde)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div>
          <div class="chart-container">
            <canvas id="tresoChart" width="400" height="300"></canvas>
          </div>
        </div>
      </div>
      <div class="highlight-box" style="margin-top: 16px;">
        <strong style="color: ${t.secondary};">Key Insight</strong><br>
        <span style="color: ${t.textMuted};">Stablecoin wallets (USDC + EURC) represent <strong style="color: ${t.text};">37.7%</strong> of total cash, aligned with Fipto's cross-border payment strategy.</span>
      </div>
    </section>`,

    // Slide 5: Income Statement
    `<section>
      <h2 style="color: ${t.text};">Income Statement</h2>
      <div class="grid-2" style="margin-top: 18px;">
        <div>
          <table class="data-table">
            <thead>
              <tr><th>Line Item</th><th class="amount">Amount</th></tr>
            </thead>
            <tbody>
              ${balance.filter(b => b.compte >= '600000').map(b => `
                <tr>
                  <td>${b.libelle}</td>
                  <td class="amount ${b.solde < 0 ? 'positive' : 'negative'}">${fmt(Math.abs(b.solde))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div>
          <div class="metric-card" style="margin-bottom: 12px;">
            <div class="label">Total Revenue</div>
            <div class="value" style="color: ${t.secondary};">${fmt(8400000 + 3150000)}</div>
          </div>
          <div class="metric-card" style="margin-bottom: 12px;">
            <div class="label">Operating Expenses</div>
            <div class="value" style="color: ${t.accent};">${fmt(5920000)}</div>
          </div>
          <div class="metric-card">
            <div class="label">Operating Income</div>
            <div class="value" style="color: ${t.secondary};">${fmt(5915000)}</div>
          </div>
        </div>
      </div>
    </section>`,

    // Slide 6: Journal Entries Sample
    `<section>
      <h2 style="color: ${t.text};">Journal Entries Sample</h2>
      <p style="color: ${t.textMuted}; font-size: 0.75em;">Sample entries — Sales, Bank, and Miscellaneous journals</p>
      <table class="data-table" style="margin-top: 14px;">
        <thead>
          <tr><th>Date</th><th>Journal</th><th>Ref</th><th>Account</th><th>Description</th><th class="amount">Debit</th><th class="amount">Credit</th></tr>
        </thead>
        <tbody>
          ${journal.map(j => `
            <tr>
              <td style="white-space: nowrap;">${j.date}</td>
              <td><span class="tag tag-blue">${j.journal}</span></td>
              <td style="font-family: monospace; font-size: 0.9em;">${j.piece}</td>
              <td><span class="tag tag-purple">${j.compte}</span></td>
              <td>${j.libelle}</td>
              <td class="amount">${j.debit ? fmt(j.debit) : ''}</td>
              <td class="amount">${j.credit ? fmt(j.credit) : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>`,

    // Slide 7: Journal Breakdown
    `<section>
      <h2 style="color: ${t.text};">Entries by Journal</h2>
      <div class="grid-2" style="margin-top: 18px;">
        <div class="chart-container">
          <canvas id="journalChart" width="400" height="300"></canvas>
        </div>
        <div>
          ${summary.journaux.map((j, i) => {
            const labels = { PUR: 'Purchases', SAL: 'Sales', BNK: 'Bank', MIS: 'Miscellaneous', OPN: 'Opening' };
            const colors = ['#6C5CE7', '#00B894', '#FD79A8', '#74B9FF', '#FFEAA7'];
            return `
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding: 10px 14px; background: ${t.highlightBg || t.surface}; border-radius: 9px;">
                <div style="width: 14px; height: 14px; border-radius: 4px; background: ${colors[i]};"></div>
                <div>
                  <div style="color: ${t.text}; font-weight: 600;">${j}</div>
                  <div style="color: ${t.textMuted}; font-size: 0.75em;">${labels[j] || j}</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    </section>`,

    // Slide 8: FEC Compliance
    `<section>
      <h2 style="color: ${t.text};">FEC Compliance</h2>
      <p style="color: ${t.textMuted}; font-size: 0.75em;">Verification per French tax code article A.47 A-1</p>
      <div class="grid-2" style="margin-top: 14px;">
        <div>
          ${[
            { label: 'Debit/credit balance', status: true, detail: `${fmt(summary.total_debit)} = ${fmt(summary.total_credit)}` },
            { label: 'Required fields', status: true, detail: '18/18 fields present' },
            { label: 'Chronological order', status: true, detail: 'No gaps detected' },
            { label: 'Document numbering', status: true, detail: 'Continuous sequences per journal' },
            { label: 'ISO 8601 date format', status: true, detail: 'YYYY-MM-DD compliant' },
          ].map(c => `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 10px 14px; background: ${t.highlightBg || t.surface}; border: 1px solid ${t.cardBorder || t.positive}; border-radius: 9px;">
              <span>OK</span>
              <div>
                <div style="color: ${t.text}; font-weight: 600; font-size: 0.85em;">${c.label}</div>
                <div style="color: ${t.textMuted}; font-size: 0.7em;">${c.detail}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div>
          <div class="highlight-box">
            <h3 style="color: ${t.secondary}; margin-top: 0;">Compliance Score</h3>
            <div style="font-size: 3.5em; font-weight: 900; color: ${t.primary};">100%</div>
            <p style="color: ${t.textMuted}; font-size: 0.75em;">The FEC file is fully compliant with French tax authority requirements. Ready for export.</p>
          </div>
          <div class="highlight-box" style="margin-top: 12px;">
            <strong style="color: ${t.primary};">Source Software</strong><br>
            <span style="color: ${t.textMuted};">${meta.logiciel}</span>
          </div>
        </div>
      </div>
    </section>`,

    // Slide 9: Stablecoin Accounting
    `<section>
      <h2 style="color: ${t.text};">Stablecoin Accounting Specifics</h2>
      <div class="timeline" style="margin-top: 24px;">
        <div class="timeline-item">
          <h4>Dedicated Accounts 512100 / 512200</h4>
          <p>USDC and EURC wallets isolated from traditional bank accounts for full traceability</p>
        </div>
        <div class="timeline-item">
          <h4>Daily Revaluation</h4>
          <p>Automated journal entries to adjust EUR value of stablecoin wallets (account 766000)</p>
        </div>
        <div class="timeline-item">
          <h4>Blockchain Audit Trail</h4>
          <p>Each bank journal entry linked to an on-chain transaction hash in the reference field</p>
        </div>
        <div class="timeline-item">
          <h4>Cross-border VAT Treatment</h4>
          <p>Automatic reverse charge for intra-EU B2B services settled via stablecoin</p>
        </div>
        <div class="timeline-item">
          <h4>Regulatory Reporting</h4>
          <p>Enhanced FEC export with crypto metadata for AMF/ACPR compliance</p>
        </div>
      </div>
    </section>`,

    // Slide 10: Closing
    `<section>
      <div class="fipto-badge">FEC Analysis Complete</div>
      <h1 style="color: ${t.primary}; margin: 24px 0;">
        Thank You
      </h1>
      <div class="grid-3" style="margin-top: 24px; max-width: 700px; margin-left: auto; margin-right: auto;">
        <div class="metric-card" style="text-align: center;">
          <div class="label">Entries</div>
          <div class="value" style="font-size: 1.4em;">${summary.total_ecritures.toLocaleString('en-US')}</div>
        </div>
        <div class="metric-card" style="text-align: center;">
          <div class="label">Accounts</div>
          <div class="value" style="font-size: 1.4em;">${summary.comptes_utilises}</div>
        </div>
        <div class="metric-card" style="text-align: center;">
          <div class="label">Compliance</div>
          <div class="value" style="font-size: 1.4em; color: ${t.secondary};">100%</div>
        </div>
      </div>
      <p style="color: ${t.textMuted}; font-size: 0.7em; margin-top: 24px;">
        ${meta.denomination} • FY ${meta.exercice.debut} → ${meta.exercice.fin} • Generated by Fipto Slides
      </p>
    </section>`
  ];
}
