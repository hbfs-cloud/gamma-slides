# Flagship — September 9, 2026 review

Primary artifact: `output/flagship-demo.html`, generated from `presentations/flagship.yaml`. The deck has 38 slides, 37 charts, 28 visualization families, and six chapters. All data is explicitly illustrative.

## Presentation and rendering

Twenty slides have content-specific composition: brief, scorecard, large financial table, chart evidence, asymmetric analysis, control register, strategic sequence, roadmap, chapter, and decisions. Archivo carries data and ordinary headings; Source Serif 4 distinguishes briefs and decisions. Styles and adaptations are recorded in `DESIGN.md` and `.impeccable/design.json`.

The opening draws five Three.js ribbons in WebGL. Their widths use a common scale from FY24/FY25 revenue: $8.3m then $16.2m. Each segment is selectable and retains exact values. The lighting transition is finite; no animation runs at rest.

Four scenes use D3 for scale/layout and Pixi.js/WebGPU for actual data rendering: revenue (9), 2D comparables (21), risks (27), and network (35). Evidence checks a real context, graphics objects, and non-empty pixels; loading a library is not GPU validation. Comparables (21) open in Three.js/WebGL, with growth, valuation multiple, and gross margin on measured axes. Names remain near spheres, selected values near controls, including on phones. Reset restores the initial view. Other charts use ECharts/SVG; this is not all-WebGPU rendering.

## Reading and interaction

Mobile slides use real phone width and vertical scrolling. **More below** reserves 44px above navigation. Tables retain headers/values and the income statement retains its $M unit. Briefs and decisions expose principal signals on the first screen.

All native controls work without unintentionally advancing Reveal. GPU scenes free resources off-slide, honor reduced motion, and offer SVG/full-data fallbacks for no/lost GPU, print, and export. Three.js resolution uses actual displayed size after Reveal transforms.

## Final validation

- 48 unit tests passed: financial data, totals, proportional scale, schema, and generation.
- 40 Playwright scenarios passed in one batch: no failure, skip, or flaky test. Command: `bunx playwright test qa/flagship-*.spec.js`.
- Real traversal of all 38 slides from fresh `file://`: no forced theme or artificial panel removal; desktop keyboard and phone `isMobile`, `hasTouch`, DPR 2.
- 38 desktop captures at 1440×900 and 76 mobile captures at 390×844, including continuations; additional 1920×1080, 3D, and selection states.
- 535 desktop and 572 mobile HTML contrast checks with transparent compositing. No checked fault or JavaScript error in complete traversals. SVG text received targeted visual checks; HTML checks do not cover every canvas pixel.
- Exact source values, real WebGPU/WebGL rendering, theme/width changes, keyboard, touch, GPU loss, print, extreme rotation framing, and no idle continuous render were tested.
- Export CLI QA: 38 slides, no blocker and no warning. GPU scenes and SVG fallbacks are listed in `output/flagship-review/export/report.json`.

## Independent reviews and limits

The visual review examined both 38-slide boards, readable individual captures, mobile continuations, and 1920px views. It required six corrections: mobile diagram identities, named scenarios, wider 3D framing, complete legends/labels, mobile financial unit, and documentation of the real system. The replacement captures were marked `ship`; those six items were resolved without a material regression found in that pass. The verdict covers those points only. Final record: `.impeccable/review/flagship-finish-review.md`.

A contrarian code review identified clipping of three spheres at permitted rotation limits. Dynamic framing corrected it; the dedicated test now checks all five spheres, their labels, and no collision at keyboard/drag extremes. No other confirmed blocker was found in the reviewed scope. Record: `.impeccable/review/flagship-contrarian-code.md`.

Local gallery: `output/flagship-review/index.html`. Final reports include `browser-final.json`, manifests, GPU and revenue manifests. The main file is copied unchanged from the exact tested input; `artifact.json` records SHA-256 identities and `main-file-smoke.json` checks final-path opening.

Coverage is Chrome desktop plus touch-mobile emulation. No physical phone or Safari run is claimed. Visual review, correction verdict, and green tests do not constitute a universal aesthetic or device certification.
