# Contrarian review: professional operating-system pass

Date: 2026-09-12. Scope: the desktop Author/Stage workflow, publication and backup paths, corporate identity, live browser/terminal utilities, and release evidence.

## Verdict

**Do not call the repository universally bug-free or universally distribution-complete.** The final dedicated-Chromium unit/integration run passed 144 tests with zero skipped; the 109-scenario browser endurance run passed with zero skipped at `GAMMA_ENDURANCE_SECONDS=60`; the now-110-scenario matrix received a final focused 15/15 regression pass with zero skipped; and the rebuilt package native smoke passed with exit 0 after the Stage-load race fix. The remaining gaps are owner-authorized, signing, and hardware gates—not cosmetic caveats.

## What holds up under hostile review

| Claim | Evidence | Why it survives review |
| --- | --- | --- |
| Last-minute edits can be recovered | Unit coverage for the 40-entry local ledger; restore snapshots the current source first | A restored revision cannot silently discard the draft that preceded it. |
| Public embedding has a safe default | Unit contract rejects local/non-HTTPS origins and asserts lazy fullscreen iframe/referrer policy | It does not offer a copy-paste iframe for a local or private URL. |
| Google backup does not leak a presentation environment | Source-only upload test, `.yaml/.json/.md` allowlist, `drive.file` scope, local token path, Author-window-only IPC | OAuth is explicit; no app claims an account is connected before consent. |
| Corporate branding does not flatten a deck | Source transformation test preserves slide content and unsupported Gamma structure | It affects deck-level identity only, and existing decks require an explicit Apply action. |
| Live browser/terminal cannot silently become remote control | Browser/terminal contracts and MCP action approval boundary | Static/shared output never receives a shell bridge; sensitive live actions still require a local operator. |
| Native workflow regressions are caught before packaging | The rebuilt arm64 package smoke passed Writer height, connection recovery, stable live Archify, three themes, MCP approval, stop/edit/Present, and cue privacy; four loader tests cover the Stage-load race | The final package exercised the source-level race fix rather than merely containing it. |

## Open risks and required closure

1. **Execution must test what the user sees.** The completed 109-scenario browser endurance pass and final focused 15/15 regression (immersive, desktop connections, public gallery) used the permitted macOS context rather than treating sandbox LaunchServices failures as a host fault. They exposed previews hidden by the theme chooser, stale tests clicking hidden controls, Writer preview-height overflow, and mobile 3D-axis overlap. The visual fixes are inspected and covered by targeted checks; see [quality evidence](quality-evidence.md).
2. **Packaging is not equivalent to launching the package.** The release workflow now runs unit and browser gates before packaging, checks package-version/tag equality, verifies the DMG/ZIP, and runs the actual packaged smoke before release. The rebuilt package smoke passed after the `ERR_ABORTED` Stage-load and template-button broadcast fixes.
3. **The app is unsigned/not notarized.** No Developer ID certificate or notarization credentials are available. A real customer distribution needs signing, notarization, checksum verification, and a fresh Finder launch smoke.
4. **Google consent cannot be certified with mocks.** OAuth state, credential import, refresh/revocation, bounded downloads and draft restore are covered by injected clients; the real Connect & share UI is exercised separately. An owner must still authorize their own Desktop OAuth client and verify the account’s behavior. Source-only backup is not a full media archive.
5. **Desktop publishing is intentionally constrained.** Connect & share detects existing `gh`/`vercel` sessions; it does not provide app-owned OAuth for them. GitHub requires an existing Gamma Pages workflow, and Vercel an explicitly linked project. Publishing includes notes and embedded content after confirmation; receipts say submitted, not verified. The generated rich GitHub deck is not a round-trip copy of the original Markdown.
6. **The Stage-load and broadcast fixes need continued regression coverage.** The rebuilt package now exercised the Stage revision loader’s concurrent-load fix (four focused tests) and stable template buttons across broadcasts. Keep those focused contracts because asynchronous window navigation is sensitive to future lifecycle changes.
7. **Writer hides markup but is not a WYSIWYG canvas.** The document-first flow keeps Markdown markers out of the default writing surface, preserves an expert source escape hatch and rich YAML/JSON fidelity, and deliberately does not claim visual-handle editing.
8. **Resource limits are designed and tested at component level, not benchmarked on a hardware matrix.** GPU scenes bound their canvas/work; terminal output/timeouts and media paths are bounded. A release needs real M-series and Intel macOS profiling with large decks, video, recording, and an external display.
9. **Third-party embed behavior is host-dependent.** The iframe contract is portable, but Notion/Linear workspace policy, CSP, and Vercel configuration must be checked in the actual target accounts.

## Promotion decision

Promote the verified capabilities and their limits. Do not promote “all integrations connected”, “tested on every device”, “notarized”, “100% bug-free”, or “full iA Presenter replacement” until the listed gates are closed.
