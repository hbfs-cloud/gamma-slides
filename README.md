# Gamma Slides

An editorial presentation and local video engine for finance, markets, economics, and board reporting. Decks are authored in YAML or JSON, rendered as self-contained interactive HTML, exported as vector-friendly PDF, and recorded or narrated into high-quality local video masters.

## One-line setup for Claude and Codex

With Node.js installed, run this once from any directory:

```bash
npm install --global --loglevel=error https://github.com/hbfs-cloud/gamma-slides/archive/refs/heads/main.tar.gz && gamma-slides setup
```

It installs the current GitHub version and connects its MCP server to every installed client it finds: Claude Code and/or Codex. The registered command uses the stable global installation path, not this clone. Verify it with `/mcp`, `claude mcp get gamma-slides`, or `codex mcp list`.

Then ask the agent in plain language:

> Create a premium 12-slide presentation in French from `brief.md`, validate every slide, deploy it as `fy26-plan`, and return the public URL. Never invent facts.

The agent can inspect the schema and flagship example, choose among the three themes, generate live ECharts, validate the deck, and create or update its stable GitHub Pages URL.

## Deploy and manage presentations

Publishing uses the free GitHub Pages site at [hbfs-cloud.github.io/gamma-slides](https://hbfs-cloud.github.io/gamma-slides/). Run `gh auth login` once before the first write. A deployment usually appears after the GitHub Actions run completes.

These are the five commands to remember:

```bash
# Create a public presentation, or update it later with the same slug
gamma-slides deploy -f deck.yaml --slug fy26-plan

# List every managed presentation and URL
gamma-slides sites

# Download the editable source
gamma-slides pull fy26-plan -o deck.yaml

# Open it
gamma-slides open-site fy26-plan

# Delete it after explicit confirmation
gamma-slides delete-site fy26-plan --yes
```

`deploy` is both Create and Update: the slug is the stable ID and URL. `pull` is Read. `delete-site` removes the source and the next Pages build removes the public route. For a fork or another Pages repository, append `--repo owner/repository`; configure that default for both agents with `setup --repo owner/repository`.

See [the complete Claude/Codex and CRUD guide](docs/LLM_QUICKSTART.md).

## Local development

```bash
npm install
node bin/gamma-slides.js generate \
  -f src/schema/examples/corporate-demo.yaml \
  -o output/q4-2025-revenue-report.html

node bin/gamma-slides.js preview \
  -f src/schema/examples/corporate-demo.yaml \
  --terminal

node bin/gamma-slides.js site \
  -f src/schema/examples/corporate-demo.yaml \
  -o site
```

The 38-slide flagship exercises the complete **Gamma Finance Catalog v1**: 28 curated native ECharts families and finance-specific compositions across corporate reporting, markets, trading, portfolio, risk, liquidity, rates, and economics. Its 37 chart instances include a multi-pane stock workstation, market depth, return histogram, boxplot, calendar heatmap, parallel coordinates, sunburst allocation, exposure network, theme river, and forecast fan. This is a bounded product catalogue—not a claim that every ECharts module is exposed.

Reveal, ECharts, and the presentation fonts are embedded from pinned npm packages. A generated deck does not need a CDN, Google Fonts, or a network connection to present, export, or record.

## Presenter Studio

Interactive decks open with a four-step, permission-safe setup wizard: choose one of three presentation themes; select present-only, camera, microphone, recording, or terminal; preview devices and the shared screen; then review readiness before a 3–2–1 recording countdown. The facecam PiP is draggable, resizable, persisted across sessions, and composed at the same position in the local master. No browser permission is requested before an explicit click.

| Shortcut | Action |
| --- | --- |
| `T` | Open the embedded presentation terminal |
| `C` | Toggle the camera picture-in-picture |
| `R` | Open recording setup or focus the active recording controls |
| `P` | Pause or resume the active recording |
| `S` | Open speaker notes |
| `F` | Toggle fullscreen |

The Studio Console opens as a docked split view so it does not cover the slide. Its left splitter controls the workspace ratio; the header can float, redock, minimize, restore, or close the console, and the chosen geometry is remembered. Shell state is sessionful: `cd` changes the working directory for following commands, the current path and execution status remain visible, command history survives reloads, and quick actions cover common checks. It is intentionally disabled in a static `file://` export. Start preview with `--terminal` to enable it; commands such as `pwd`, `ls`, `npm test`, or `node --version` run directly, while presentation commands such as `next`, `prev`, `go 12`, `overview`, `camera`, and `record` remain available. The bridge is bound to localhost and protected by a per-session token.

## Quality assurance and exports

```bash
node bin/gamma-slides.js validate -f src/schema/examples/corporate-demo.yaml
node bin/gamma-slides.js qa --live -f output/q4-2025-revenue-report.html
node bin/gamma-slides.js qa -f output/q4-2025-revenue-report.html
node bin/gamma-slides.js export \
  -f output/q4-2025-revenue-report.html \
  -o output/q4-2025-revenue-report.pdf
node bin/gamma-slides.js video \
  -f src/schema/examples/corporate-demo.yaml \
  -o output/q4-2025-revenue-report.mp4
```

Live and export modes both render ECharts as SVG. Charts initialize only when their slide becomes visible, avoiding a deck-wide hidden Canvas allocation. Visual QA can exercise the real interactive runtime with `--live`; it verifies the startup wizard, renderer presence, non-empty SVG geometry, console chart warnings, invalid data tokens, overflow, clipping, and source/footer collisions on every slide. Export QA remains available without `--live`.

The video renderer works slide by slide: each PNG and narration file is deleted immediately after its compressed segment is produced. The temporary workspace is removed on success or failure.

## Local video master

Presenter Studio records the chosen screen, microphone, shared audio, and optional movable facecam into a local 1080p WebM master. Nothing is uploaded automatically. The resulting file can be reviewed, edited, converted, archived, or uploaded manually to YouTube.

For a narrated MP4 generated directly from the deck:

```bash
node bin/gamma-slides.js video \
  -f src/schema/examples/corporate-demo.yaml \
  -o output/q4-2025-master.mp4
```

The offline renderer produces H.264 at CRF 18 with AAC audio, creates slides and narration as a rolling stream, and deletes temporary frames and audio immediately after each compressed segment is produced.

## Requirements

- Node.js 18+
- GitHub CLI authenticated with `gh auth login` for managed web deployments
- Chromium or Chrome (Puppeteer can provision it)
- FFmpeg and FFprobe for video
- `edge-tts` for narration

All example company, market, financial, and forecast data in the flagship deck is explicitly illustrative (`DEMO`).
