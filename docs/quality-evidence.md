# Quality evidence and release gates

Gamma Presenter is a presentation runtime with native macOS surfaces, local media and GPU scenes, a local AI control boundary, and static publication. No single test type can certify all of that. This page records what passed for the current release, what is intentionally bounded, and the remaining owner- or hardware-dependent gates.

## Executable gates

| Layer | Command | What it proves | Current boundary |
| --- | --- | --- | --- |
| Unit and integration | `bun run test` | Schema/rendering contracts, source transformations, Writer semantics, revisions, corporate profiles, MCP authorization, terminal protocol, sharing, Drive download/restore boundaries, and injected delivery clients | 144 tests passed with zero skipped using the dedicated Chromium configuration. Injected provider tests do not prove real account consent or access. |
| Browser interaction | `bun run test:browser` | Real Chromium interactions: themes, responsive layouts, recording, browser/terminal streams, live-gallery lifecycle and desktop connection-panel recovery | The completed 109-scenario endurance run passed with zero skipped at `GAMMA_ENDURANCE_SECONDS=60`. The browser matrix is now 110; its final focused regression passed 15/15 with zero skipped (immersive 7, desktop connections 6, public gallery 2). Ubuntu CI uses Xvfb for headed capture tests and retains evidence for seven days. Viewport emulation is not a physical-device matrix. |
| Static delivery | `gamma-slides site` / `gamma-slides deploy`; Author **Connect & share** | Self-contained output, stable GitHub source/receipt workflow, and isolated Vercel staging | Desktop submission is explicitly unverified until its URL is checked. Provider authentication remains with the owner’s CLIs. |
| Native package | `bun run desktop:package` and `bun run desktop:smoke` | The rebuilt arm64 package smoke passed with exit 0: Writer height, connection status/error recovery, stable live Archify template, three themes, authenticated MCP approval, stop → Author → edit → Present, and cue privacy (Speaker only, absent from Stage). | Current-package DMG/ZIP integrity completed successfully. Signing/notarization and real camera/microphone/multi-display checks remain separate gates. |
| Visual design | Impeccable detector plus captured desktop/mobile review | Token consistency, interaction contracts and inspected product states | The detector currently lacks its optional HTML/CSS parsers in this checkout, so it is a supplementary signal—not visual certification. |

## Product reliability rules

- The Stage browser only starts a configured dedicated Chromium on macOS; Gamma does not launch the user’s Chrome implicitly.
- Local CLI co-pilots are an explicit Author action. Desktop MCP cannot execute arbitrary shell, write files, or deploy. Sensitive Stage capture requests require a visible operator approval.
- Google Drive uses an operator-owned OAuth client, `drive.file` only, a local token file, and source-only uploads. Downloads are tagged, size-bounded and validated; restore opens an unsaved draft and preserves the previous draft. Referenced local media is not backed up; speaker notes in source are.
- Public embeds accept public HTTPS URLs only and emit a lazy, fullscreen-capable iframe with a strict referrer policy. Static Pages cannot expose the local terminal bridge.
- Corporate profiles touch deck-level identity only. Existing decks are not auto-rebranded; template auto-branding is opt-in.
- Interactive media, GPU scenes, and browser/terminal demonstrations remain runtime experiences. PDF/PNG/PowerPoint exports preserve an honest static/semantic representation rather than claiming equivalence.

## Latest local evidence — 2026-09-12

- The final dedicated-Chromium unit/integration run passed 144 tests with zero skipped. The full 109-scenario browser endurance run passed with `GAMMA_ENDURANCE_SECONDS=60` and zero skipped. The matrix is now 110; the final focused regression passed 15/15 in 47.8 seconds with zero skipped: immersive (7), desktop connections (6), and public gallery (2). Retained evidence includes `output/final-focused/`, `output/immersive-qa/`, and `output/public-gallery/`.
- Writer preview-height and mobile 3D-axis caption/tick overlap fixes are verified by the targeted checks and inspected screenshots.
- A concurrent Stage `loadURL` race that could produce `ERR_ABORTED` is fixed by the four-case `stage-loader` contract and a native source smoke. A stable template-button DOM across broadcasts is also fixed and passed native source smoke.
- The rebuilt v2.0.4 arm64 package native smoke passed with exit 0 after the later race fixes, covering Writer height, connections, stable Archify template, three themes, MCP approval, stop/edit/Present, and private-cue Speaker-only behavior. Current-package DMG/ZIP integrity checks completed successfully.
- Quality and release workflows now run the unit and browser gates before packaging, require the package version to equal the tag, and verify DMG/ZIP plus the actual packaged smoke before releasing.
- Retained evidence: `output/public-gallery/` (desktop/mobile live previews), `output/immersive-qa/` (three themes, fallback and device views), `output/desktop-delivery/` (native Writer, connections, templates and theme report), and `output/playwright-results/` (failure traces when present).
- Earlier LaunchServices and `hdiutil` errors occurred inside the managed sandbox. The permitted macOS context can launch the test browsers and native app; those errors are not treated as a reason to skip execution.
- Impeccable review caught a status message scrolled out of view and previews hidden by onboarding. Both are fixed with behavioral regressions. The detector ran in degraded regex mode because optional parsers are absent; its typography finding was fixed using the documented scale. The magenta recording-test canary is an intentional detector exception, not product styling.
- Fresh English package captures are available at `docs/images/gamma-presenter-author-markdown.png` and `docs/images/gamma-presenter-author-rich.png`; the old French `author-chart` capture is no longer copied to or used by the site.
- Runtime GIFs are recorded with `scripts/agent/capture-runtime-gifs.mjs`: 36 real browser frames per scene, English content, ready WebGL, no theme chooser, and the existing clean-presentation mode. The script requires the runtime frame counter to advance during real camera/decomposition actions and caps each GIF at 3 MiB. First, middle and last frames are retained for review; these are recordings, not concept animations.

### Reusable post-deployment Pages check

The same public-gallery contract can target the deployed Pages URL without a separate workflow. It has not yet been run against the remote site:

```bash
GAMMA_GALLERY_BASE_URL=https://hbfs-cloud.github.io/gamma-slides/ GAMMA_GALLERY_EVIDENCE=output/deployed-gallery bunx playwright test qa/public-gallery.spec.js --reporter=list
```

### Publication status

The live site follows `main` independently of desktop packaging. Pages resolves the latest published macOS ZIP from GitHub release metadata; it does not construct a download to an unpublished package version. The current available desktop download is v2.0.3. The v2.0.4 tag did not produce a release because CI failed; local package evidence above is not a remote release sign-off.

Remote validation exposed missing recording tools, a mismatched browser, an Ubuntu sandbox restriction, and asynchronous isolated-browser teardown. The CI matrix now pins Chromium, installs FFmpeg, and divides Linux interaction tests into three shards. Two complete 1080p performance scenarios retain the strict >24 fps gate on macOS; the broadcast scenario passed, while the subsequent stream scenario requires teardown correction and a fresh run. These failures are not hidden by the earlier local pass.

The browser teardown correction now has two deterministic regressions: concurrent shutdown callers share completion, and a replacement browser waits for the previous process to close. The complete local suite passed 146/146 with zero skips after that correction. This rerun used `node --test --test-concurrency=1 test/*.test.js` because concurrent temporary artifacts exhausted the host disk; the earlier disk-full run is retained as failed evidence. Both strict macOS 1080p capture scenarios also passed locally, 2/2 in 16.7 seconds, after teardown correction. Linux 3D transition failures remain under investigation independently of the published gallery.

## Remaining release and distribution gates

1. Verify the generated site and any GitHub Pages update from its stable public URL; test iframe paste in the target Notion/Linear workspace where it will be used.
2. Complete owner-authorized Google Drive and Vercel consent/deployment checks where those integrations will be used.
3. Test real camera, microphone, selected external-display, and hardware performance paths on the intended macOS device matrix.
4. If distributing outside a development team, sign and notarize the exact macOS bundle with the owner’s Developer ID, then verify the published checksum.

Passing these gates gives evidence for the supported paths. It is more credible than calling a complex desktop/media product universally bug-free.
