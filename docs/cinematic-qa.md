# Cinematic comparison — revised delivery and critical review

Date: 2026-09-08. Target: `src/engine/components/cinematic-comparison.js`; example: `presentations/cinematic-revenue.yaml`.

The user rejected the grid/inspector composition twice. Its earlier report confused functional validation with design success. A fresh blind visual review rated it **3/10**: obscure comparisons, a sparse scatter field, too many controls and an old-period amount dominating a growth narrative. That report now explicitly records the rejection. The demo is now a complete five-slide story, not a single showcase slide.

Method: independent agents. Blind visual assessment: `/root/blind_visual_verdict`; contrarian code/detector: `/root/immersive_contrarian_review`; fresh finish review: `/root/impeccable_finish_reviewer`. The finish reviewer received the brief and screenshots without test results as aesthetic evidence.

## Revised composition and verdict

Two proportional segmented volumes show FY24 **$8.3M**, FY25 **$16.2M**, **+95.2%**. Platforms supplies **$2.6M** of the **$7.9M** increase. The interaction opens the original strata in place and brings that contribution forward. Both period values remain directly annotated. The phone composition retains the current-period volume with both period values.

An intermediate revision still became five mini-charts. The finish reviewer rated it **5/10, FIX major**. The resulting correction preserves the original volumes, makes Platforms focal and adds beveled geometry with a generated lighting environment.

**Latest independent verdict on the single-scene pass: desktop 7/10, mobile 6/10.** The rounded materials and softer light improve the desktop scene. The full demo now adds an authored opening, a second revenue scene, a profit-quality scene, and a decision close. The final mobile pass gives the complete deck its own composition and hides Studio chrome. The external verdict still calls the style conventional rather than 10/10; this score is an aesthetic judgment, not user acceptance. The reviewer inspected stills; a local WebM separately records the interaction.

## Contrarian corrections

- Contributor selection now follows the net-change direction; ratios retain their sign and are omitted for zero net change.
- Non-additive formats and nonfinite growth retain the standard chart. Additivity remains an authoring requirement.
- Unsupported data preserves source/footnote; every view shares the same value formatter.
- Theme changes recolor GPU materials from compiled chart palettes and refresh the floor.
- Context loss hides the entire GPU view until restoration, which recreates the reflection environment.
- Interrupted navigation settles to the requested endpoint; persisted browser navigation preserves GPU resources.
- Dynamic reduced-motion changes snap to the endpoint. Escape closes the source dialog without Reveal intercepting it.

Final static re-review: no further blocker. The Impeccable detector scanned both cinematic components and four integration files: **`[]`, exit 0**, no suppression added. The backdrop uses an existing theme token. No new ignore rule was introduced.

## Validation and evidence

**43 unit tests passed**: reconciliation, directional contribution, unsupported units, numerical overflow, missing observations, escaping and provenance, alongside existing engine coverage.

**14 Playwright scenarios passed**: five cinematic checks, two full-demo desktop/mobile journeys, and seven immersive regressions. The full-demo checks visit all five slides, screenshot each one, switch every 3D scene to its decomposed state, and run bounds checks at 1440×900 and 390×844. Cinematic checks cover direct entry, financial values, dialog/Escape, idle frames, GPU errors, a two-megapixel canvas ceiling, phone layout, reduced motion, context loss/restoration, absent GPU, export, theme changes, interrupted navigation and print lifecycle. The exercised flow made zero remote HTTP requests and raised zero page errors.

The native Browser plugin reported no available session. Standalone Playwright used installed Chrome. No in-app overlay was injected or claimed, and no overlay server was left running. CLI QA checks actual text/action/annotation regions for source collisions; the full-slide canvas is treated as a backdrop rather than occupied text.

```bash
npm test
npm run test:browser
node bin/gamma-slides.js generate -f presentations/cinematic-revenue.yaml -o output/cinematic-revenue.html
node bin/gamma-slides.js qa -f output/cinematic-revenue.html -o output/cinematic-qa/live --theme signal-room --live
node bin/gamma-slides.js qa -f output/cinematic-revenue.html -o output/cinematic-qa/export --theme signal-room
node bin/gamma-slides.js export -f output/cinematic-revenue.html -o output/cinematic-revenue.pdf --theme signal-room
```

Artifacts: `output/cinematic-revenue.html`, `output/cinematic-preview.webm`, `output/cinematic-revenue.pdf`; screenshots and CLI reports under `output/cinematic-qa/`; combined browser results in `output/immersive-qa/playwright.json`.

## Boundaries and run notes

This variant supports two nonnegative additive series, one to five categories and supported numeric/currency formats. Very short screens, arbitrary long labels, physical-device performance and assistive technology have not received exhaustive validation. Export uses SVG. Reduced motion keeps static 3D and switches instantly. Numerical fidelity and passing checks do not raise the aesthetic score.

The critique snapshot uses the storage helper's target slug. No critique ignore file was present. Assessment A and B were independent before synthesis; the finish review was fresh. The optional visual-reference question received no answer. Temporary capture scripts were removed after evidence generation.

Questions skipped: the user had already selected immersive data and authorized redesign, QA and code review; no further product decision was required to complete this bounded revision.
