# fipto-slides

CLI tool to generate rich, animated presentations for accounting and fintech topics — built for [Fipto](https://fipto.com), cross-border payments powered by stablecoins.

Think **Gamma.app**, but as a CLI with narrated video export.

## Features

- **3 templates**: FEC (General Ledger Export), Consolidation, Revenue Model
- **Rich slides**: Reveal.js + Chart.js with animated transitions
- **Narrated video**: Auto-generated HD video with neural TTS (edge-tts)
- **PDF export**: Via Puppeteer
- **Live preview**: Local server with hot reload
- **Fipto theme**: Dark mode with purple/green gradient, metric cards, data tables
- **Mock data**: Realistic fintech accounting data (stablecoin wallets, cross-border flows)

## Quick Start

```bash
npm install

# Generate a presentation
node bin/fipto-slides.js generate -t revenue-model

# Preview in browser
node bin/fipto-slides.js serve -f ./output/revenue-model.html

# Generate narrated video (requires edge-tts + ffmpeg)
node bin/fipto-slides.js video -t revenue-model

# Export to PDF
node bin/fipto-slides.js export -f ./output/revenue-model.html
```

## Commands

| Command | Description |
|---|---|
| `generate -t <template>` | Generate HTML slides |
| `serve -f <file>` | Live preview in browser |
| `export -f <file>` | Export to PDF |
| `video -t <template>` | Generate narrated HD video |
| `list` | List available templates |

## Templates

| Template | Slides | Content |
|---|---|---|
| `fec` | 10 | KPIs, trial balance, journal entries, compliance, stablecoin accounting |
| `consolidation` | 10 | Group scope (5 entities), IC eliminations, consolidated P&L/BS, FX impact |
| `revenue-model` | 10 | 5 revenue streams, unit economics, cohorts, quarterly trajectory, projections |

## Options

```
--template, -t    Template name (fec, consolidation, revenue-model)
--output, -o      Output file path
--theme           Visual theme: fipto (default), dark, light
--title           Custom presentation title
--data            External JSON data file
```

## Video Generation

Requires:
- [edge-tts](https://github.com/rany2/edge-tts): `pip install edge-tts`
- [ffmpeg](https://ffmpeg.org/): `brew install ffmpeg`

The video pipeline:
1. Generates narration audio per slide using Microsoft Neural TTS
2. Captures 1920x1080 screenshots via Puppeteer
3. Composites each slide with synchronized audio + fade transitions
4. Concatenates into a final MP4 (H.264 + AAC)

## Stack

- **Node.js** CLI with Commander.js
- **Reveal.js** for slide rendering
- **Chart.js** for interactive charts
- **Puppeteer** for screenshots & PDF
- **edge-tts** for neural voice narration
- **ffmpeg** for video compositing

## License

MIT
