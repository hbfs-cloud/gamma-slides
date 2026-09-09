---
name: Gamma Slides
description: Three native financial publishing themes inside one presentation runtime, backed by a focused presenter control room.
colors:
  proof-cobalt: "#1748D5"
  proof-violet: "#5E46A8"
  proof-paper: "#F3F0E8"
  proof-surface: "#FBF9F3"
  proof-ink: "#111318"
  proof-muted: "#62646B"
  proof-hairline: "#CFC9BD"
  proof-positive: "#06745F"
  cut-orange: "#FF5A1F"
  cut-gold: "#FFD166"
  cut-black: "#080808"
  cut-surface: "#111111"
  cut-ink: "#F4F0E7"
  cut-muted: "#B5ADA0"
  cut-hairline: "#3A3732"
  signal-amber: "#FFB000"
  signal-blue: "#8BA8FF"
  signal-void: "#05070A"
  signal-panel: "#0A0E13"
  signal-ink: "#F3F6F2"
  signal-muted: "#A3ADB8"
  signal-line: "#26313D"
  market-positive: "#3FD49A"
  market-negative: "#FF6F66"
  studio-void: "#050912"
  studio-panel: "#0A101B"
  studio-raised: "#111B2B"
  studio-line: "#2A3850"
  studio-ink: "#F5F7FC"
  studio-muted: "#AAB7CA"
  studio-cobalt: "#315DFF"
  studio-focus: "#87A2FF"
typography:
  experience-display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "5.5rem"
    fontWeight: 550
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  experience-title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 550
    lineHeight: 1.04
  experience-mobile-display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 550
    lineHeight: 0.98
  experience-mobile-title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 550
    lineHeight: 1.04
  experience-standfirst:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 450
    lineHeight: 1.5
  experience-section:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 550
    lineHeight: 1.2
  experience-mobile-metric:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "2.25em"
    fontWeight: 500
    lineHeight: 1
  experience-figure-value:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 550
    lineHeight: 1.2
  experience-caption:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: ".75rem"
    fontWeight: 450
    lineHeight: 1.4
  experience-brief-display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "5.5rem"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  experience-editorial-title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "3.25rem"
    fontWeight: 400
    lineHeight: 1.06
  experience-sequence-title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "2.75rem"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.025em"
  experience-editorial-number:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "2.75rem"
    fontWeight: 400
    lineHeight: 1
  experience-chapter-display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "5.5rem"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  slide-root:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 440
    lineHeight: 1.45
  proof-display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "4.2em"
    fontWeight: 560
    lineHeight: 0.96
    letterSpacing: "-0.025em"
  cut-display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "3.05em"
    fontWeight: 790
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  signal-display:
    fontFamily: "Azeret Mono, monospace"
    fontSize: "3.65em"
    fontWeight: 560
    lineHeight: 0.96
    letterSpacing: "-0.03em"
  report-body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.92em"
    fontWeight: 440
    lineHeight: 1.45
  data-label:
    fontFamily: "Azeret Mono, monospace"
    fontSize: "0.66em"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
  studio-title:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1.15
  studio-control:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    lineHeight: 1
  spatial-label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  spatial-mobile-value:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 650
    lineHeight: 1.15
  spatial-caption:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  slide-soft: "4px"
  control: "9px"
  selector: "9px"
  toolbar: "13px"
  panel: "16px"
  dialog: "20px"
  pill: "999px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "32px"
  report-column: "56px"
  report-gutter: "72px"
components:
  theme-selector-option:
    backgroundColor: "{colors.studio-panel}"
    textColor: "{colors.studio-ink}"
    typography: "{typography.report-body}"
    rounded: "{rounded.selector}"
    padding: "18px 20px 21px"
  theme-switcher:
    backgroundColor: "{colors.studio-panel}"
    textColor: "{colors.studio-ink}"
    typography: "{typography.data-label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "40px"
  studio-action-primary:
    backgroundColor: "{colors.studio-cobalt}"
    textColor: "{colors.studio-ink}"
    typography: "{typography.studio-control}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "38px"
---

# Design System: Gamma Slides

## Overview

**Creative North Star: "The Three Editions Desk"**

Gamma Slides treats a financial deck as one body of evidence that can be published in three complete editions. Analyst Proof is for review: marked paper, serif authority, cobalt corrections, and measured grids. Cutting Room is for presentation: a black work print, signal orange, condensed pacing, and a film rail that makes sequence visible. Signal Room is for decision: an emissive void, amber hierarchy, and layered data with almost no enclosure. Its base theme uses monospaced headlines; the flagship experience explicitly replaces ordinary headings with Archivo.

The base themes replace typography, composition rules, surfaces, and ECharts configurations while preserving the slide, data, and navigation state. The flagship experience deliberately retains its Archivo and Source Serif 4 role assignments and responsive compositions across Appearance choices. Presenter Studio remains a fourth, operational realm: compact navy equipment surfaces that frame every theme without adopting any one theme's voice.

The current flagship is the complete 38-slide deck in `presentations/flagship.yaml`, rendered as `output/flagship-demo.html`. Its experience layer expands Signal Room into a continuous board review with six chapters, 20 authored composition assignments, full-width phone reading, four D3/Pixi.js chart scenes, a Three.js opening revenue sculpture, and comparables that open in Three.js with a reversible 2D view. Archivo carries ordinary headings and financial copy; Source Serif 4 gives the brief, scorecard, sequence, roadmap, market chapter, and decisions their editorial roles. This scope is separate from the earlier five-slide cinematic demonstration.

**Key Characteristics:**

- Three purpose-led themes named for the reading job: review, present, and decide.
- Complete theme compilation from tokens through chart configuration; no post-render recoloring.
- Strong single-accent commitment at slide scale: cobalt, orange, or amber.
- Flat financial evidence shaped by rules, alignment, depth, and pacing instead of ornamental cards.
- Self-hosted Archivo, Azeret Mono, Source Serif 4, and Instrument Sans with offline rendering.
- A persistent accessible theme selector with keyboard focus, reduced-motion fallback, and shareable query values.
- A flagship reading layer with Archivo evidence and Source Serif 4 editorial roles, persistent chapter navigation, and phone layouts that retain the complete evidence.
- Source-scaled opening revenue ribbons, four D3/Pixi.js scenes, and default Three.js comparables with direct names, exact-value access, and deterministic SVG exports.

## Colors

Each presentation theme owns a full palette. Semantic finance colors keep their meaning, but the dominant accent and neutral field change together.

### Primary

- **Proof Cobalt:** Corrections, current data, review marks, and the defining vertical proof rail in Analyst Proof.
- **Cut Orange:** A committed narrative field, film perforation rail, chart emphasis, and active story markers in Cutting Room.
- **Signal Amber:** Front-plane rank, live decision emphasis, and selected chart series in Signal Room.
- **Studio Cobalt:** Active operational controls, progress, and focus-adjacent state in Presenter Studio.

### Secondary

- **Proof Violet:** Forecast and scenario comparison on the light proof.
- **Cut Gold:** Secondary series and caution within the work-print palette.
- **Signal Blue:** Forecasts and rear-plane analytical series against the signal void.

### Tertiary

- **Market Positive / Market Negative:** Directional financial truth. Green remains positive or ready; red remains negative, error, or recording.
- **Proof Positive:** Analyst Proof’s positive financial text uses the dedicated `proof-positive` token. It measures 5.02:1 against Proof Paper; the darker green preserves the positive meaning on the light reading canvas.

### Neutral

- **Proof Paper / Surface / Ink:** A warm, low-glare reading canvas with near-black evidence and quiet rules.
- **Cut Black / Surface / Ink:** True dark work-print stock with warm ivory copy and charcoal separation.
- **Signal Void / Panel / Ink:** An emissive black field with cool white copy and restrained blue-gray structure.
- **Studio Void / Panel / Raised:** The operational stack used by the selector, toolbar, wizard, camera, and console.

### Named Rules

**The Complete Theme Rule.** Base themes define typography, composition, surfaces, and charts together. The flagship experience is an explicit shared reading layer above those themes: it keeps the published Archivo and Source Serif 4 roles and authored responsive compositions while the palette and chart theme change.

**The One Dominant Signal Rule.** Each theme spends its defining accent in large, decisive fields or one front-plane series; it does not scatter several competing accents across neutral cards.

**The Semantic Signal Rule.** Green, amber, and red communicate finance or system state. Do not use them as arbitrary decoration.

## Typography

- **Proof Display Font:** Source Serif 4 (with Georgia fallback)
- **Cut Display Font:** Archivo (with sans-serif fallback)
- **Base Signal Display Font:** Azeret Mono (with monospace fallback), outside the flagship experience
- **Flagship Ordinary Display and Heading Font:** Archivo (with system-ui and sans-serif fallbacks), in every Appearance theme
- **Flagship Editorial Font:** Source Serif 4 (with Georgia and serif fallbacks), for the brief, scorecard, sequence, roadmap quarter markers, market chapter, and decisions
- **Body Font:** Archivo (with system-ui fallback)
- **Studio Font:** Instrument Sans (with system-ui fallback)

**Character:** The theme family changes editorial register without changing information discipline. Source Serif 4 reads like reviewed research, Archivo compresses narrative headlines without theatrical display tricks, and the base Signal Room’s Azeret Mono makes rank and measurement visible. In the flagship, Archivo carries the opening cover, ordinary slide headings, metrics, and report copy. Source Serif 4 carries the brief heading, scorecard statement, sequence titles and order numbers, roadmap quarter markers, market chapter statement and thematic labels, and closing decision statement. The slide count retains Azeret Mono; Instrument Sans remains confined to the operational studio.

### Hierarchy

- **Display outside the flagship:** Theme-specific cover and chapter statements; short lines, high contrast, and a hard ceiling of three lines at the presentation viewport.
- **Historical cinematic demo mobile display:** Cinematic deck covers use a fluid 2.625rem–3.625rem range; decision closes use 2.25rem–3.25rem so the complete story remains legible at 390px.
- **Headline outside the flagship:** Slide titles around 1.75–2.15em depending on column width; use tighter sizes in story-chart sidebars rather than accepting seven-line stacks.
- **Title:** Theme and dialog names at 25–27px with compact negative tracking.
- **Body:** Mid-weight Archivo with 1.45–1.5 line-height and 65–75ch maximum measure for continuous copy.
- **Label:** Azeret Mono for sources, data context, theme purpose, and technical status; sentence case for explanatory labels and uppercase only where the data convention requires it.

### Flagship type ramp

The `experience-*` frontmatter tokens own the flagship scale. `body.gamma-experience` overrides the base Signal Room mono headline prescription; do not apply `signal-display` to its ordinary headings. Sizes below are CSS sizes before desktop stage fitting. At 900px and below, the stage is unscaled, so the phone values retain their actual reading size.

| Role | Desktop | Phone / tablet ≤900px | Weight / line height |
|---|---|---|---|
| Cover statement | 5.5rem | 3.25rem | 550 / .98 |
| Slide heading | 2.75rem | 2rem | 550 / 1.04 |
| Cover standfirst | 1.25rem | 1rem | 450 / 1.5 |
| Ordinary body | 1rem | 1rem | 450 / 1.5 |
| Strategy section heading | 1.5rem | 1.5rem | 550 / 1.2 |
| Supporting metric | 2.75em | 2.25em | 500 / 1 |
| Opening revenue total | 32px | 24px | 550 / 1.2 |
| Panel title / caption | .75rem | .75rem | 550 or 450 / 1.4 |

The editorial compositions override that ordinary Archivo ramp with observed Source Serif 4 roles:

| Role | Desktop | Phone / tablet ≤900px | Weight / line height |
|---|---|---|---|
| Brief heading, slide 2 | 5.5rem | 2.75rem | 400 / 1.04 |
| Scorecard and decision statements, slides 3 and 38 | 3.25rem | 2rem | 400 / 1.06 |
| Sequence titles, slide 24 | 2.75rem | 2rem | 400 / 1.06 |
| Sequence numbers and roadmap quarters, slides 24–25 | 2.75rem | 2rem | 400 / 1 |
| Market chapter statement, slide 28 | 5.5rem | 2.75rem | 400 / .98 |
| Market chapter link names, slide 28 | 2.75rem | 2rem | 500 / 1.1 |

Cover tracking is −.04em; ordinary slide-heading and brief tracking is −.035em; sequence titles use −.025em. The roadmap deliverable headings and individual closing decision titles remain Archivo. Sources move from compact desktop type (10px) to stacked phone text (12px). GPU plot labels and the exact-values dialog have their own compact data scale; they do not redefine the heading ramp.

**The Flagship Heading Rule.** Ordinary flagship headings use Archivo across Appearance choices. Preserve the implemented Source Serif 4 roles in brief, scorecard, sequence, roadmap quarter markers, chapter, and decisions compositions; keep the older base theme display roles for surfaces outside the experience layer.

### Named Rules

**The Name Carries the Choice Rule.** Theme names lead. Purpose text follows the name; never put a decorative eyebrow above it.

**The Number Discipline Rule.** Financial canvases use lining tabular numerals. Values align and compare before they decorate.

## Layout

Base presentation slides use a 1280×720 canvas with 72px horizontal gutters, 44px top padding, and 72px bottom clearance. The shared editorial layouts use asymmetric 3:8, 4:7, 5:7, and 8:3 structures with 42–80px gaps. Dashboards use two to four columns with 12px gaps, but each theme changes how those regions join: proof uses hairlines, cutting uses a continuous film rail and narrative partitions, and signal uses brightness and depth with minimal enclosure.

The flagship keeps the 1280×720 desktop stage between a fixed masthead and bottom navigation (56px each). Its ordinary sections use 54px horizontal gutters, 36px top padding, and 72px bottom clearance. Default story charts put the narrative above a wide plot; authored evidence charts instead place a 330px narrative column beside the plot with a 54px gap. The company, Appearance, and Studio remain in the masthead, while chapter name, slide count, previous/next controls, and progress stay in the bottom rail.

**The Authored Composition Rule.** The 20 assignments in `presentations/flagship.yaml` are brief (2), scorecard (3), evidence (4, 19, 23, 36), ledger (7, 11, 13, 22), feature (8, 18, 31, 34), register (16, 17), sequence (24), roadmap (25), chapter (28), and decisions (38). These compositions stage the authored evidence without altering its data or the ordinary layouts of other decks.

| Composition | Implemented structure |
|---|---|
| Brief | Large serif statement beside three ruled financial rows; values and deltas stay aligned. |
| Scorecard | Accent statement field beside an open metric register; the phone header spans the content width and its insight follows the metrics. |
| Evidence | Narrow narrative and insight column beside a full-height plot; content stacks on phones. |
| Ledger | A 330px narrative column beside the table; authored emphasis rows use a tonal field, stronger type, and an accent rule. |
| Feature | Unequal 1.65:1 dashboard columns; a secondary metric uses a vertical divider when present. |
| Register | Compact chart/status row above the table; phones retain three summary columns with the table below. |
| Sequence | Three numbered serif bets linked by small arrows; phones read them vertically. |
| Roadmap | Quarter, deliverable, and explicit release criterion in ruled rows; the phone criterion follows its deliverable. |
| Chapter | Full accent field with a serif statement and three linked market destinations. |
| Decisions | Accent statement field beside three ruled decisions; the phone statement spans the content width. |

At 900px and below, **all flagship slides** leave the scaled stage. Each slide fills the available width and scrolls vertically with 24px side padding; the masthead is 52px and the bottom navigation remains 56px. The reading stage reserves a separate 44px “More below” rail above navigation, giving it `calc(100% - 152px)` height. The control therefore occupies reserved space outside the scrolling evidence. It appears with at least 24px of content remaining and advances the current slide by 80% of its visible height, immediately under reduced motion. Covers, chart stories, timelines, and closing decisions stack; the compact register retains its three summary columns. Sources follow the content. Tables become labeled rows: the first cell names the row, and every subsequent value carries its original column label. The P&L retains a visible “Amounts in $M” caption when its header is visually hidden.

The persistent chapter index follows the authored starts: The readout (1), Performance (4), Liquidity & controls (15), The operating plan (19), Market perspectives (28), and The decisions (38). The index returns focus to its trigger after a selection or dismissal. Fixed navigation is part of the reading frame, including while a phone slide scrolls.

The selector is a full-viewport decision surface. At desktop it is a three-column comparison table with one honest composition preview per theme. Below 900px the options stack; below 620px the previews disappear so the names, purposes, and descriptions remain immediately reachable without horizontal scrolling.

Presenter Studio remains fixed above the deck. Docked tools reserve stage width on desktop and become bounded overlays on narrow screens. Theme changes preserve the current slide and re-layout the stage in place.

**The Purpose Before Taste Rule.** Every theme option states the reading job it serves. Do not fall back to A/B/C labels, vague energy levels, or “light/dark” as the choice architecture.

**The Stable Evidence Rule.** Theme switching may change how evidence is staged, never its numbers, labels, semantic colors, source, or slide position.

## Elevation & Depth

Slides are flat by default. Analyst Proof uses paper tone, thin rules, and registration marks. Cutting Room uses field contrast, rails, and sequence. Base Signal Room maps rank to brightness and foreground stillness while rear dust layers drift. The flagship hides those background stages and uses a still reading field. Shadows do not appear on report charts, tables, or metrics.

Operational chrome uses controlled lift: the selector is a protected full-screen surface, while the compact switcher, toolbar, camera, console, and setup dialog use progressively stronger ambient shadows. Blur is reserved for true modal veils and small floating chrome.

**The Evidence Stays Flat Rule.** Alignment, rule weight, field color, and chart scale carry report hierarchy. A rounded shadow card is not a substitute for composition.

**The Spatial Evidence Exception.** The separate `immersive` variant’s user-selected chart slides may map categories, values, and series to an orthographic data volume, or map three explicitly supplied numeric variables to a point cloud. Depth encodes data. The scene uses the same resolved series colors as the SVG view, keeps an exact-value inspector and table, and falls back to SVG for export, unavailable GPU, reduced motion, or unsupported data. GPU rendering is demand-driven, with one shared context and a two-megapixel backing-store budget.

The flagship’s D3/Pixi.js scenes add shallow upper bar faces and restrained nested bubble highlights while preserving the measured bar endpoint and bubble area. The opening uses five actual Three.js ribbon meshes: each period’s ribbon endpoint shares the same dollars-to-height scale, while curvature and depth describe material without asserting a third financial variable. Default Three.js comparables map three supplied numeric variables into depth, with measurement axes, floor projections, physical sphere materials, and theme-derived lighting. These two scenes use their own demand-driven WebGL renderers; the separate immersive variant’s shared-context and backing-store limits do not describe them. The chapter index uses a modest theme-derived shadow (`0 18px 50px color-mix(in srgb,var(--gamma-text) 12%,transparent)`).

**The Measured Depth Rule.** Opening ribbon endpoint thickness measures source revenue on one shared scale; its depth is material only. Comparables use growth on X, valuation multiple on Y, and source gross margin on Z, with equal-size spheres and adjacent full names. Keep these two meanings of depth explicit.

**The Operational Lift Rule.** Shadow strength corresponds to interaction layer and movability; theme content itself remains materially flat.

## Shapes

The themes are rectilinear. Charts, tables, proof rails, film perforations, and signal baselines use straight edges and 1px rules. A restrained 4px softening is allowed on reusable report panels, but layout regions do not become a card grid.

Operational controls use 9px corners, 13–16px for floating tool surfaces, 20px for the setup dialog, and pills only for compact semantic status. Theme previews are framed compositions, not icon tiles.

## Components

### Theme Selector

- **Structure:** One radiogroup with three named options, each containing an honest miniature composition, name, purpose, and description.
- **State:** The selected option uses its theme accent on the top rule and a visible focus outline; hover changes the shared studio panel tone without moving content.
- **Behavior:** Arrow keys move between themes, Enter applies, Escape closes only after a choice exists, and reduced-motion users receive an immediate swap.
- **Persistence:** The query parameter wins, then local storage, then the requested deck theme.

### Theme Switcher

- **Shape:** Compact 40px operational control with a 9px radius and a live accent square.
- **Copy:** “Theme” plus the full current theme name; never a letter or internal slug.
- **Behavior:** Reopens the selector without resetting the current slide.

### Financial Charts

- **Theme compilation:** Every theme receives its own ECharts configuration set, including surface, text, axes, grid lines, series palette, tooltip, and labels.
- **Flagship label adaptation:** On phones, the waterfalls on slides 10 and 15 use six numbered axis markers with an HTML key below the chart listing all six complete names and their exact amounts. Desktop waterfall labels retain their existing treatment. The nine-node capital Sankey becomes vertical, with authored short names directly inside its 44px nodes. The native “Full flow labels” disclosure below retains all nine original names. Node text chooses the more contrasting theme text or background color. Treemap cells also use explicit theme contrast and retain authored names and amounts. Endpoint annotations are disabled in the flagship, where named panel titles and legends carry series identity.
- **Scenario identity:** Slide 33’s parallel coordinates expose the five unnamed source rows as stable Scenario A–E trajectories, each using a resolved theme series color. A native HTML button legend provides 44px targets, visible focus, and `aria-pressed` state; its outlined inactive swatch makes state visible without color alone. Enter and Space toggle trajectories without advancing the deck. All five axes retain source-derived bounds of 0–5 when a trajectory is hidden. Selection persists when charts rebuild for Appearance changes or responsive layout.
- **Switching:** Existing chart instances are disposed and recreated from cloned configuration objects so serialized format metadata remains intact.
- **Truth:** Positive, negative, warning, and forecast roles stay semantically stable across themes.

### Immersive Charts

- **Entry:** `layout: chart`, `variant: immersive`, with supported bar or XYZ scatter data. A large open plot sits beside a comparison rail, with a quiet control strip below. Related bar tops are linked across series; scatter marks project onto their measured floor positions. The enclosing wire cube is absent.
- **Control:** Drag or arrow keys orbit, plus/minus zoom, and Reset view restores framing. 3D view, 2D view, and Values remain explicit reversible choices. Selection has a visible marker and a native observation selector.
- **Typography:** Spatial labels use `--spatial-label-size` (12px), mobile numeric readouts `--spatial-value-size` (24px), and secondary status captions `--spatial-caption-size` (10px). These are chart-local tokens, not changes to report headline scales.
- **Phone and tablet:** Outside the flagship experience, at 900px and below, immersive slides leave the scaled 1280px stage, controls remain at least 44px, and the inspector stacks beneath the plot; other ordinary slides retain their presentation canvas. The flagship applies full-width reading to every slide as described in Layout.
- **Comparison:** The selected category shows its first-to-last-series change, rounded to one decimal for the percentage, alongside named series and exact endpoint values. The 64px comparison readout belongs to this data relationship; it is not a generic hero metric.
- **Motion:** A 950ms camera entrance and 650ms Overview/Profile/Top transitions provide finite changes of viewpoint. Direct manipulation interrupts the transition. There is no perpetual orbit; frames stop after settling. A motion-reduction preference starts in 2D and snaps manual camera presets immediately. PDF and frame exports use SVG.

### Flagship Navigation and Reading Controls

- **Structure:** Fixed masthead with Appearance and Studio; fixed bottom navigation with previous/next, current chapter, slide count, and progress. The chapter index is an anchored, scrollable surface with six named destinations.
- **State:** Previous and next disable at the deck boundaries. The index exposes expanded state, supports Escape, and returns focus to its trigger. Controls keep a 44px minimum target; visible focus uses the active theme’s primary color.
- **Phone reading:** The reserved 44px “More below” rail reveals additional content inside the current slide above the separate 56px navigation. Tables keep their original data and column relationships as open labeled rows, including the P&L’s “Amounts in $M” caption.

### Flagship Opening Revenue Sculpture

- **Source and geometry:** Slide 1 derives FY24 ($8.3M) and FY25 ($16.2M) from the same five customer-segment series as slide 9: Enterprise, Platforms, Fintech, Marketplaces, and Other. Five closed curved Three.js meshes share one revenue-to-height conversion at both endpoints. Their equal inter-segment gaps are spacing, not revenue. The orthographic view preserves proportional endpoint measurements.
- **Appearance:** Physical materials use the current theme’s secondary, primary, accent, muted, and text colors. Hemisphere and directional lights reveal the surfaces. One 850ms light pass introduces the scene; the complete financial geometry is present on its first frame. Reduced motion omits that pass and keeps a still 3D view.
- **Interaction and access:** Pointer or touch selects a ribbon. Five native segment buttons expose complete names, both period values, and `aria-pressed` state; arrows, Home, and End move focus, Enter/Space activate, and Escape clears selection. A live caption reports added revenue and the revenue multiple. Canvas content is hidden from assistive technology; the labeled SVG and HTML controls carry the evidence.
- **Lifecycle and fallback:** Rendering stops at rest. Slide exit, a hidden document, print, and page exit release geometry, materials, renderer, and context; returning rebuilds the active scene, retaining selection. Theme changes rebuild its materials. GPU failure or loss leaves the deterministic SVG and working segment controls. Print and export keep SVG. Backing pixels use the actual CSS bounding box and device pixel ratio capped at 2, accounting for the fitted desktop stage.

### Flagship D3 / Pixi.js Charts

- **Scope:** Four authored `d3-webgpu` scenes: customer-segment revenue (slide 9), public comparables (21), readiness risks (27), and the network (35). D3 computes the scales and layout; Pixi.js draws actual chart marks and labels through WebGPU when available, or WebGL. Other flagship charts use ECharts with SVG.
- **Reading and selection:** Wide chart fields sit between an Archivo heading and a caption/action rail. Pointer, touch, or arrow-key selection reveals a live readout; selecting a network node emphasizes its connections. Text remains fully opaque when other marks dim.
- **Exact values:** “View data” opens a native dialog with original source numbers, named columns, and, for networks, a separate connections table. Rounded plot labels are not the only source of values.
- **Lifecycle:** A finite 600ms entrance settles into an idle scene. Reduced motion renders the final state immediately. Pixi tickers do not run continuously; leaving the slide or hiding the document disposes the active renderer. GPU loss falls back to the matching SVG scene. Pixel ratio is capped at 2.
- **Export:** The same deterministic scene description produces the SVG fallback used for export and print. Backend labels describe the actual renderer, not a simulated capability.

### Flagship Comparables in Three.js

- **Entry and meaning:** Slide 21 opens in a true Three.js WebGL scene by default. Revenue growth maps to X, valuation multiple to Y, and gross margin to Z using the same five observations as the 2D bubbles. Equal-size spheres leave all three measurements to position. The source dimensions remain visible in the X/Y/Z key; the flat subtitle and readout are hidden while the 3D controls provide local context.
- **Framing:** The desktop geometry spans X from −6.5 to 6.5, Y from −1.45 to 1.65, and Z from −2 to 2, with a base orthographic view height of 5. The camera expands its view when a rotation needs more room, using actual sphere radii and axis bounds; Reset restores the authored wide frame. Phones use a compact X span from −2.5 to 2.5, a more elevated viewpoint, and a plot field at least 430px high. These are scene coordinates and framing values, not financial axis units.
- **Controls and values:** Drag, arrow keys, 44px rotate controls, and Reset change the view. Tapping a point has a 44px proximity target. The native “Inspect a company” selector offers all five complete names and drives the same selection; a local live readout displays growth, EV/revenue, and margin with units. Escape on the plot clears selection. “Compare in 2D” and “Explore in 3D” keep the view reversible, and “View data” retains the exact-source dialog.
- **Labels:** Complete company names sit adjacent to their projected points on desktop and phones, with leaders and collision-aware placement against spheres and other labels. Axis names sit in their separate key; overlapping tick captions may be omitted at steep views while the measured grid remains. There is no numbered name rail. Selected company identity is also available in the native selector and accessible readout.
- **Lifecycle:** There is no entrance animation or continuous orbit, including under reduced motion. Three.js renders on entry, resize, selection, or direct view changes and releases resources on slide exit, document hiding, print, or page exit. The preferred view and selected company survive in-session navigation and theme rebuilds. Backing resolution multiplies capped device pixel ratio (2) by the actual CSS stage scale so desktop fitting remains sharp. Missing Three.js/D3, GPU failure, or context loss returns to 2D and disables 3D entry; print and export use the deterministic SVG chart.

### Report Panels

These are base theme treatments; the flagship’s ordinary type and responsive composition follow its explicit experience rules.

- **Analyst Proof:** Transparent or near-paper panels separated by hairlines; serif display and cobalt review marks.
- **Cutting Room:** Black work-print regions joined by the orange film rail; uppercase narrative display is reserved for headlines.
- **Signal Room:** Open baselines with almost no boxes; amber marks the front plane and muted layers recede.

### Presenter Studio

- **Controls:** Solid navy fills, real inline SVG icons, compact Instrument Sans labels, visible focus, and explicit ready/warning/error states.
- **Boundary:** Studio chrome may frame any theme but must not inherit its display type or alter its chart palette.


### Historical Cinematic Comparison — separate five-slide demo

This record applies only to `presentations/cinematic-revenue.yaml`, the earlier five-slide demonstration, and does not assess the 38-slide flagship. The immersive grid/inspector demonstration was rejected by the user despite functional QA. The revised `cinematic` composition makes the total comparison the scene: same-footprint segmented solids, a dominant current-period amount, and the largest contributor visible immediately. The second state opens those strata in place; it does not rearrange them into a grid of small charts. Platforms is the focal contribution in the supplied example. On phones, the current volume remains with directly linked values for both periods.

This is an explicit exception to flat chart surfaces: Three.js provides bounded physical lighting, a generated reflection environment, chamfered geometry and cast shadows. Theme colors come from compiled chart configurations. White lights and neutral environment panels describe illumination, not a new UI palette. Copy and controls use existing Source Serif 4 and Archivo roles. No perpetual render loop; reduced motion snaps the decomposition. Presenter tools are disclosed on request.

**The Historical Verdict Boundary.** Historical independent visual verdict for that five-slide demo: 6.5/10, presentable, with moderate immersive impact and still-stylized materials. This is not a flagship rating. The current flagship’s technical evidence is recorded in `docs/flagship-qa.md`; its captures are in `output/flagship-review/desktop-*.png`, `mobile-*.png`, `desktop-3d-21.png`, and `mobile-3d-21.png`. Those checks and artifacts establish their stated technical coverage, not an aesthetic guarantee or a new quality score.

## Do's and Don'ts

### Do:

- **Do** choose themes by reading purpose: review evidence, tell the story, or decide from signal.
- **Do** compile every theme from real tokens and regenerate charts when the theme changes.
- **Do** keep the current slide, source, data values, and semantic finance roles stable across themes.
- **Do** let one accent own the composition and use neutral fields generously around it.
- **Do** keep focus, keyboard navigation, reduced motion, and export selection working for every theme.
- **Do** use Source Serif 4, Archivo, and Azeret Mono for their assigned editorial jobs; preserve the flagship’s explicit serif compositions and ordinary Archivo headings, and keep Instrument Sans in Presenter Studio.
- **Do** preserve complete labels, exact values, source notes, and full-size reading on phones.
- **Do** describe GPU support by its actual scope and backend; retain deterministic SVG exports.

### Don't:

- **Don't** expose themes as A/B/C, “visual cuts,” or cosmetic modes.
- **Don't** recolor a single compiled deck and call the result a theme.
- **Don't** put decorative kickers above headings or theme names; factual context belongs in the margin, source line, or after the name.
- **Don't** turn charts, metrics, or narrative regions into generic rounded shadow cards.
- **Don't** use gradients, glass, glow, or emoji as substitutes for authored financial structure.
- **Don't** allow a theme switcher, console, or camera frame to cover decision-critical slide content.
