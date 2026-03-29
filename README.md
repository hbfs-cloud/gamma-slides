# gamma-slides

Professional presentation & video generator. Declarative YAML/JSON decks, narrated HD videos, 6 themes, YouTube-ready metadata, and LLM-pilotable via MCP.

**Think Gamma.app, but as a CLI + MCP server.**

## Quick Start

```bash
# Install
npm install

# Generate a presentation
node bin/gamma-slides.js generate -f src/schema/examples/corporate-demo.yaml

# Preview in browser
node bin/gamma-slides.js serve -f ./output/q4-2025-revenue-report.html

# Generate narrated video + subtitles + YouTube metadata
node bin/gamma-slides.js video -f src/schema/examples/corporate-demo.yaml

# Try different themes
node bin/gamma-slides.js generate -f deck.yaml --theme neon
node bin/gamma-slides.js generate -f deck.yaml --theme minimal
```

## Docker

```bash
# Build
docker compose build

# Generate
docker compose run fipto-slides generate -f src/schema/examples/corporate-demo.yaml

# Video
docker compose run fipto-slides video -f src/schema/examples/corporate-demo.yaml
```

## Commands

| Command | Description |
|---|---|
| `generate -f <deck>` | Generate HTML presentation |
| `video -f <deck>` | Generate narrated HD video + SRT + YouTube metadata |
| `serve -f <html>` | Preview in browser |
| `export -f <html>` | Export to PDF |
| `thumbnail -f <html>` | Generate thumbnail image |
| `validate -f <deck>` | Validate a deck spec |
| `themes` | List available themes |
| `voices` | List TTS voices |
| `mcp` | Start MCP server for LLM integration |

## Themes

| Theme | Style | Description |
|---|---|---|
| `corporate` | Dark blue | Professional business presentations |
| `startup` | Dark purple | Vibrant pitch decks |
| `dark` | Pure dark | Sleek high-contrast |
| `neon` | Electric | Neon accents on dark canvas |
| `minimal` | Light | Clean whitespace |
| `nature` | Earth tones | Warm organic feel |

## Deck Format

Write a YAML file — any LLM can produce this:

```yaml
version: "1"
meta:
  title: "My Presentation"
  author: "Jane Doe"
  company: "Acme Corp"
theme: "corporate"
narration:
  voice: "en-US-AndrewNeural"
slides:
  - layout: title
    title: "Welcome"
    narration: "Welcome to our presentation."
  - layout: metrics
    title: "KPIs"
    metrics:
      - label: "Revenue"
        value: "$10M"
        delta: "+50%"
        trend: up
  - layout: chart
    title: "Growth"
    chart:
      type: bar
      data:
        labels: ["Q1", "Q2", "Q3", "Q4"]
        datasets:
          - label: "Revenue"
            values: [2.5, 3.1, 3.8, 4.6]
            color: "primary"
  - layout: closing
    title: "Thank You"
```

### Layout Types

| Layout | Purpose |
|---|---|
| `title` | Opening slide with gradient title |
| `metrics` | KPI cards in grid |
| `chart` | Bar, line, doughnut, pie, radar, area |
| `split` | Two-panel (table+chart, chart+chart, etc.) |
| `table` | Data table with typed columns |
| `timeline` | Vertical timeline with icons |
| `bullets` | Icon + text list |
| `image` | Full/contained image with caption |
| `comparison` | Side-by-side positive/negative columns |
| `quote` | Testimonial with author |
| `closing` | Closing slide with optional KPIs |
| `blank` | Raw HTML passthrough |

## Video Output

Each video generates:
- `*.mp4` — 1920x1080 H.264 video with narration
- `*.srt` — Subtitles
- `*.description.txt` — YouTube description with chapters
- `*.tags.txt` — YouTube tags
- `*.meta.json` — Full metadata (chapters, tags, category, playlist)

## MCP Server (LLM Integration)

gamma-slides includes an MCP server so any LLM (Claude, Gemini, etc.) can generate presentations programmatically:

```json
{
  "mcpServers": {
    "gamma-slides": {
      "command": "node",
      "args": ["src/mcp/server.js"],
      "cwd": "/path/to/gamma-slides"
    }
  }
}
```

### MCP Tools

| Tool | Description |
|---|---|
| `gamma_generate_deck` | Generate HTML from YAML/JSON spec |
| `gamma_generate_video` | Generate narrated video |
| `gamma_validate_deck` | Validate deck spec |
| `gamma_list_themes` | List themes |
| `gamma_list_voices` | List TTS voices |
| `gamma_get_schema` | Get full JSON Schema |
| `gamma_generate_thumbnail` | Generate thumbnail from slide |
| `gamma_youtube_metadata` | Generate YouTube metadata |

## Setup (bare metal)

```bash
./setup.sh           # Check dependencies
./setup.sh --install # Auto-install everything (macOS/Linux)
```

Requirements: Node.js 18+, ffmpeg, Python 3, edge-tts

## Stack

- **Reveal.js** — slide rendering & transitions
- **Chart.js** — interactive charts
- **edge-tts** — Microsoft Neural TTS
- **ffmpeg** — video compositing
- **Puppeteer** — screenshots & PDF
- **MCP SDK** — LLM integration
- **AJV** — schema validation

## License

MIT
