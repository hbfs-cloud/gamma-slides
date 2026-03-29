// Narration scripts per template - each entry = one slide
// Duration will be auto-calculated from TTS output length

export const narrations = {
  'revenue-model': [
    // Slide 1: Title
    `Welcome to Fipto's Revenue Model presentation for fiscal year 2025. Fipto operates a hybrid transaction-based and SaaS model, powering cross-border payments through stablecoin rails. Let's walk through our five revenue streams, unit economics, and growth trajectory.`,

    // Slide 2: Overview
    `Here's the big picture. Fipto generated over 16 million euros in revenue in FY25, nearly doubling year over year with 95% growth. Our gross margin sits at 72%, placing us in the top quartile of fintech companies. With an LTV to CAC ratio of 8.2x and net revenue retention of 135%, we're demonstrating exceptional capital efficiency and strong product-market fit.`,

    // Slide 3: Revenue Streams
    `Fipto's revenue comes from five distinct streams. Cross-border transfer fees are our largest at 8.4 million, representing 52% of total revenue. FX and stablecoin spread contributes 3.15 million. Our Platform SaaS subscriptions add 2.4 million of recurring revenue. Treasury yield on our stablecoin float generates 1.2 million, and compliance services round out the mix at 940 thousand euros.`,

    // Slide 4: Cross-border Deep Dive
    `Let's deep dive into our primary revenue driver: cross-border transfer fees. We processed over 42,000 transfers year to date, with an average transfer size of 12,500 euros and an average fee rate of 1.6%. The math is straightforward: transfers times average size times fee rate equals 8.4 million euros. This stream alone accounts for 52% of total revenue and grew 100% year over year, making it our primary growth engine.`,

    // Slide 5: Quarterly
    `Looking at our quarterly trajectory, we see consistent acceleration. Q1 started at 3.2 million, ramping to 4.9 million in Q4. That's roughly 15% quarter-over-quarter growth sustained throughout the year, driven by both new client acquisition and expanding volume from existing clients.`,

    // Slide 6: Unit Economics
    `Our unit economics tell a compelling story. Customer acquisition cost is just 1,200 euros, while lifetime value reaches nearly 10,000. That's an 8.2x LTV to CAC ratio with a payback period of only 4.2 months. Each client generates nearly 16,000 euros in annual revenue and averages 41 transactions per month, indicating deep platform engagement.`,

    // Slide 7: Cohort Analysis
    `Our cohort data validates the model's durability. Client retention holds at 72% at month 12, which is strong for B2B fintech. But here's the key insight: revenue expansion from existing clients reaches 185% at the 12-month mark. This means the clients who stay are transacting significantly more over time, driving our net revenue retention to 135%.`,

    // Slide 8: YoY Growth
    `Breaking down year-over-year growth by stream, every line of business is accelerating. Cross-border fees doubled. Compliance services grew fastest at 124%. Platform SaaS matched the doubling pace. FX spread grew 75%, and treasury yield increased 85%. The breadth of growth across all five streams reduces concentration risk.`,

    // Slide 9: Growth Levers
    `Looking ahead to FY26, we're targeting 28 million euros in revenue, a 74% increase. Five key levers will get us there: geographic expansion into Latin America and Southeast Asia, support for new stablecoins including USDT and PYUSD, enterprise upselling to drive ARPC higher, treasury optimization through T-plus-zero settlement, and embedded compliance services for partner fintechs. We're also targeting 78% gross margin and over 200 enterprise clients.`,

    // Slide 10: Closing
    `Thank you for reviewing Fipto's revenue model. With nearly 95% year-over-year growth, 135% net revenue retention, and clear expansion levers ahead, Fipto is well-positioned to become the leading infrastructure for stablecoin-powered cross-border payments. We look forward to your questions.`
  ],

  'fec': [
    `Welcome to the General Ledger Export File analysis for Fipto SAS, fiscal year 2025. This presentation covers our FEC file, which contains over 14,800 journal entries across 247 accounts and 5 journals. Let's review the key findings.`,

    `Starting with our key performance metrics. Total transaction volume reached 28.4 million euros, up 34% year to date. Notably, stablecoin volume hit 6.3 million, surging 128% as our cross-border payments scaled. Service revenue stands at 8.4 million, with cross-border commissions contributing 3.15 million and FX gains adding 285 thousand. The stablecoin ratio now represents 22% of our total flows.`,

    `Here's our trial balance for balance sheet accounts. You can see the capital structure with 5 million in share capital and 2 million in bank loans. Accounts receivable show a positive balance of 1.3 million, while payables stand at 650 thousand, reflecting healthy working capital management. VAT positions are clearly tracked with collected and deductible amounts properly segregated.`,

    `A unique feature of Fipto's treasury is the stablecoin wallet structure. We maintain three distinct cash positions: a traditional EUR bank account at 3.3 million, a USDC wallet at 1.4 million, and a EURC wallet at 600 thousand. Together, stablecoin wallets represent 37.7% of total cash, perfectly aligned with our cross-border payment strategy.`,

    `Moving to the income statement. Total revenue combines service revenue of 8.4 million and cross-border commissions of 3.15 million, for a total of 11.55 million euros. Operating expenses total 5.92 million, dominated by personnel costs at 3.2 million and payroll taxes at 1.44 million. This yields a strong operating income of 5.9 million euros.`,

    `This slide shows a sample of actual journal entries from our FEC file. You can see the typical flow: a sales invoice creates a receivable against revenue and VAT, a bank settlement records USDC received against the receivable, and a miscellaneous entry captures FX gains from wallet revaluation. Each entry is fully traceable with sequential document numbers.`,

    `Looking at the distribution by journal type, bank entries are the most frequent at over 5,100, reflecting our high transaction volume. Sales entries follow at 4,200, with purchases at 2,800. Miscellaneous entries handle revaluations and adjustments, while opening entries capture the balance carried forward.`,

    `Our FEC compliance score is 100%. All five critical checks pass: debit equals credit at 28.45 million, all 18 required fields are present, chronological sequencing is unbroken, document numbering is continuous within each journal, and all dates conform to ISO 8601 format. The file is ready for submission to French tax authorities.`,

    `Fipto's accounting introduces several stablecoin-specific innovations. We maintain dedicated sub-accounts for each wallet type, enabling full auditability. Daily revaluation entries automatically adjust EUR values. Every bank entry links to an on-chain transaction hash, creating a blockchain audit trail. Cross-border VAT is handled via automatic reverse charge, and our FEC export includes enriched crypto metadata for regulatory compliance.`,

    `Thank you for reviewing the FEC analysis. With over 14,800 entries, 247 accounts, and a perfect compliance score, Fipto's financial records are audit-ready and fully transparent. The integration of stablecoin accounting within the standard French FEC framework demonstrates our commitment to regulatory excellence.`
  ],

  'consolidation': [
    `Welcome to the Fipto Group consolidated financial statements for fiscal year 2025. This presentation covers our full consolidation across 5 entities in 5 countries, including all intercompany eliminations, currency translations, and minority interest allocations.`,

    `Let's start with our consolidation scope. The group is led by Fipto SAS in France, with wholly-owned subsidiaries in the UK and Singapore. We hold 80% of Fipto UAE and 60% of Fipto Latam in Chile. All entities are fully consolidated. The parent company leads in revenue at 8.4 million, followed by the UK at 3.2 million and Singapore at 2.8 million.`,

    `Breaking down revenue by entity, France represents the largest share at 49%, followed by the UK at 19% and Singapore at 16%. The UAE contributes 11% and Latam 5%. This geographic diversification across five countries and four currency zones provides natural risk hedging and access to key cross-border payment corridors.`,

    `Intercompany eliminations total 1.11 million euros. The largest flow is management fees from the parent to the UK at 480 thousand, followed by license fees to Singapore at 320 thousand. Referral commissions from UK to UAE and tech platform fees to Latam complete the picture. After eliminations, consolidated revenue stands at 16 million euros compared to 17.15 million aggregate.`,

    `The consolidated P and L shows strong profitability. Revenue of 16 million yields a gross profit of 9.6 million, representing a 60% gross margin. EBITDA reaches 4 million at a 25% margin, well above our 20% target. After depreciation, financial costs, and taxes, group net income comes in at 2.06 million, a healthy 12.8% net margin. Minority interests account for 120 thousand.`,

    `Our consolidated balance sheet totals 17.85 million euros. On the asset side, non-current assets of 6.85 million are primarily intangible, reflecting our technology platform. Current assets of 11 million include 5.2 million in cash and 2 million in stablecoin wallets. On the liabilities side, shareholders equity stands at 8.5 million with a well-structured debt profile of 3.2 million long-term and 1.2 million short-term.`,

    `Currency translation had a net positive impact of 67 thousand euros. The British pound strengthened against the euro, contributing a 77 thousand positive impact. The Singapore dollar weakened slightly with a negative 13 thousand impact. The UAE dirham provided a modest 6 thousand gain, while the Chilean peso depreciated, creating a small 3 thousand negative. Our stablecoin-based intercompany flows significantly reduce overall FX exposure.`,

    `Our consolidated ratios demonstrate strong financial health. The 60% gross margin and 25% EBITDA margin both exceed targets. Net margin stands at 12.8%. Gearing is well-controlled at 51.8%, and the current ratio of 2.01x provides comfortable liquidity headroom. The stablecoin to cash ratio of 27.8% continues to grow as we shift more intercompany flows to stablecoin rails.`,

    `Our consolidation process follows five rigorous steps. First, we collect reporting packages from each subsidiary with chart of accounts mapping. Second, we apply homogeneity adjustments to align depreciation, provisions, and crypto cut-off rules. Third, we translate currencies using ECB and stablecoin rates. Fourth, we eliminate intercompany flows, auto-reconciled via blockchain. Finally, we allocate minority interests for UAE and Latam.`,

    `In summary, the Fipto Group delivered consolidated revenue of 16 million euros, EBITDA of 4 million, and net income of 2.06 million, with total assets of 17.85 million across 5 entities. Our stablecoin-native approach to intercompany flows and treasury management creates a competitive advantage in both operational efficiency and financial transparency. Thank you.`
  ]
};
