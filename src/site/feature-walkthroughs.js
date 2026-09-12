function pageDocument({ title, body, script = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    @font-face { font-family: Instrument; src: url("../assets/instrument-sans-latin-wght-normal.woff2") format("woff2"); font-weight: 100 900; font-style: normal; font-display: swap; }
    :root { color-scheme: light; background: #f3f0e8; color: #111318; font-family: Instrument, ui-sans-serif, system-ui, sans-serif; font-synthesis: none; }
    * { box-sizing: border-box; }
    body { min-width: 0; min-height: 100vh; margin: 0; background: #f3f0e8; }
    button { font: inherit; }
    button:focus-visible { outline: 3px solid #1748d5; outline-offset: 3px; }
    ${body.css}
  </style>
</head>
<body>
  ${body.html}
  <script>${script}\nwindow.__GAMMA_READY__ = true;</script>
</body>
</html>`;
}

/**
 * A self-contained sample service, shown as the content of Gamma's browser
 * feature. It deliberately demonstrates page navigation without reaching a
 * third-party site or claiming access to a user's browser session.
 */
export function renderBrowserWalkthrough() {
  return pageDocument({
    title: 'Gamma Presenter browser walkthrough',
    body: {
      css: `
        #gamma-browser-walkthrough { height: min(100vh, 720px); padding: 34px 40px 30px; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: 20px; }
        .bw-intro { display: flex; align-items: end; justify-content: space-between; gap: 28px; }
        .bw-intro h1 { max-width: 25ch; margin: 0; font-size: 32px; line-height: 1.08; letter-spacing: -.035em; }
        .bw-intro p { max-width: 48ch; margin: 0; color: #62646b; font-size: 14px; line-height: 1.5; }
        .bw-session { min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr); border: 1px solid #111318; background: #fbf9f3; }
        .bw-browserbar { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px; align-items: center; min-height: 58px; padding: 10px 14px; border-bottom: 1px solid #cfc9bd; background: #f3f0e8; }
        .bw-mark { display: inline-flex; align-items: center; gap: 9px; font-size: 12px; font-weight: 800; white-space: nowrap; }
        .bw-mark svg { width: 18px; height: 18px; color: #1748d5; }
        .bw-address { min-width: 0; display: flex; align-items: center; gap: 9px; height: 36px; padding: 0 12px; border: 1px solid #cfc9bd; border-radius: 4px; background: #fff; color: #62646b; font: 600 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .bw-address svg { flex: none; width: 14px; height: 14px; color: #06745f; }
        .bw-address span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bw-state { color: #1748d5; font-size: 12px; font-weight: 800; white-space: nowrap; }
        .bw-site { min-height: 0; display: grid; grid-template-columns: 218px minmax(0, 1fr); background: #fff; }
        .bw-nav { padding: 23px 18px; border-right: 1px solid #cfc9bd; background: #fbf9f3; }
        .bw-nav strong { display: block; margin-bottom: 24px; font-size: 14px; letter-spacing: -.02em; }
        .bw-tabs { display: grid; gap: 6px; }
        .bw-tab { width: 100%; min-height: 43px; padding: 0 12px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: #111318; text-align: left; font-size: 14px; font-weight: 750; cursor: pointer; }
        .bw-tab:hover { background: #f3f0e8; color: #1748d5; }
        .bw-tab[aria-selected="true"] { border-color: #1748d5; background: #1748d5; color: #fff; }
        .bw-nav-note { margin: 28px 0 0; color: #62646b; font-size: 12px; line-height: 1.48; }
        .bw-content { min-width: 0; padding: 29px 34px; overflow: auto; }
        .bw-content-head { display: flex; align-items: start; justify-content: space-between; gap: 22px; }
        .bw-content h2 { margin: 0; font-size: 24px; letter-spacing: -.035em; line-height: 1.1; }
        .bw-content-head p { margin: 7px 0 0; color: #62646b; font-size: 14px; }
        .bw-filter { min-height: 37px; padding: 0 12px; border: 1px solid #cfc9bd; border-radius: 4px; color: #62646b; background: #fbf9f3; font-size: 12px; }
        .bw-overview { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(230px, .8fr); gap: 24px; margin-top: 27px; }
        .bw-chart { min-height: 258px; padding: 22px; border-top: 2px solid #1748d5; background: #fbf9f3; }
        .bw-chart-header { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
        .bw-chart h3,.bw-summary h3 { margin: 0; font-size: 14px; }
        .bw-chart small { color: #62646b; font-size: 12px; }
        .bw-bars { height: 183px; display: flex; align-items: end; gap: 22px; margin-top: 18px; padding: 0 5px 21px; border-bottom: 1px solid #cfc9bd; }
        .bw-bar { flex: 1; min-width: 45px; height: 100%; display: grid; grid-template-rows: 1fr auto; align-items: end; gap: 8px; color: #62646b; text-align: center; font-size: 11px; font-weight: 750; }
        .bw-bar i { display: block; width: 100%; background: #1748d5; min-height: 22px; }
        .bw-bar:nth-child(2) i { background: #5e46a8; }.bw-bar:nth-child(3) i { background: #1748d5; }.bw-bar:nth-child(4) i { background: #06745f; }.bw-bar:nth-child(5) i { background: #1748d5; }
        .bw-summary { display: grid; align-content: start; gap: 0; border-top: 2px solid #111318; }
        .bw-summary h3 { padding: 19px 0; border-bottom: 1px solid #cfc9bd; }
        .bw-metric { padding: 16px 0; border-bottom: 1px solid #cfc9bd; }.bw-metric span { display: block; color: #62646b; font-size: 12px; }.bw-metric b { display: block; margin-top: 4px; font-size: 24px; letter-spacing: -.04em; }
        .bw-requests { display: none; margin-top: 27px; border-top: 2px solid #1748d5; }.bw-requests table { width: 100%; border-collapse: collapse; font-size: 14px; }.bw-requests th,.bw-requests td { padding: 16px 10px; border-bottom: 1px solid #cfc9bd; text-align: left; }.bw-requests th { color: #62646b; font-size: 12px; }.bw-status { display: inline-flex; padding: 4px 8px; border-radius: 999px; background: #f3f0e8; color: #06745f; font-size: 12px; font-weight: 800; }.bw-status.review { background: #f3f0e8; color: #1748d5; }
        #gamma-browser-walkthrough[data-page="requests"] .bw-overview { display: none; } #gamma-browser-walkthrough[data-page="requests"] .bw-requests { display: block; }
        .bw-legend { display: flex; align-items: center; gap: 9px; color: #62646b; font-size: 12px; }.bw-legend i { width: 9px; height: 9px; background: #1748d5; }
        @media (max-width: 760px) { #gamma-browser-walkthrough { height:100vh;padding:16px;grid-template-rows:minmax(0,1fr) auto;gap:12px }.bw-intro{display:none}.bw-site{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.bw-nav{padding:12px;border-right:0;border-bottom:1px solid #cfc9bd}.bw-nav strong,.bw-nav-note{display:none}.bw-tabs{grid-template-columns:1fr 1fr}.bw-tab{min-height:44px}.bw-content{padding:16px}.bw-content-head{flex-wrap:wrap;gap:12px}.bw-filter{min-height:44px}.bw-overview{grid-template-columns:1fr;gap:20px}.bw-browserbar{grid-template-columns:minmax(0,1fr);padding:10px}.bw-mark,.bw-state{display:none}.bw-chart{padding:12px}.bw-chart-header{display:block}.bw-bars{gap:10px}.bw-bar{min-width:0}.bw-summary{grid-template-columns:1fr 1fr;gap:12px}.bw-summary h3{grid-column:1/-1;padding:8px 0}.bw-metric{padding:8px 0}.bw-requests{overflow:auto}.bw-legend{font-size:12px;line-height:1.4} }
      `,
      html: `<main id="gamma-browser-walkthrough" data-page="overview" aria-label="Browser walkthrough">
        <header class="bw-intro"><div><h1>Bring a useful web surface into the story.</h1></div><p>This self-contained service dashboard is an interactive sample website. It never opens an external account or sends a request.</p></header>
        <section class="bw-session" aria-label="Interactive sample website">
          <div class="bw-browserbar"><span class="bw-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"></rect><path d="M3 9h18M7 6.5h.01M10 6.5h.01"></path></svg>Browser session</span><div class="bw-address"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg><span data-address>demo.local/overview</span></div><span class="bw-state">Local sample</span></div>
          <div class="bw-site"><aside class="bw-nav"><strong>Relay service</strong><div class="bw-tabs" role="tablist" aria-label="Sample website pages"><button class="bw-tab" type="button" role="tab" aria-selected="true" data-page="overview">Overview</button><button class="bw-tab" type="button" role="tab" aria-selected="false" data-page="requests">Requests</button></div><p class="bw-nav-note">Navigate the sample pages to see how a live web surface can support a presentation.</p></aside>
            <section class="bw-content"><div class="bw-content-head"><div><h2 data-page-title>Service overview</h2><p data-page-copy>Healthy traffic, visible without leaving the story.</p></div><button class="bw-filter" type="button" data-refresh>Refresh sample</button></div>
              <div class="bw-overview"><section class="bw-chart" aria-label="Weekly request chart"><div class="bw-chart-header"><h3>Requests, this week</h3><small>Illustrative traffic</small></div><div class="bw-bars" aria-hidden="true"><span class="bw-bar"><i style="height:38%"></i>Mon</span><span class="bw-bar"><i style="height:64%"></i>Tue</span><span class="bw-bar"><i style="height:51%"></i>Wed</span><span class="bw-bar"><i style="height:84%"></i>Thu</span><span class="bw-bar"><i style="height:70%"></i>Fri</span></div></section><aside class="bw-summary"><h3>Today</h3><div class="bw-metric"><span>Completed requests</span><b>1,284</b></div><div class="bw-metric"><span>Median response</span><b>184 ms</b></div><div class="bw-metric"><span>Availability</span><b>99.98%</b></div></aside></div>
              <div class="bw-requests" aria-label="Request list"><table><thead><tr><th>Request</th><th>Route</th><th>Response</th><th>Status</th></tr></thead><tbody><tr><td>req_1048</td><td>/reports/daily</td><td>162 ms</td><td><span class="bw-status">Completed</span></td></tr><tr><td>req_1047</td><td>/briefing/next</td><td>189 ms</td><td><span class="bw-status">Completed</span></td></tr><tr><td>req_1046</td><td>/slides/live</td><td>241 ms</td><td><span class="bw-status review">Reviewing</span></td></tr></tbody></table></div>
            </section></div>
        </section>
        <footer class="bw-legend"><i aria-hidden="true"></i>Interactive sample website <span aria-hidden="true">·</span> desktop uses an isolated browser</footer>
      </main>`,
    },
    script: `(() => { const root = document.getElementById('gamma-browser-walkthrough'); const address = root.querySelector('[data-address]'); const title = root.querySelector('[data-page-title]'); const copy = root.querySelector('[data-page-copy]'); const pages = { overview: ['demo.local/overview', 'Service overview', 'Healthy traffic, visible without leaving the story.'], requests: ['demo.local/requests', 'Recent requests', 'A readable activity trail for the audience and operator.'] }; const select = page => { root.dataset.page = page; const [url, heading, detail] = pages[page]; address.textContent = url; title.textContent = heading; copy.textContent = detail; root.querySelectorAll('.bw-tab').forEach(button => button.setAttribute('aria-selected', String(button.dataset.page === page))); }; root.querySelectorAll('.bw-tab').forEach(button => button.addEventListener('click', () => select(button.dataset.page))); root.querySelector('[data-refresh]').addEventListener('click', event => { event.currentTarget.textContent = 'Updated just now'; window.setTimeout(() => { event.currentTarget.textContent = 'Refresh sample'; }, 1300); }); })();`,
  });
}

/**
 * An explicitly simulated request lifecycle next to the real, packaged Author
 * capture. The simulation is deliberately local UI: it does not imply a live
 * MCP connection, a running CLI, or a model invocation.
 */
export function renderAiWalkthrough() {
  return pageDocument({
    title: 'Gamma Presenter AI approval walkthrough',
    body: {
      css: `
        #gamma-ai-walkthrough { height: min(100vh, 720px); padding: 34px 40px 30px; display: grid; grid-template-rows: auto minmax(0,1fr) auto; gap: 20px; }
        .aw-intro { display: flex; align-items: end; justify-content: space-between; gap: 28px; }.aw-intro h1 { max-width: 27ch; margin: 0; font-size: 32px; line-height: 1.08; letter-spacing: -.035em; }.aw-intro p { max-width: 51ch; margin: 0; color: #62646b; font-size: 14px; line-height: 1.5; }
        .aw-layout { min-height: 0; display: grid; grid-template-columns: minmax(0,.54fr) minmax(0,1fr); gap: 24px; }.aw-capture { min-height: 0; margin: 0; display: grid; grid-template-rows: minmax(0,1fr) auto; border: 1px solid #111318; background: #050912; overflow: hidden; }.aw-capture img { display: block; width: 100%; height: 100%; min-height: 0; object-fit: cover; object-position: 100% center; }.aw-capture figcaption { padding: 9px 12px; color: #111318; background: #f3f0e8; font-size: 12px; line-height: 1.2; }
        .aw-flow { min-height: 0; display: grid; grid-template-rows: auto auto minmax(0,1fr) auto; border-top: 2px solid #1748d5; }.aw-flow h2 { margin: 18px 0 0; font-size: 24px; letter-spacing: -.03em; }.aw-steps { display: flex; gap: 10px; margin: 18px 0 16px; padding: 0; list-style: none; }.aw-steps li { flex: 1; min-width: 0; padding-top: 9px; border-top: 1px solid #cfc9bd; color: #62646b; font-size: 12px; font-weight: 750; line-height: 1.25; }.aw-steps li[aria-current="step"] { border-color: #1748d5; color: #1748d5; }
        .aw-request { min-height: 0; padding: 20px 0; border-top: 1px solid #cfc9bd; border-bottom: 1px solid #cfc9bd; }.aw-label { margin: 0 0 10px; color: #62646b; font-size: 12px; font-weight: 800; }.aw-request h3 { margin: 0; font-size: 20px; letter-spacing: -.025em; }.aw-request p { max-width: 39ch; margin: 8px 0 0; color: #62646b; font-size: 14px; line-height: 1.5; }.aw-outcome { display: none; margin-top: 16px; padding: 12px; border: 1px solid #cfc9bd; color: #1748d5; background: #f3f0e8; font-size: 12px; font-weight: 750; }.aw-outcome.is-visible { display: block; }.aw-outcome.rejected { border-color: #ff5a1f; color: #111318; background: #f3f0e8; }
        .aw-actions { display: flex; flex-wrap: wrap; gap: 10px; padding-top: 18px; }.aw-actions button { min-height: 43px; padding: 0 14px; border: 1px solid #1748d5; border-radius: 4px; background: #1748d5; color: #fff; font-size: 14px; font-weight: 800; cursor: pointer; }.aw-actions button:hover { background: #1748d5; }.aw-actions button[data-action="reject"] { border-color: #111318; background: transparent; color: #111318; }.aw-actions button:disabled { opacity: .42; cursor: not-allowed; }
        .aw-disclosure { margin: 0; color: #62646b; font-size: 12px; line-height: 1.45; }.aw-disclosure strong { color: #111318; }.aw-disclosure span { color: #1748d5; font-weight: 800; }
        @media (max-width: 760px) { #gamma-ai-walkthrough{height:100vh;padding:16px;grid-template-rows:minmax(0,1fr) auto;gap:16px}.aw-intro{display:none}.aw-layout{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) 230px;gap:16px}.aw-capture{grid-row:2;min-height:0}.aw-capture img{object-fit:contain}.aw-flow{grid-row:1;min-height:0}.aw-flow h2{font-size:24px}.aw-request{padding:14px 0}.aw-actions{gap:8px;padding-top:12px}.aw-actions button{min-height:44px;padding:0 10px}.aw-legend{font-size:12px;line-height:1.4} }
      `,
      html: `<main id="gamma-ai-walkthrough" data-state="idle" aria-label="AI approval walkthrough">
        <header class="aw-intro"><h1>AI can propose. The operator decides.</h1><p>See the request boundary as a short, inspectable workflow—not an invisible automation claim.</p></header>
        <section class="aw-layout"><figure class="aw-capture"><img src="../assets/gamma-presenter-control-room.png" alt="Actual Gamma Presenter control room showing the live action approvals and local AI co-pilot panels."><figcaption>Actual control-room detail.</figcaption></figure>
          <section class="aw-flow" aria-labelledby="aw-heading"><h2 id="aw-heading">A visible approval path</h2><ol class="aw-steps"><li aria-current="step">Ask Claude / Codex</li><li>Review the request</li><li>Approve or reject</li></ol><div class="aw-request" aria-live="polite"><p class="aw-label" data-request-label>SIMULATION READY</p><h3 data-request-title>Choose a local co-pilot request.</h3><p data-request-copy>Start the walkthrough to inspect a proposed action. Nothing here connects to MCP, a CLI, or an LLM.</p><div class="aw-outcome" data-outcome></div></div><div class="aw-actions"><button type="button" data-action="ask">Ask Claude / Codex</button><button type="button" data-action="approve" disabled>Approve</button><button type="button" data-action="reject" disabled>Reject</button></div></section>
        </section>
        <p class="aw-disclosure"><strong>Actual product capture at left.</strong> <span>Simulation at right.</span> It demonstrates the approval interaction only; no live request is sent.</p>
      </main>`,
    },
    script: `(() => { const root = document.getElementById('gamma-ai-walkthrough'); const label = root.querySelector('[data-request-label]'); const title = root.querySelector('[data-request-title]'); const copy = root.querySelector('[data-request-copy]'); const outcome = root.querySelector('[data-outcome]'); const ask = root.querySelector('[data-action="ask"]'); const approve = root.querySelector('[data-action="approve"]'); const reject = root.querySelector('[data-action="reject"]'); const steps = [...root.querySelectorAll('.aw-steps li')]; const setStep = index => steps.forEach((step, current) => current === index ? step.setAttribute('aria-current', 'step') : step.removeAttribute('aria-current')); const resetOutcome = () => { outcome.className = 'aw-outcome'; outcome.textContent = ''; }; const offerAnotherRequest = () => { ask.disabled = false; ask.textContent = 'Ask another request'; }; ask.addEventListener('click', () => { root.dataset.state = 'review'; label.textContent = 'SIMULATED REQUEST'; title.textContent = 'Open Presenter Studio'; copy.textContent = 'A local co-pilot proposes opening the recording controls. The presenter can inspect the named action before deciding.'; ask.disabled = true; approve.disabled = false; reject.disabled = false; resetOutcome(); setStep(1); }); approve.addEventListener('click', () => { root.dataset.state = 'approved'; label.textContent = 'SIMULATION APPROVED'; title.textContent = 'Presenter decision recorded'; copy.textContent = 'This sample ends at the human decision. No application action is dispatched from this walkthrough.'; outcome.textContent = 'Approved in this simulation only.'; outcome.className = 'aw-outcome is-visible'; approve.disabled = true; reject.disabled = true; offerAnotherRequest(); setStep(2); }); reject.addEventListener('click', () => { root.dataset.state = 'rejected'; label.textContent = 'SIMULATION REJECTED'; title.textContent = 'Request kept out of the room'; copy.textContent = 'The presenter declined the proposed action. No application action is dispatched from this walkthrough.'; outcome.textContent = 'Rejected in this simulation only.'; outcome.className = 'aw-outcome is-visible rejected'; approve.disabled = true; reject.disabled = true; offerAnotherRequest(); setStep(2); }); })();`,
  });
}
