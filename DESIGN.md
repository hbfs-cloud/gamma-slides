---
name: Gamma Slides
description: An institutional finance broadcast system pairing warm editorial reports with a focused dark control room.
colors:
  report-cobalt: "#2453FF"
  report-violet: "#7568D8"
  report-amber: "#A66A11"
  report-positive: "#008A70"
  report-negative: "#C83D32"
  paper: "#F4F1E9"
  paper-surface: "#FBFAF7"
  paper-recessed: "#ECE9E1"
  report-ink: "#0B0F17"
  report-muted: "#626975"
  report-hairline: "#D7D3C9"
  dark-paper-ink: "#F7F4EC"
  studio-void: "#050912"
  studio-panel: "#0A101B"
  studio-panel-raised: "#111B2B"
  studio-line: "#2A3850"
  studio-ink: "#F5F7FC"
  studio-muted: "#AAB7CA"
  studio-cobalt: "#315DFF"
  studio-cobalt-soft: "#87A2FF"
  studio-positive: "#42D69A"
  studio-warning: "#F2BD62"
  studio-negative: "#FF746B"
typography:
  report-display:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "4.2em"
    fontWeight: 620
    lineHeight: 0.96
    letterSpacing: "-0.062em"
  report-headline:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "2.15em"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.045em"
  report-body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.92em"
    fontWeight: 450
    lineHeight: 1.45
  report-quote:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "2.25em"
    fontWeight: 500
    lineHeight: 1.22
    letterSpacing: "-0.02em"
  data-label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.66em"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.13em"
  studio-title:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  studio-body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
  studio-control:
    fontFamily: "system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    lineHeight: 1
  terminal:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  progress: "2px"
  report-soft: "4px"
  control: "7px"
  field: "9px"
  notice: "10px"
  toolbar: "13px"
  card: "14px"
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
  studio-action-primary:
    backgroundColor: "{colors.studio-cobalt}"
    textColor: "{colors.studio-ink}"
    typography: "{typography.studio-control}"
    rounded: "{rounded.field}"
    padding: "0 15px"
    height: "38px"
  studio-action-secondary:
    backgroundColor: "#1A2740"
    textColor: "#E7EDF7"
    typography: "{typography.studio-control}"
    rounded: "{rounded.field}"
    padding: "0 15px"
    height: "38px"
  studio-mode-card:
    backgroundColor: "{colors.studio-panel-raised}"
    textColor: "{colors.studio-ink}"
    rounded: "{rounded.card}"
    padding: "17px"
  studio-device-field:
    backgroundColor: "#080D16"
    textColor: "#EAF0F8"
    rounded: "{rounded.field}"
    padding: "0 10px"
    height: "38px"
  report-dashboard-panel:
    backgroundColor: "rgba(251,250,247,.46)"
    textColor: "{colors.report-ink}"
    rounded: "{rounded.report-soft}"
    padding: "14px 16px"
  report-dark-chapter:
    backgroundColor: "{colors.report-ink}"
    textColor: "{colors.dark-paper-ink}"
---

# Design System: Gamma Slides

## Overview

**Creative North Star: "The Broadcast Ledger"**

Gamma Slides treats financial presentation as a live editorial broadcast. The deck is the institutional ledger: warm paper, black display type, fine rules, disciplined grids, and dense charts that reward close reading. Presenter Studio is the control room laid over it: near-black and navy equipment surfaces, compact white controls, cobalt activity, and explicit semantic status.

The two contexts share precision, strong contrast, tabular-number discipline, and restrained ornament, but they do not share a background treatment. The report remains quiet and materially flat so the evidence leads; the studio uses layered dark panels and controlled lift so tools remain discoverable under presentation pressure.

**Key Characteristics:**

- Warm editorial report surfaces paired with a solid dark broadcast-control layer.
- Cobalt as the single connective accent for navigation, active controls, and data emphasis.
- Instrument Sans for decisive display and reading, Source Serif 4 for editorial quotation, and IBM Plex Mono for provenance and technical data.
- Dense information shaped by grids, rules, alignment, and generous outer gutters rather than ornamental chrome.
- Real inline SVG controls, visible focus, permission-safe setup, and semantic status colors.

## Colors

The palette deliberately separates a warm institutional report from a cool operational studio while cobalt connects both worlds.

### Primary

- **Report Cobalt:** The report's navigation, current-state, selected-data, numeric-index, and chart-emphasis color.
- **Studio Cobalt:** The control room's active-button, prompt, stepper, splitter, and top-rule color; its softer companion is reserved for focus outlines and secondary icon emphasis.

### Secondary

- **Forecast Violet:** Forecast series and analytical comparison data in the report.

### Tertiary

- **Signal Amber:** Warnings, watch states, and report-side tertiary data. It never substitutes for neutral decoration.
- **Positive Green / Negative Red:** Directional finance data in the report and readiness, caution, error, and recording states in the studio.

### Neutral

- **Warm Paper:** The default report canvas, with a near-white paper surface and a recessed paper neutral for quiet layering.
- **Editorial Ink:** Near-black text, rules, and full-bleed chapter dividers; dark chapters reverse into a warm off-white rather than cold pure white.
- **Report Muted / Hairline:** Secondary copy and thin institutional separators.
- **Studio Void / Panel / Raised Panel:** A three-level near-black and navy surface stack for the console, dock, wizard, and modal cards.
- **Studio Ink / Muted / Line:** High-contrast control text, supporting copy, and structural borders.

### Named Rules

**The Two Realms Rule.** Reports use warm paper and editorial ink; operational overlays use solid near-black and navy. Do not tint the report into a dashboard or make the studio translucent over the stage.

**The Cobalt Thread Rule.** Cobalt marks navigation, selection, progress, and important data. Keep large reading surfaces neutral so the accent remains diagnostic.

**The Semantic Signal Rule.** Green means ready or positive, amber means pending or caution, and red means error, negative, or recording. Never use these colors as arbitrary decoration.

## Typography

**Display Font:** Instrument Sans (with system-ui fallback)  
**Body Font:** Instrument Sans (with system-ui fallback)  
**Editorial Quote Font:** Source Serif 4 (with Georgia fallback)  
**Label/Mono Font:** IBM Plex Mono (with monospace fallback)

**Character:** Instrument Sans supplies compact, high-authority headlines and highly legible body copy. Source Serif 4 appears selectively for long-form quotation, while IBM Plex Mono makes labels, sources, table headers, console content, and numeric context feel auditable.

### Hierarchy

- **Report Display:** Tight, heavy, and oversized for cover and chapter statements; use short lines and negative tracking.
- **Report Headline:** Compact slide titles with a maximum observed width around 930px, leaving charts and evidence room to breathe.
- **Report Body:** Restrained mid-weight copy with a 1.45 line-height; secondary explanatory copy is muted, never faint.
- **Editorial Quote:** Italic serif reserved for genuine quotation, not ordinary headings or decorative pull text.
- **Data Label:** Monospaced, usually uppercase, tightly sized, and letterspaced for provenance, labels, source lines, and quantitative wayfinding.
- **Studio Title:** A 25px compact title for setup and major operational moments.
- **Studio Body / Control:** Supporting copy sits at 11–12px; actionable control labels are bold, concise, and high contrast.
- **Terminal:** Monospaced at 13px with a generous 1.55 line-height for command and output scanning.

### Named Rules

**The Number Discipline Rule.** Financial canvases use lining tabular numerals; values align, compare, and scan before they decorate.

**The Source Is Structure Rule.** On ordinary report slides, section context belongs in the factual source/footer line. Do not reintroduce repeated pre-heading kickers; cover badges and compact data labels are deliberate exceptions.

## Layout

Report slides use a fixed presentation canvas with 72px horizontal gutters, 44px top padding, and 72px bottom clearance for the source and progress systems. Layouts repeatedly split into asymmetric editorial columns—such as 3:8, 4:7, 5:7, or 8:3—with 42–80px inter-column gaps. Dense dashboards use equal 2-, 3-, or 4-column grids with 12px gaps; hairlines, shared baselines, and aligned numeric edges carry hierarchy.

Presenter Studio is fixed to the viewport and layered above the report. The toolbar stays at the upper right; progress remains along the bottom; the camera PIP is draggable, resizable, persisted, and bounded. The desktop console may float or dock on the right. Docking allocates stage width and progress space through the same dock variable, preserving a true split with zero overlap.

The setup wizard is a three-row shell—header, independently scrolling body, and persistent action footer. Its five-column mode grid becomes two columns below 900px and one column below 620px. On narrow screens the console becomes an inset full-height panel, the dock no longer reduces stage width, camera width drops to 190px, and wizard actions remain reachable.

**The Stage Integrity Rule.** Persistent tools may frame or split the presentation, but they may not cover decision-critical report content. Docked desktop tools reserve space; mobile tools become bounded overlays.

## Elevation & Depth

The report is flat by default. It creates depth through warm tonal changes, black and hairline rules, column separation, and occasional data-driven tint; report cards do not rise on hover. Presenter Studio uses a small shadow hierarchy to separate tools from the stage: modest lift for interactive cards, deeper ambient shadows for floating toolbars and camera, and the strongest shadow only for the setup dialog and large console. Blur belongs to modal veils and small floating operational chrome, never to core studio panel fills.

### Named Rules

**The Evidence Stays Flat Rule.** Charts, tables, metrics, and narrative panels rely on alignment, rules, and tonal contrast—not default card shadows.

**The Operational Lift Rule.** Shadows indicate movable, modal, or temporarily elevated controls. A stronger shadow must correspond to a stronger interaction layer.

## Shapes

The report is rectilinear: transparent charts, square tables, straight rules, and only a restrained 4px softening on reusable content cards. Circular marks are reserved for plotted points, status dots, and the subtle metric-panel signal rings.

Studio controls use a compact radius ladder: 7–10px for buttons and fields, 13–16px for toolbars, camera, cards, and console panels, 20px for the wizard dialog, and full pills for transient or semantic badges. A 1px cool navy stroke is usually present; selected and focused states strengthen the stroke with cobalt rather than changing silhouette.

**The Radius Follows Scale Rule.** Small controls receive small corners, contained tools receive medium corners, and only the primary modal receives the largest radius. Do not import the studio's rounded language into report charts or tables.

## Components

### Buttons

- **Shape:** Compact operational controls use a 7–9px radius; icon buttons are 29–34px square and text actions are at least 38px high.
- **Primary:** Solid studio cobalt, white text, bold control type, and 15px horizontal padding.
- **Hover / Focus:** Hover brightens the cobalt and rises by 1px; keyboard focus uses a 2px soft-cobalt outline with visible offset.
- **Secondary / Ghost:** Secondary controls use a raised navy fill and line border; ghost actions remain transparent with muted text. Disabled controls lose emphasis and movement.

### Chips

- **Style:** Quick terminal actions are compact navy chips with a cool line border and inline SVG icon where needed.
- **State:** Readiness is a green outlined pill with a leading status dot; busy changes the same component to amber and pulses only the dot.

### Cards / Containers

- **Report Panels:** Thin hairline border, near-white translucent paper fill, 14px by 16px padding, and no resting shadow. Metric panels add a 2px cobalt top rule and a very light data tint.
- **Studio Mode Cards:** Raised navy, 14px corners, one-pixel blue-gray border, 17px padding, real SVG icon, and a compact capability label. Selection deepens the cobalt-toned surface and border.
- **Wizard / Console:** Solid navy or near-black fills with explicit borders and strong shadows appropriate to modal or floating behavior.

### Inputs / Fields

- **Style:** Device selects and terminal inputs use near-black fields, high-contrast ink, and compact geometry. Selects are 38px high with a 9px radius and visible border; the terminal input remains borderless inside its structured prompt row.
- **Focus:** Use the soft-cobalt focus outline already established for controls; do not rely on a color shift alone.
- **Error / Disabled:** Error copy turns semantic red; muted cards and disabled fields retain legibility while clearly losing affordance.

### Navigation

- **Style:** The upper-right Presenter Studio toolbar is a 13px-radius solid panel with a thin cobalt top rule. Controls use consistent inline SVG line icons; the active control becomes a cobalt square.
- **Progress:** The bottom HUD combines a truncated uppercase title, segmented slide rail, and monospaced count. The current segment is cobalt and thicker; completed segments become stronger neutral lines.
- **Responsive:** Labels compress before controls disappear. Core setup, media, recording, and keyboard focus behavior remain available at narrow widths.

### Presenter Setup Wizard

The setup wizard is permission-safe by construction: mode selection precedes browser permission requests, media and screen access occur only after explicit action, and every preflight state has ready, warning, or error feedback. The modal traps focus, restores prior focus on close, hides the stage from assistive technology while open, and keeps its footer actions persistent while the body scrolls.

### Camera PIP and Console Dock

The camera is a mirrored 16:10 PIP with a draggable label, bounded resize, persisted position, and a visible frame that also carries into recordings. The console is a dense monospaced work surface that can float, resize, minimize, or dock; the dock splitter uses cobalt as the sole resize cue and never overlaps the resized desktop stage.

## Do's and Don'ts

### Do:

- **Do** preserve the warm-paper report and solid-dark studio as two coordinated but visually distinct realms.
- **Do** use cobalt for active state, progress, navigation, and selected data, with green/amber/red reserved for real meaning.
- **Do** use real inline SVG icons for controls and keep focus outlines visible against dark panels.
- **Do** keep ordinary section context in the source/footer line and preserve factual provenance on every financial slide.
- **Do** use grids, hairlines, tabular figures, and aligned baselines to make dense financial information scannable.
- **Do** retain the functional green-to-amber-to-red audio-meter gradient; it is a live threshold scale, not decorative color blending.
- **Do** keep selective shield and pin emoji when they act as explicit privacy or console wayfinding signals.

### Don't:

- **Don't** add decorative gradients to studio surfaces or report typography; solid fills and tonal layers are the system.
- **Don't** turn report charts, tables, or metrics into generic rounded shadow cards.
- **Don't** repeat decorative kickers above ordinary slide titles; cover badges and factual source context already provide hierarchy.
- **Don't** use glyph or emoji icons as the default control system. The shield and pin signals are narrow functional exceptions.
- **Don't** allow a docked console or persisted camera frame to obscure presentation content or action controls.
- **Don't** request camera, microphone, screen, or recording permission before a clear user action.
