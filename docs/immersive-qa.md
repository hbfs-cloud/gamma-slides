# Immersive data presentations — historical review and validation

**Status: visually rejected by the user.** The technical results below are historical evidence, not visual approval. A fresh blind review scored this iteration 3/10. The replacement and its independent verdict are recorded in [cinematic-qa.md](cinematic-qa.md).

Date: 2026-09-08. Scope: the reusable `chart / immersive` variant and `presentations/immersive-data.yaml`. The selected direction is **immersive data**, following the user's choice. Ordinary chart layouts retain their existing behavior.

## Delivered behavior

The second visual pass responds to the user's assessment that the first version was too restrained. It replaces the wire cube and upper equipment toolbar with a larger open data stage, a comparison rail, links between corresponding column tops, scatter projection lines, and a lower control strip. Overview/Profile/Top presets animate for 650ms; the initial camera entrance lasts 950ms. These are bounded movements, with reduced-motion snapping and cancellation on direct manipulation.

The additional adversarial review found three details, all fixed: comparison periods must remain visible on mobile; dragging clears the selected preset; cancellation resets the exposed motion state. Playwright now verifies the derived +185.7% comparison for the supplied Platforms data, animated camera settling, and the idle frame count after the transition. The detector was rerun explicitly after the hook stopped repeating hints due to its edit-count limit; it again returned `[]`. No ignore was introduced.

- Orthographic WebGL columns map category, value, and series to three axes. XYZ scatter plots use three supplied numeric variables.
- Drag, keyboard orbit, camera controls, observation selection, and a visible selection marker work alongside SVG and semantic table views.
- One shared canvas/context, demand-driven frames, bounded data, and a two-megapixel allocation ceiling. No continuously running GPU animation.
- Offline HTML; no production graphics dependency. Supported theme colors come from the existing ECharts configurations.
- Reduced motion starts in SVG. Unavailable/lost WebGL falls back to SVG. PDF and frame exports use SVG. Small-screen controls escape Reveal's canvas scaling.

## Review provenance

Impeccable's overdrive direction, craft floor, audit criteria, and critique workflow informed the implementation. Two isolated agents reviewed it: Assessment A covered design and usability; Assessment B ran the detector and challenged numerical correctness, lifecycle, and exports. The parent performed browser validation using standalone Playwright/Chromium after the Browser plugin reported no available browser.

The initial design assessment scored the first implementation **26/40** on its heuristic review. This is a baseline, not a final certification. Findings were resolved as follows:

| Finding | Resolution |
|---|---|
| Default framing cut category/axis labels | Reduced initial zoom, aspect-aware projection, label bounds, and separate axis-title placement |
| Series/observation colors changed between SVG and WebGL | Both read the same resolved ECharts colors; legend updates also run in 2D |
| Phone controls shrank with Reveal's slide scale | Responsive stage at ≤900px, 44px controls, stacked inspector, automatic scroll activation disabled for immersive decks |
| “Exact values” rounded observations | Observation formatting preserves supplied numbers; only tick labels round |
| Constant large coordinates divided by zero | Magnitude-aware padding and strictly positive finite ranges |
| Null bar cells silently vanished | Null-containing data retains the standard renderer |
| Fallback lost source and footnote | Supported and unsupported immersive paths retain provenance |
| Clicking the middle of a column did nothing | Selection tests the projected column segment; a visible marker identifies selection |
| Hidden SVG charts restarted narrative timers | Immersive charts are excluded at the narrative entry point |
| Printing could expose an uninitialized flat chart | Print lifecycle initializes SVG; `print-pdf` uses export initialization |

The final static detector returned `[]`. Hook findings about type sizes were resolved by removing the extra axis-title size and documenting scoped spatial typography tokens. **No new rule/file/value suppression was added.** The pre-existing stale `.impeccable/design.json` sidecar was not regenerated as an unrelated repair.

## Reproducible checks

```bash
npm test
npm run test:browser
node bin/gamma-slides.js qa -f output/immersive-data.html -o output/immersive-qa/live --theme signal-room --live
node bin/gamma-slides.js qa -f output/immersive-data.html -o output/immersive-qa/export --theme signal-room
node bin/gamma-slides.js export -f output/immersive-data.html -o output/immersive-data.pdf --theme signal-room
git diff --check
```

- **41 unit tests pass**, including data preservation, missing/ambiguous input, constant large coordinates, script escaping, and fallback provenance.
- **7 Playwright scenarios pass**, covering GPU geometry/error state, camera and keyboard behavior, exact inspector/table values, SVG switching, live theme changes, idle-frame stability, one shared canvas, navigation, reduced motion, no GPU, context loss, ordinary print lifecycle, `print-pdf`, and export.
- Screenshots cover Signal Room, Analyst Proof, Cutting Room, 1440×900 desktop, 390×844 phone, and 768×1024 tablet. Captures wait for finite slide animations to settle.
- Live browser checks observe **zero remote HTTP requests** and **zero page errors** during the exercised flow.
- CLI PDF export produces **three pages**. The primary output is `output/immersive-data.pdf`.
- CLI visual QA passes in **live and export modes: three slides, zero blockers, zero warnings** in each report.
- CLI QA now recognizes active WebGL renderers and measures backing-store quality against rendered screen dimensions rather than unscaled slide dimensions.

Evidence is generated under `output/immersive-qa/`: `playwright.json`, per-theme and device screenshots, `live/report.json`, `export/report.json`, and contact sheets. Generated HTML: `output/immersive-data.html`.

## Audit assessment and practical limits

| Dimension | Score | Evidence and limit |
|---|---:|---|
| Accessibility | 3/4 | Native selector/table, focus, keyboard controls, motion fallback; no full screen-reader or WCAG certification |
| Performance | 3/4 | Idle-frame stability, shared context, bounded allocation; no physical midrange-device frame-rate benchmark |
| Responsive behavior | 3/4 | Portrait phone/tablet controls verified at actual 44px; very short landscape screens and dense/long labels remain presentation constraints |
| Theming | 3/4 | Three themes, resolved colors, live switching; original Presenter Studio chrome has its own theme rules |
| Implementation integrity | 3/4 | Detector clean, source preservation, bounded data, offline operation; scope is two spatial chart families |
| **Total** | **15/20** | **Technical checklist only; visual result rejected** |

Long categorical labels can be ellipsized in the plot; the complete names and observations remain available in the selector and Values table. The flat scatter view projects X/Y, with Z retained in the inspector/table. Spatial overlap can obscure marks, so the exact selector remains the reliable way to inspect an observation. Other chart families and unsupported/missing data keep SVG.

The browser implementation follows the resource-lifecycle and allocation principles in [MDN's WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices). Reduced-motion and viewport scenarios use [Playwright context options](https://playwright.dev/docs/test-use-options).

Questions skipped: the user selected the direction, implementation and validation were authorized, and no further product decision is required for this bounded delivery.
