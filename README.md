# gamma-slides

Professional presentation & video generator. Declarative YAML/JSON decks, narrated HD videos, 6 themes, YouTube publish, and LLM-pilotable via MCP.

**Think Gamma.app, but as a CLI + MCP server.**

## Install & Use (npx)

No install needed — run directly from GitHub:

```bash
# Generate a presentation
npx github:hbfs-cloud/gamma-slides generate -f deck.yaml

# Generate a narrated video
npx github:hbfs-cloud/gamma-slides video -f deck.yaml

# List themes
npx github:hbfs-cloud/gamma-slides themes

# List voices
npx github:hbfs-cloud/gamma-slides voices

# Validate a deck
npx github:hbfs-cloud/gamma-slides validate -f deck.yaml
```

## Install Locally

```bash
git clone https://github.com/hbfs-cloud/gamma-slides.git
cd gamma-slides
npm install

# Run
gamma-slides generate -f src/schema/examples/corporate-demo.yaml
gamma-slides video -f src/schema/examples/corporate-demo.yaml
gamma-slides serve -f ./output/q4-2025-revenue-report.html
```

## Docker

```bash
docker compose build

docker compose run gamma-slides generate -f src/schema/examples/corporate-demo.yaml
docker compose run gamma-slides video -f src/schema/examples/corporate-demo.yaml
```

## Commands

| Command | Description |
|---|---|
| `generate -f <deck>` | YAML/JSON → HTML presentation |
| `video -f <deck>` | YAML/JSON → MP4 + SRT + YouTube metadata |
| `serve -f <html>` | Preview in browser |
| `export -f <html>` | Export to PDF |
| `thumbnail -f <html>` | Generate thumbnail PNG |
| `validate -f <deck>` | Validate a deck spec |
| `publish -f <mp4>` | Upload to YouTube |
| `youtube-auth` | YouTube OAuth setup (one-time) |
| `themes` | List available themes |
| `voices -l <lang>` | List TTS voices |
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
    columns: 3
    metrics:
      - label: "Revenue"
        value: "$10M"
        delta: "+50%"
        trend: up
        icon: "dollar-sign"
      - label: "Growth"
        value: "95%"
        delta: "+30pp"
        trend: up
        icon: "trending-up"
      - label: "Clients"
        value: "85"
        delta: "+67 new"
        trend: up
        icon: "users"

  - layout: chart
    title: "Revenue by Quarter"
    chart:
      type: bar
      data:
        labels: ["Q1", "Q2", "Q3", "Q4"]
        datasets:
          - label: "Revenue"
            values: [2500000, 3100000, 3800000, 4600000]
            color: "primary"

  - layout: closing
    title: "Thank You"
    narration: "Thank you for your attention."
```

### Layout Types

| Layout | Purpose | Key Fields |
|---|---|---|
| `title` | Opening slide | `title`, `subtitle`, `badge` |
| `metrics` | KPI cards grid | `metrics[]` (label, value, delta, trend, icon) |
| `chart` | ECharts chart | `chart` (type: bar/line/doughnut/pie/radar/area) |
| `split` | Two-panel layout | `left` + `right` (chart, table, metrics, bullets, image) |
| `table` | Data table | `table` (headers, rows, column_types) |
| `timeline` | Vertical timeline | `items[]` (title, description, icon) |
| `bullets` | Icon + text list | `items[]` (text, icon) |
| `image` | Image with caption | `image` (src, alt, fit, caption) |
| `comparison` | Side-by-side | `columns[]` (heading, items, style: positive/negative) |
| `quote` | Testimonial | `quote`, `author`, `role` |
| `closing` | Closing slide | `title`, `metrics[]`, `contact` |
| `blank` | Raw HTML | `html` |

## Video Output

Each `video` command generates:

```
output/
  my-presentation.mp4              # 1920x1080 H.264 + AAC narration
  my-presentation.srt              # Subtitles
  my-presentation.description.txt  # YouTube description with chapters
  my-presentation.tags.txt         # YouTube tags
  my-presentation.meta.json        # Full metadata
```

## YouTube Publish

```bash
# One-time: set up OAuth credentials
# 1. Create OAuth Client ID at https://console.cloud.google.com/apis/credentials
# 2. Enable YouTube Data API v3
# 3. Save credentials:
mkdir -p ~/.gamma-slides
cp client_secret_*.json ~/.gamma-slides/youtube-credentials.json

# Authenticate
gamma-slides youtube-auth

# Publish (unlisted by default)
gamma-slides publish -f ./output/my-presentation.mp4

# Publish as public with custom thumbnail
gamma-slides publish -f ./output/my-presentation.mp4 --privacy public --thumb-text "Q4 Report"
```

Auto-reads `*.meta.json`, `*.description.txt`, `*.tags.txt` generated alongside the video. Creates playlists and sets thumbnails automatically.

## MCP Server (LLM Integration)

Any LLM (Claude, Gemini, etc.) can generate presentations via MCP:

**Claude Code** — add to `~/.claude/settings.json`:

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

**Slash command** — copy to `~/.claude/commands/`:

```bash
cp gamma-slides/.claude-commands/gamma-slides.md ~/.claude/commands/
```

Then in any Claude Code conversation: `/gamma-slides create a pitch deck for my fintech startup`

### MCP Tools

| Tool | Description |
|---|---|
| `gamma_generate_deck` | YAML/JSON → HTML |
| `gamma_generate_video` | YAML/JSON → MP4 + SRT + metadata |
| `gamma_validate_deck` | Validate deck spec |
| `gamma_list_themes` | List themes |
| `gamma_list_voices` | List TTS voices |
| `gamma_get_schema` | Get full JSON Schema |
| `gamma_generate_thumbnail` | Screenshot slide as PNG |

## Requirements

| Dependency | Required for | Install |
|---|---|---|
| Node.js 18+ | Everything | `brew install node` |
| ffmpeg | Video | `brew install ffmpeg` |
| Python 3 | Video | `brew install python3` |
| edge-tts | Video narration | `pip install edge-tts` |

Or auto-install: `./setup.sh --install`

## Stack

- **Reveal.js** — slide rendering & transitions
- **ECharts** — rich interactive charts
- **edge-tts** — Microsoft Neural TTS (20+ languages)
- **ffmpeg** — video compositing
- **Puppeteer** — screenshots & PDF
- **MCP SDK** — LLM integration
- **googleapis** — YouTube upload

## License

MIT
