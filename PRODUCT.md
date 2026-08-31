# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a finance and economic content creator preparing data-dense presentations for recorded video, executive review, and YouTube publishing. The working session combines analysis, narration, camera, microphone, slides, and occasional local shell commands.

## Product Purpose

Gamma Slides turns declarative financial reporting into presentation-ready interactive decks and high-quality local video. Success means that complex economic, accounting, market, and trading information is legible, credible, visually memorable, and practical to present without assembling several separate tools.

## Positioning

The product combines a finance-specific visualization catalog, an offline-capable slide runtime, and an embedded Presenter Studio for camera, audio, recording, navigation, and a localhost-only shell.

## Operating Context

Users prepare a deck from YAML or JSON, preview it in a browser, inspect financial charts and tables, configure media devices, present or record locally, and optionally upload the resulting master video elsewhere. The flagship artifact is the Q4 2025 revenue report in `src/schema/examples/corporate-demo.yaml`.

## Capabilities and Constraints

- Generated decks must work without a CDN.
- The catalog covers executive reporting, finance, accounting, markets, and trading indicators including OHLC, volume, Bollinger Bands, RSI, MACD, and OBV.
- Camera picture-in-picture is draggable, resizable, persisted, and composited into local recordings.
- Camera and microphone permissions are requested only after explicit user action, with device selection.
- Browser recording produces a high-quality local master; direct YouTube upload is not part of the current workflow.
- A real shell is available only through the localhost preview bridge and is disabled in static `file://` exports.
- Demonstration financial data and forward-looking statements are illustrative and must remain labeled as such.

## Brand Commitments

The product name is Gamma Slides. The experience must feel top-tier, professional, strongly opinionated, and suitable for economic and financial broadcasting. The user explicitly wants strong contrast, a coherent icon system, and selective emoji as functional wayfinding rather than decoration.

## Evidence on Hand

- Complete flagship deck: `src/schema/examples/corporate-demo.yaml`.
- Generated report: `output/q4-2025-revenue-report.html`.
- Automated unit, schema, and visual QA in `test/` and `src/qa/`.
- All business figures in the flagship are demonstration content; no customer claims or external validation should be fabricated.

## Product Principles

1. Financial information must remain legible under presentation pressure.
2. Advanced capability should be immediately discoverable without making the stage feel like an admin dashboard.
3. Media access and local command execution must remain explicit, secure, and reversible.
4. Visual sophistication must come from hierarchy, typography, data craft, and interaction—not ornamental chrome.
5. The recorded local master is the source of truth for publishing.

## Accessibility & Inclusion

Keyboard operation, visible focus, high contrast, reduced-motion support, semantic labels, and permission-safe recovery states are required throughout Presenter Studio.
