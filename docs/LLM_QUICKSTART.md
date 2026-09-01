# Claude, Codex, and presentation CRUD

Gamma Slides gives Claude Code and Codex the same MCP tools: schema and flagship resources, a premium-deck prompt, validation, HTML and video generation, static-site generation, and GitHub Pages CRUD.

## One line, once

```bash
npm install --global --loglevel=error https://github.com/hbfs-cloud/gamma-slides/archive/refs/heads/main.tar.gz && gamma-slides setup
```

This installs the current GitHub version, detects installed Claude Code and Codex clients, and registers a user-scoped `gamma-slides` MCP server in each. The registered command uses the absolute path of the global installation, so it does not depend on a project clone or download dependencies on every session.

```text
/absolute/global/node /absolute/global/gamma-slides/bin/gamma-slides.js mcp
```

The setup therefore has no clone-specific absolute path. Run `/mcp`, `claude mcp get gamma-slides`, or `codex mcp list` to check it.

To connect only one client or use your own fork as the deployment library:

```bash
gamma-slides setup --client claude
gamma-slides setup --client codex --repo your-user/gamma-slides
```

The committed `.mcp.json` and `.codex/config.toml` remain useful when working inside this repository, but they are no longer the primary installation path.

## Ask for a deck

Use the MCP prompt `create_presentation`, or ask directly:

> Create a 12-slide board presentation in French about our FY2026 operating plan for the executive committee. Use only the facts in `brief.md`. Build a strong decision narrative, use live ECharts where quantitative evidence helps, validate the YAML, deploy it as `fy26-plan`, and return the public URL.

The reliable agent workflow is:

1. Read `gamma://schema/deck` and, when useful, `gamma://examples/flagship`.
2. Choose one of the three presentation themes based on audience and intent.
3. Author a varied, sourced, branded deck with concise copy and narration.
4. Call `gamma_validate_deck`, fix all errors, then call `gamma_deploy_site` with a stable slug.

## CRUD without an agent

Authenticate once before managed writes:

```bash
gh auth login
```

Create and Update use the same command and slug:

```bash
gamma-slides deploy -f deck.yaml --slug fy26-plan
gamma-slides deploy -f revised-deck.yaml --slug fy26-plan
```

Read, list, open, and delete:

```bash
gamma-slides sites
gamma-slides pull fy26-plan -o deck.yaml
gamma-slides open-site fy26-plan
gamma-slides delete-site fy26-plan --yes
```

Each source lives under `presentations/<slug>.yaml` in GitHub. Every create, update, or delete triggers `.github/workflows/pages.yml`, which rebuilds the public library and the stable route `https://OWNER.github.io/REPOSITORY/<slug>/`.

For another repository, add `--repo owner/repository` or set `GAMMA_SLIDES_REPO=owner/repository`. GitHub Pages must use **Settings → Pages → Source: GitHub Actions** once in that repository.

## Build a standalone site without GitHub

```bash
node bin/gamma-slides.js site \
  -f src/schema/examples/corporate-demo.yaml \
  -o site
```

The output contains a self-contained `site/index.html` and `.nojekyll`, ready for any static host.
