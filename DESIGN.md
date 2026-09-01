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

Gamma Slides treats a financial deck as one body of evidence that can be published in three complete editions. Analyst Proof is for review: marked paper, serif authority, cobalt corrections, and measured grids. Cutting Room is for presentation: a black work print, signal orange, condensed pacing, and a film rail that makes sequence visible. Signal Room is for decision: an emissive void, amber hierarchy, monospaced headlines, and layered data with almost no enclosure.

These are native themes, not visual modes. Changing theme replaces the active typography, composition rules, surface system, and ECharts configurations while preserving the slide, data, and navigation state. Presenter Studio remains a fourth, operational realm: compact navy equipment surfaces that frame every theme without adopting any one theme's voice.

**Key Characteristics:**

- Three purpose-led themes named for the reading job: review, present, and decide.
- Complete theme compilation from tokens through chart configuration; no post-render recoloring.
- Strong single-accent commitment at slide scale: cobalt, orange, or amber.
- Flat financial evidence shaped by rules, alignment, depth, and pacing instead of ornamental cards.
- Self-hosted Archivo, Azeret Mono, Source Serif 4, and Instrument Sans with offline rendering.
- A persistent accessible theme selector with keyboard focus, reduced-motion fallback, and shareable query values.

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

### Neutral

- **Proof Paper / Surface / Ink:** A warm, low-glare reading canvas with near-black evidence and quiet rules.
- **Cut Black / Surface / Ink:** True dark work-print stock with warm ivory copy and charcoal separation.
- **Signal Void / Panel / Ink:** An emissive black field with cool white copy and restrained blue-gray structure.
- **Studio Void / Panel / Raised:** The operational stack used by the selector, toolbar, wizard, camera, and console.

### Named Rules

**The Complete Theme Rule.** A theme change must update typography, composition, surfaces, and charts. If only color changed, the feature is unfinished.

**The One Dominant Signal Rule.** Each theme spends its defining accent in large, decisive fields or one front-plane series; it does not scatter several competing accents across neutral cards.

**The Semantic Signal Rule.** Green, amber, and red communicate finance or system state. Do not use them as arbitrary decoration.

## Typography

- **Proof Display Font:** Source Serif 4 (with Georgia fallback)
- **Cut Display Font:** Archivo (with sans-serif fallback)
- **Signal Display Font:** Azeret Mono (with monospace fallback)
- **Body Font:** Archivo (with system-ui fallback)
- **Studio Font:** Instrument Sans (with system-ui fallback)

**Character:** The theme family changes editorial register without changing information discipline. Source Serif 4 reads like reviewed research, Archivo compresses narrative headlines without theatrical display tricks, and Azeret Mono makes rank and measurement visible. Archivo carries ordinary report copy; Instrument Sans remains confined to the operational studio.

### Hierarchy

- **Display:** Theme-specific cover and chapter statements; short lines, high contrast, and a hard ceiling of three lines at the presentation viewport.
- **Headline:** Slide titles around 1.75–2.15em depending on column width; use tighter sizes in story-chart sidebars rather than accepting seven-line stacks.
- **Title:** Theme and dialog names at 25–27px with compact negative tracking.
- **Body:** Mid-weight Archivo with 1.45–1.5 line-height and 65–75ch maximum measure for continuous copy.
- **Label:** Azeret Mono for sources, data context, theme purpose, and technical status; sentence case for explanatory labels and uppercase only where the data convention requires it.

### Named Rules

**The Name Carries the Choice Rule.** Theme names lead. Purpose text follows the name; never put a decorative eyebrow above it.

**The Number Discipline Rule.** Financial canvases use lining tabular numerals. Values align and compare before they decorate.

## Layout

Presentation slides use a 1280×720 canvas with 72px horizontal gutters, 44px top padding, and 72px bottom clearance. The shared editorial layouts use asymmetric 3:8, 4:7, 5:7, and 8:3 structures with 42–80px gaps. Dashboards use two to four columns with 12px gaps, but each theme changes how those regions join: proof uses hairlines, cutting uses a continuous film rail and narrative partitions, and signal uses brightness and depth with minimal enclosure.

The selector is a full-viewport decision surface. At desktop it is a three-column comparison table with one honest composition preview per theme. Below 900px the options stack; below 620px the previews disappear so the names, purposes, and descriptions remain immediately reachable without horizontal scrolling.

Presenter Studio remains fixed above the deck. Docked tools reserve stage width on desktop and become bounded overlays on narrow screens. Theme changes preserve the current slide and re-layout the stage in place.

**The Purpose Before Taste Rule.** Every theme option states the reading job it serves. Do not fall back to A/B/C labels, vague energy levels, or “light/dark” as the choice architecture.

**The Stable Evidence Rule.** Theme switching may change how evidence is staged, never its numbers, labels, semantic colors, source, or slide position.

## Elevation & Depth

Slides are flat by default. Analyst Proof uses paper tone, thin rules, and registration marks. Cutting Room uses field contrast, rails, and sequence. Signal Room maps rank to brightness and foreground stillness while rear dust layers drift. Shadows do not appear on report charts, tables, or metrics.

Operational chrome uses controlled lift: the selector is a protected full-screen surface, while the compact switcher, toolbar, camera, console, and setup dialog use progressively stronger ambient shadows. Blur is reserved for true modal veils and small floating chrome.

**The Evidence Stays Flat Rule.** Alignment, rule weight, field color, and chart scale carry report hierarchy. A rounded shadow card is not a substitute for composition.

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
- **Switching:** Existing chart instances are disposed and recreated from cloned configuration objects so serialized format metadata remains intact.
- **Truth:** Positive, negative, warning, and forecast roles stay semantically stable across themes.

### Report Panels

- **Analyst Proof:** Transparent or near-paper panels separated by hairlines; serif display and cobalt review marks.
- **Cutting Room:** Black work-print regions joined by the orange film rail; uppercase narrative display is reserved for headlines.
- **Signal Room:** Open baselines with almost no boxes; amber marks the front plane and muted layers recede.

### Presenter Studio

- **Controls:** Solid navy fills, real inline SVG icons, compact Instrument Sans labels, visible focus, and explicit ready/warning/error states.
- **Boundary:** Studio chrome may frame any theme but must not inherit its display type or alter its chart palette.

## Do's and Don'ts

### Do:

- **Do** choose themes by reading purpose: review evidence, tell the story, or decide from signal.
- **Do** compile every theme from real tokens and regenerate charts when the theme changes.
- **Do** keep the current slide, source, data values, and semantic finance roles stable across themes.
- **Do** let one accent own the composition and use neutral fields generously around it.
- **Do** keep focus, keyboard navigation, reduced motion, and export selection working for every theme.
- **Do** use Source Serif 4, Archivo, and Azeret Mono for their assigned editorial jobs; keep Instrument Sans in Presenter Studio.

### Don't:

- **Don't** expose themes as A/B/C, “visual cuts,” or cosmetic modes.
- **Don't** recolor a single compiled deck and call the result a theme.
- **Don't** put decorative kickers above headings or theme names; factual context belongs in the margin, source line, or after the name.
- **Don't** turn charts, metrics, or narrative regions into generic rounded shadow cards.
- **Don't** use gradients, glass, glow, or emoji as substitutes for authored financial structure.
- **Don't** allow a theme switcher, console, or camera frame to cover decision-critical slide content.
