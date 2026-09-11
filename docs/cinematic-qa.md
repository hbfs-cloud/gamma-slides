# Cinematic comparison — delivery and critical review

Date: September 8, 2026. Target: `src/engine/components/cinematic-comparison.js`; example: `presentations/cinematic-revenue.yaml`.

The user rejected the initial grid/inspector composition twice. Its first report confused functional validation with design success. A fresh blind visual review rated it **3/10**: comparisons were obscure, the scatter field sparse, controls excessive, and the old-period amount dominated a growth narrative. The replacement is a complete five-slide story, not a one-slide showcase.

## Revised composition and verdict

Two proportional segmented volumes show FY24 **$8.3M**, FY25 **$16.2M**, and **+95.2%**. Platforms supplies **$2.6M** of the **$7.9M** increase. Interaction opens original strata in place and brings that contribution forward. Both values remain directly annotated; phone keeps the current-period volume with both period values.

An intermediate revision became five mini-charts and received **5/10, FIX major**. The final correction preserves original volumes, makes Platforms focal, and adds beveled geometry with a generated lighting environment. Latest independent single-scene verdict: desktop **7/10**, mobile **6/10**. The full demo adds an authored opening, a second revenue scene, a profit-quality scene, and a decision close. This is an aesthetic judgment, not user acceptance or a universal certification.

## Correctness and lifecycle fixes

- Contributor selection follows net-change direction; ratios retain sign and are omitted for zero net change.
- Non-additive formats/nonfinite growth retain the standard chart; additivity remains an authoring requirement.
- Unsupported data retains source/footnote and all views share one formatter.
- Theme changes recolor GPU materials from compiled palettes; context loss hides GPU until restoration rebuilds the environment.
- Interrupted navigation settles at the requested endpoint; reduced-motion changes snap to it.
- Escape closes the source dialog without Reveal intercepting it.

The final static detector returned `[]`; no suppression was added.

## Validation and boundaries

43 unit tests and 14 Playwright scenarios passed. The five-slide desktop/mobile journey screenshots every slide, opens every 3D decomposition, and runs bounds checks at 1440×900 and 390×844. Coverage includes entry, values, Escape, idle frames, GPU error/loss/restoration, 2-megapixel canvas ceiling, phone layout, reduced motion, absent GPU, export, themes, interrupted navigation, and print lifecycle. The exercised flow made zero remote HTTP requests and raised zero page errors.

```bash
bun run test
bun run test:browser
bun bin/gamma-slides.js generate -f presentations/cinematic-revenue.yaml -o output/cinematic-revenue.html
bun bin/gamma-slides.js qa -f output/cinematic-revenue.html -o output/cinematic-qa/live --theme signal-room --live
bun bin/gamma-slides.js qa -f output/cinematic-revenue.html -o output/cinematic-qa/export --theme signal-room
bun bin/gamma-slides.js export -f output/cinematic-revenue.html -o output/cinematic-revenue.pdf --theme signal-room
```

Artifacts: `output/cinematic-revenue.html`, `output/cinematic-preview.webm`, `output/cinematic-revenue.pdf`, and reports/captures under `output/cinematic-qa/`. The variant supports two nonnegative additive series, one to five categories, and supported numeric/currency formats. Very short screens, arbitrary long labels, physical-device performance, and assistive technology are not exhaustively certified. Export uses SVG; reduced motion keeps static 3D. Numerical fidelity and passing checks do not raise the aesthetic score.
