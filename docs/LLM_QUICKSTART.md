# Use Gamma Slides with Claude or Codex

Gamma Slides includes a project-scoped MCP server. It gives an agent the deck schema, the full flagship example, a premium-deck prompt, validation, HTML generation, video generation, and static-site generation.

## Install

```bash
npm install
```

Open this repository in Claude Code or Codex and approve the project MCP server when prompted. The committed `.mcp.json` configures Claude Code; `.codex/config.toml` configures Codex.

To add it manually from another directory:

```bash
claude mcp add --transport stdio gamma-slides -- node /absolute/path/to/gamma-slides/bin/gamma-slides.js mcp
codex mcp add gamma-slides -- node /absolute/path/to/gamma-slides/bin/gamma-slides.js mcp
```

Check the connection with `claude mcp get gamma-slides`, `codex mcp list`, or `/mcp` inside either client.

## Ask for a deck

Use the MCP prompt `create_presentation`, or ask directly:

> Create a 12-slide board presentation in French about our FY2026 operating plan for the executive committee. Use only the facts in `brief.md`. Build a strong decision narrative, use live ECharts where quantitative evidence helps, validate the YAML, then generate the static site and return its `index.html` path.

The reliable agent workflow is:

1. Read `gamma://schema/deck` and, when useful, `gamma://examples/flagship`.
2. Choose one of the three presentation themes based on audience and intent.
3. Author a varied, sourced, branded deck with concise copy and narration.
4. Call `gamma_validate_deck`, fix all errors, then call `gamma_build_site`.

## Build and publish without an agent

```bash
node bin/gamma-slides.js site \
  -f src/schema/examples/corporate-demo.yaml \
  -o site
```

The output contains a self-contained `site/index.html` and `.nojekyll`, ready for any static host.

This repository also ships `.github/workflows/pages.yml`. Enable **Settings → Pages → Source: GitHub Actions** once. Every relevant push to `main` then rebuilds and publishes the flagship deck on GitHub Pages.
