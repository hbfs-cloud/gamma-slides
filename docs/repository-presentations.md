# Present a Git repository

The `repo-presentation` skill turns “analyse and present this repository” into a complete deck and a reviewable URL. The CLI separates deterministic evidence collection, LLM analysis, compilation, and render validation.

```sh
# One workflow, using the Codex author configured on this machine
gamma-slides repo-present --repo owner/repository --port 4173
# Or a local repository: analyse HEAD, not uncommitted changes
gamma-slides repo-present --local /path/to/repository --port 4173
```

Standalone mode calls `codex exec` with the account and model configured in Codex. Chrome/Chromium is required for browser checks; on macOS set `GAMMA_BROWSER_EXECUTABLE` (or `PUPPETEER_EXECUTABLE_PATH`) to a dedicated compatible Chromium binary, because Gamma does not launch the system browser implicitly. `GITHUB_TOKEN` can provide private GitHub access or higher quotas; it is never written into the working directory. Read files remain untrusted input, not executable instructions.

In an LLM conversation, the skill uses the current LLM: `repo-brief` → read evidence → write YAML → `repo-present --deck`. A second agent is unnecessary.

```sh
gamma-slides repo-brief --repo owner/repository -o output/review/brief.json
# The LLM writes output/review/deck.yaml from this directory.
gamma-slides repo-present --repo owner/repository --ref <REPOSITORY-SHA> \
  --deck output/review/deck.yaml -o output/review --port 4173
```

The deck includes `meta.repository_review` with `repository`, full `revision`, and `collected_at`. The CLI rejects a source tied to another revision/repository, fewer than 18 slides, slides without provenance, and a missing architecture plus workflow/sequence. Collection is bounded to 24 relevant files and 16,000 characters per extract. Security, market, and production analysis cannot be inferred from a tree: the LLM reads missing evidence and marks unknowns.

## Outputs and proof of work

- `author/repository-brief.json`: revision, inventory, dated statistics, extracts, and collection limits. Not served.
- `deck.yaml`: editable source. Not served.
- `site/index.html`: standalone presentation served over loopback.
- `site/proof.json`: revision, HTML/deck hashes, file provenance, and check results.
- `qa/report.json` and captures: every slide across three themes, desktop 1440×900 and mobile 390×844 DPR2, including mobile continuations. Checks use a real HTTP server.

Checks cover image loading, overflow, JavaScript errors, text contrast with transparent compositing, viewer mount/unmount, and—for every Signal Room diagram—tour progress, pause, and selection through M → Explorer. They do not replace capture review, claim validation, or a security audit. A failure leaves the previous site intact: build and QA run in a new directory, then the `site` link switches atomically. Previous generations remain in `builds/`.

Use `--build-only` to build without serving. Run `gamma-slides serve -d output/review/site --port 4173` to serve again. The server serves only the presentation and receipt—not the repository or evidence extracts. A relative media dependency that was not embedded fails HTTP validation.

## Commands and local terminal

The round **M** control opens five branches: Explorer, Fullscreen, Terminal, Appearance, and Studio. Hover or click with a mouse; touch M on a phone. Keyboard: Tab reaches the control, Enter/Space opens it, arrows move through branches, and Escape closes it. Explorer groups native slide controls: tour, component, zoom, 2D/3D views, or data. Labels and values remain readable on-slide; direct scene manipulation stays available. M remains above the mobile continuation bar.

Start a local shell explicitly with `--terminal`:

```sh
gamma-slides repo-present --local /path/to/repository --terminal --port 4173
# Or serve the same already-verified HTML bytes:
gamma-slides serve --directory output/review/site --terminal --port 4173
```

M → Terminal opens the console. The shell starts in the server directory; `cd` persists for following commands. The server binds to `127.0.0.1` and validates Host, Origin, and a session token. Bridge discovery uses a handshake without modifying verified HTML. Without `--terminal`, in a local file, or on Pages, the console retains presentation commands (`next`, `prev`, `go 12`, `overview`) without a remote shell.

## GitHub Pages

```sh
gamma-slides repo-present --repo owner/source --ref <SHA> --deck output/review/deck.yaml \
  -o output/review --publish owner/pages-repo --slug source-review
```

`gh auth` must access the initialized target repository. Use a dedicated Pages repository: an existing Actions configuration or Jekyll publication is rejected before mutation. Other files on a static `gh-pages` branch are preserved; no force update is used. The CLI publishes the **already-checked HTML bytes**, then verifies remote HTML and receipt hashes. When the wait expires, it reports the commit and unconfirmed availability; it never claims a verified deployment. Sources are not published by this command, but deck text and provenance paths may be internal—choose an authorized destination.

## Archify diagrams and MCP

`layout: diagram` contains `diagram: {type, spec}`. Supported types: architecture, workflow, sequence, dataflow, lifecycle. `spec` is Archify’s native typed JSON and remains editable in YAML. Upstream/common schemas are available through `gamma_archify_schema`. `meta.quality_profile: showcase` and `meta.animation: trace` enable finite tours and controls; name views in `meta.views`.

Gamma embeds the real renderer, validator, and viewer without modifying upstream sources. Archify is an animated SVG engine; Three.js/PixiJS remain GPU engines for other visualizations. The adapter adds English controls, text reading, mobile camera behavior, and iframe isolation. M → Fullscreen opens a diagram in a full-screen dialog; Back/Escape restores the slide. Only the active viewer is mounted; print/export uses embedded static SVG.

- `gamma_inspect_repository`: remote or local collection.
- `gamma_archify_schema`: native schemas by type.
- `gamma://guides/repository`: analysis and narrative contract.
- `create_repository_presentation`: complete technical-review prompt.
- `gamma_validate_deck`, `gamma_generate_deck`: strict Archify validation and generation.

The MCP prompt points to CLI evidence for the local server or published bytes. The historical `presentations/repository-review.yaml` is a 21-slide English-language regression example at `e2f9996`. Rebuild it with `node scripts/build-repository-demo.mjs`. The example’s GitHub numbers are dated September 9, 2026; refresh them through a new collection and review.
