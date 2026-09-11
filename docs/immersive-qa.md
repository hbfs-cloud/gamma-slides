# Immersive data presentations — historical review and validation

**Status: visually rejected by the user.** The technical results below are historical evidence, not visual approval. A blind review scored this iteration 3/10. The replacement and independent verdict are recorded in [cinematic-qa.md](cinematic-qa.md).

Date: September 8, 2026. Scope: reusable `chart / immersive` and `presentations/immersive-data.yaml`. Ordinary chart layouts retain their existing behavior.

## Delivered behavior

The implementation replaces the wire cube and equipment toolbar with a larger open data stage, comparison rail, links between matching column tops, scatter projection lines, and a lower control strip. Overview/Profile/Top presets animate for 650ms; initial camera entrance is 950ms. Motion is bounded, snaps under reduced motion, and cancels on direct manipulation.

- Orthographic WebGL columns map category, value, and series to three axes; XYZ scatter plots use three supplied numbers.
- Drag, keyboard orbit, camera controls, observation selection, and a visible marker work alongside SVG and semantic table views.
- One shared canvas/context, demand-driven frames, bounded data, and a two-megapixel allocation ceiling; no continuously running GPU animation.
- Offline HTML with existing ECharts theme colors. Missing/lost WebGL falls back to SVG; PDF/frame exports use SVG.

Adversarial findings fixed: comparison periods remain visible on mobile; dragging clears a selected preset; cancellation resets exposed motion state. Playwright verifies the +185.7% Platforms comparison, camera settling, and idle-frame count. The final detector returned `[]`; no ignore was introduced.

## Reproducible checks

```bash
bun run test
bun run test:browser
bun bin/gamma-slides.js qa -f output/immersive-data.html -o output/immersive-qa/live --theme signal-room --live
bun bin/gamma-slides.js qa -f output/immersive-data.html -o output/immersive-qa/export --theme signal-room
bun bin/gamma-slides.js export -f output/immersive-data.html -o output/immersive-data.pdf --theme signal-room
git diff --check
```

- 41 unit tests pass, including data preservation, missing/ambiguous input, large coordinates, escaping, and fallback provenance.
- 7 Playwright scenarios pass: GPU geometry/error state, camera/keyboard, exact inspector/table values, SVG switching, live themes, idle frame stability, shared canvas, navigation, reduced motion, no GPU, context loss, print, `print-pdf`, and export.
- Captures cover three themes, 1440×900 desktop, 390×844 phone, and 768×1024 tablet after finite animations settle.
- Live browser checks observed zero remote HTTP requests and zero page errors. CLI PDF export makes three pages; live/export QA both report three slides, zero blockers, and zero warnings.

Evidence is under `output/immersive-qa/`: `playwright.json`, captures, `live/report.json`, `export/report.json`, and contact sheets. Generated HTML: `output/immersive-data.html`.

## Practical limits

Native selector/table, focus, keyboard controls, and motion fallback are tested; this is not full screen-reader/WCAG certification. Idle frames, shared context, and bounded allocation are tested; no physical midrange-device benchmark is claimed. Long category names may be ellipsized in the plot, but complete names/values remain in the selector and Values table. Flat scatter projects X/Y; Z stays in inspector/table. Spatial overlap can hide marks, so the selector is the reliable exact-observation path. Unsupported chart families/missing data retain SVG.
