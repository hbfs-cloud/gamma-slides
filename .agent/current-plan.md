# Objective

Livrer Gamma Presenter macOS avec une fenêtre de travail unique, un aperçu Gamma riche intégré et une chaîne de développement, CI et packaging pilotée par Bun.

## Reprise 2026-09-11 — hardening complet demandé

- [x] DONE — Transformer l'édition YAML/JSON riche en parcours guidé, avec inspecteur de slide, source localisée et persistance cohérente.
- [x] DONE — Rendre le pipeline de rendu/export déterministe, versionné et mesurable sur les decks lourds.
- [x] DONE — Corriger clavier/régie/accessibilité et isoler les bridges Electron par fenêtre.
- [x] DONE — Ajouter les tests ciblés Bun/Node, actualiser README/doc/captures et reconditionner macOS.
- [x] DONE — Complete the English-first pass across the shipped product and final macOS package.
- [x] DONE — Repackage and verify the arm64 ZIP deliverable after the isolated-browser crash-loop mitigation.
- [x] DONE — Restore host DMG creation and verify the final macOS disk image without disrupting active workloads.

# Context

- Le runtime web Gamma Slides possède déjà le rendu Reveal, les notes, le Presenter Studio, les thèmes et l'export d'impression.
- La référence iA Presenter apporte le modèle « écrire → montrer → façonner → présenter » : texte source, séparation scène/notes, vue orateur et handout.

# Plan

## Supersede iA Presenter program — reopened 2026-09-11

- [x] DONE — Make the authoring rail a complete document workflow: create, duplicate, delete, and reorder slides without forcing source surgery.
- [x] DONE — Add safe local media import and direct insertion for images, GIFs, video, and audio while preserving Markdown and rich Gamma source fidelity.
- [x] DONE — Complete the visual composition experience: semantic Markdown blocks, automatic sensible layouts, and a visual inspector for supported Gamma slide types.
- [x] DONE — Bring Gamma-native capabilities into the desktop workflow: terminal/live components, charts, diagrams, 3D, animation, recording, and co-animation with explicit local privacy controls.
- [x] DONE — Close product delivery gaps: dependable source/HTML/PDF/PNG/PPTX exports, handout and presenter workflow, release documentation, and packaging readiness.
- [x] DONE — Prove the new end-to-end paths with targeted Bun tests, desktop smoke checks, design review, documentation screenshots, and a fresh macOS artifact.
- [ ] BLOCKED — Apple signing/notarization requires an external Developer ID Application certificate and notarization credentials; the release artifact is deliberately unsigned rather than falsely signed.

## Native co-pilot control room — opened 2026-09-11

- [x] DONE — Add a loopback-only, bearer-token authenticated MCP endpoint so an LLM can inspect and operate the active presentation without exposing the machine to the network.
- [x] DONE — Add live presentation telemetry: deck/slide elapsed time, controllable countdown, overdue red cues, speaker-facing co-pilot messages, local notifications, and a persistent activity trail.
- [x] DONE — Make Gamma Presenter a native macOS citizen: branded app/Dock identity, Dock actions, a menu-bar presentation controller, and notification-safe state updates.
- [x] DONE — Add an explicit, locally scoped Claude Code / Codex CLI co-pilot workflow, including availability detection, clear command provenance, bounded execution, and visible output.
- [x] DONE — Test the MCP/control boundary, run the packaged desktop interaction smoke, refresh the macOS guide/screenshots, and produce a new verified arm64 artifact.

## Approved live co-animation — reopened 2026-09-11

- [x] DONE — Add a structured, bounded operator-action queue to MCP so a co-pilot can request Stage Studio, recording, camera/microphone, screen-share, browser, terminal, clean output, or spoken notes without silently invoking hardware, audio, or shell capabilities.
- [x] DONE — Surface pending live requests in the Author control room, with explicit approve/reject actions, resilient long-text rendering, and a clear audit trail visible in activity state.
- [x] DONE — Exercise the new MCP request/approval path in focused tests and the packaged Electron smoke, update the English product documentation and screenshot, then rebuild and verify an arm64 DMG/ZIP.

## Public product marketing — opened 2026-09-11

- [x] DONE — Turn the GitHub Pages root into an English-first Gamma Presenter product landing that uses verified product screenshots and preserves the generated presentation library.
- [x] DONE — Reframe the README around adoption, positioning, visual proof, and an honest local macOS quick start while retaining the Gamma Slides engine reference.
- [x] DONE — Validate the generated site, asset paths, focused tests, and the final diff; update the Pages trigger paths for future marketing assets.

## Landing visual recovery — opened 2026-09-11

- [x] DONE — Replace the weak marketing surface with a proof-led landing built from the current Author control-room capture and selected real decks.
- [x] DONE — Make the Gamma Presenter identity and the GitHub source route explicit in the first viewport, then rebuild and validate the generated Pages artifact.

## Theme identity recovery — opened 2026-09-11

- [x] DONE — Turn the three desktop presentation themes from palette variants into visibly distinct publishing compositions in both Author preview and Stage.
- [x] DONE — Prove the complete desktop theme switch path with automated visual-contract checks and a packaged Electron run across all three themes.

## GitHub macOS distribution — opened 2026-09-11

- [ ] IN PROGRESS — Publish the verified arm64 DMG/ZIP as a GitHub Release from a version tag, and keep a direct ZIP link on the landing, README, and macOS guide.

- [x] DONE — Examiner les captures et les modes iA réellement utilisés (Editor, miniatures, Inspector, Presentation Mode).
- [x] DONE — Recomposer l'éditeur autour de ces interactions fondamentales et corriger le contrat de navigation.
- [x] DONE — Refaire le mode Présentation avec aperçu, téléprompteur et chronométrage réinitialisable.
- [x] DONE — Vérifier visuellement les deux modes, les interactions et le package macOS.
- [x] DONE — Migrer le gestionnaire de paquets, les scripts, la CI et le conteneur vers Bun sans casser le runner `node:test` historique.
- [x] DONE — Supprimer la seconde fenêtre au démarrage et intégrer le rendu Gamma dans l'éditeur.
- [x] DONE — Préserver l'édition/rendu des decks YAML/JSON riches (images, GIF, médias, charts, Archify, D3/Pixi, Three.js et animations).
- [x] DONE — Vérifier le parcours mono-fenêtre et les rendus riches avec une revue visuelle indépendante.

# Progress

- 2026-09-11 — Choix : Electron est l'enveloppe macOS la plus directe pour conserver le renderer HTML hors-ligne existant et obtenir les deux fenêtres natives.
- 2026-09-11 — English-first delivery: desktop authoring, stage, speaker view, Presenter Studio, browser/terminal recovery states, advanced GPU/diagram controls, README, guides, samples, and test expectations use English. The only retained `fr-FR` value is the explicitly configured French text-to-speech voice in the historical pilot source.
- 2026-09-11 — Incident: Chrome 152 aborts during macOS application registration when the Node-backed isolated browser selects the system Chrome implicitly. The remediation is explicit browser selection on macOS and failure latching to prevent repeated launches.
- 2026-09-11 — Incident fixed: macOS now requires `GAMMA_BROWSER_EXECUTABLE` (or the established `PUPPETEER_EXECUTABLE_PATH`) before the isolated-browser feature launches Chromium; it no longer chooses the user's Google Chrome. A failed launch is latched until an explicit close/restart, so repeated API/UI calls cannot relaunch a crashing process.
- 2026-09-11 — Final arm64 packaging: the verified, unsigned ZIP is `dist-presenter-crashfix/Gamma Presenter-2.0.0-arm64-mac.zip` (SHA-256 `85318e1bf2378d1136bdbacfbf1b5f694f6917012c2111f0752d013e2e817aac`) and the verified DMG is `dist-presenter-crashfix/Gamma Presenter-2.0.0-arm64.dmg` (SHA-256 `c15d528e9a14e186cef120dfeb887c3c24d09d67e1ea0d34623c8ae570f525b7`). The initial `hdiutil` failure came from the sandbox lacking DiskManagement access; privileged macOS packaging completed without stopping Colima.
- 2026-09-11 — Final English package: fixed the remaining default Markdown, language metadata, and Focus mode copy. `dist-presenter-final/Gamma Presenter-2.0.0-arm64.dmg` and `dist-presenter-final/Gamma Presenter-2.0.0-arm64-mac.zip` are verified arm64 artifacts; both remain unsigned without a Developer ID identity.
- 2026-09-11 — Product mandate reopened: Gamma Presenter must exceed iA Presenter in the complete authoring/presenting workflow while retaining Gamma-exclusive local technical rendering, terminal, complex visual, and recording capabilities. Work proceeds in dependency order; no feature will be represented as delivered until exercised end-to-end.
- 2026-09-11 — Authoring foundations completed: create, duplicate, delete, button/drag reorder now mutate Markdown, YAML, and JSON atomically. Rich round-tripping retains fields outside the editor such as chart data, terminal blocks, and animations. Importing local image/GIF/video/audio copies into a project-local `media/` directory and inserts an editable slide in either source format.
- 2026-09-11 — Desktop Stage integration completed: an explicit Stage Console runs typed local commands only from the active Stage process, scoped to the presentation directory with a timeout/output bound. Camera, microphone, and display-capture requests are denied everywhere except the active local `gamma://` Stage. Full Node suite: 89 passed, 1 intentionally skipped isolated-Chromium integration test.
- 2026-09-11 — Composition pass: Markdown now deterministically selects quote, comparison, and table layouts from plain semantic patterns. Final macOS arm64 artifacts rebuilt in `dist-presenter-supersede/`; ZIP SHA-256 `25fd3eb3d6de561ee54d0346b8bd7b6a087e773c5f2917ad95a2ff664382cbad`, DMG SHA-256 `588b18129bbafc2189caffda145e257f8c11eb30a6f6f87e3aa1e51fa7579437`. The DMG is valid UDIF zlib, unsigned because no Developer ID identity is available.
- 2026-09-11 — Direct media drop completes the local-media authoring path. The refreshed arm64 artifacts are `dist-presenter-superior/Gamma Presenter-2.0.0-arm64.dmg` (SHA-256 `d300859812688429b0a27d94af917c4b195746118f624505c91eccee5d084603`) and `dist-presenter-superior/Gamma Presenter-2.0.0-arm64-mac.zip` (SHA-256 `d97c591318dd172ffc9d99ae06df828bb4fb3eb749d49f3adb794e7d9fae4e75`). The DMG was verified as valid UDIF/UDZO and packaged source contains the new desktop terminal and direct-drop paths. `bun run test`: 90 passed, 1 intentional isolated-browser skip. Artifacts remain unsigned because a Developer ID identity is not available.
- 2026-09-11 — Closing authoring/export gaps: Markdown now has a selected-slide visual editor that updates title, subtitle, and notes while preserving the source syntax for lists, quotes, tables, and local media. Local speaker handouts export as print-ready HTML/PDF with notes and semantic content. Native PowerPoint export now produces an openable PPTX with titles, text, lists, quotes, comparisons, tables, local still images, and speaker notes; live Gamma charts/diagrams/3D/media are labelled as runtime scenes rather than misrepresented as editable PowerPoint objects. `pptxgenjs` is a Bun-locked runtime dependency and the focused desktop suite covers the generated Office archive.
- 2026-09-11 — Final current arm64 packaging: `dist-presenter-superior-final/Gamma Presenter-2.0.0-arm64.dmg` (SHA-256 `8afefedb64da3b7ed73750a87a106e1b75ef69024120aa7b80f181356b0c3628`) and `dist-presenter-superior-final/Gamma Presenter-2.0.0-arm64-mac.zip` (SHA-256 `257ecad1e2bd1c0308e255e7ceea0df9d7f7ce959b9274580e7844a06d7f2245`) contain the Markdown inspector, handout exports, PowerPoint export, direct media drop, and Stage Console. The DMG is valid UDIF/UDZO. `bun run test`: 93 passed, 1 intentional isolated-browser skip. The artifacts are unsigned because no Developer ID identity is present.
- 2026-09-11 — Final desktop smoke: the packaged arm64 `.app` stayed running for five seconds with its main process, sandboxed renderer, GPU helper, and network helper present; it did not launch Google Chrome. The smoke process was then closed cleanly. This is a startup/process check, not a substitute for an Electron media/capture interaction suite.
- 2026-09-11 — Approved live co-animation complete: loopback MCP now queues bounded Studio/terminal/browser/output/capture/recording/speech requests, never executes them directly, and exposes approval/rejection only in the trusted Author bridge. The final packaged smoke initializes MCP, requests `open-studio`, proves the pending Author UI, approves it, verifies completion in Stage, and continues into a live deck. Final arm64 artifacts: `dist-presenter-coanimation-final/Gamma Presenter-2.0.0-arm64.dmg` (SHA-256 `c0eb8be8c5062af489b11eea264f2bfd4dd3a9da104c0f4b76b45d4421eaf369`) and `dist-presenter-coanimation-final/Gamma Presenter-2.0.0-arm64-mac.zip` (SHA-256 `e019a51650d0f464b571084b17dc5d4e990e1fcc5faaf0e072c8464a2d89183c`). UDZO integrity and Gamma Presenter bundle identity were verified. Artifacts remain unsigned because no Developer ID identity exists in this environment.
- 2026-09-11 — La surface obtenue est opérationnelle : auteur Markdown, sélection de thèmes, scène publique, vue orateur, changement d'écran, PNG/PDF/HTML et compatibilité de lecture des decks Gamma YAML/JSON.
- 2026-09-11 — Packaging arm64 vérifié dans `dist/mac-arm64/Gamma Presenter.app`; le paquet est non signé faute d'identité Developer ID dans l'environnement.
- 2026-09-11 — Réouverture demandée par l'utilisateur : le premier résultat ne reproduit pas sérieusement l'usage iA. Les captures officielles montrent un rail de miniatures, un éditeur Markdown central et un inspecteur, puis une seule régie de présentation avec modes aperçu/notes et timer. La direction précédente est abandonnée.
- 2026-09-11 — Reconstruction : espace Auteur en trois panneaux (rail vivant, Markdown, inspecteur), insertion de blocs utiles, navigation sélectionnable et mode concentration `⌘D`.
- 2026-09-11 — Reconstruction : régie unique avec aperçu, téléprompteur, chronomètre réinitialisable, modes Notes/Slides accessibles, et rail/grille exhaustifs et cliquables.
- 2026-09-11 — Revue visuelle indépendante : premier verdict `FIX` (rail limité à deux cartes, contraste/ARIA/images). Tous les P1/P2 corrigés ; seconde revue : verdict `SHIP`.
- 2026-09-11 — Paquet arm64 reconstruit et vérifié dans `dist/mac-arm64/Gamma Presenter.app` ; non signé faute d'identité Developer ID.
- 2026-09-11 — Migration Bun 1.3.11 : `bun.lock` versionné, `bun ci` en CI, Bun pour le CLI/MCP/navigateur, Docker et scripts de setup. Le script `bun run test` conserve volontairement `node --test` : Bun 1.3.11 ne couvre pas encore la suite `node:test` + PTY complète.
- 2026-09-11 — Réouverture : l'application lance encore une scène au démarrage et son éditeur réduit les decks riches à un résumé textuel. Direction : une seule fenêtre de travail au démarrage, avec une scène Gamma embarquée ; la scène publique et la vue orateur deviennent des commandes explicites de présentation.
- 2026-09-11 — Correction livrée : seul l'espace Auteur est créé au lancement. Son iframe utilise `loadDeck → embedDeckAssets → renderDeck → gamma://`; Markdown reste rapide à écrire, YAML/JSON reste édité sans aplatir les images, GIF, médias, ECharts, Archify, D3/Pixi, Three.js ou animations. Les exports créent une scène cachée au besoin.
- 2026-09-11 — Preuve Electron : lancement = 1 fenêtre ; deck YAML cinématique = 5 slides et aperçu riche ; une slide graphique affiche les volumes 3D dans l'iframe. Revue Impeccable indépendante finale : `ship`.
- 2026-09-11 — Revue contrarian : score 23/40. Écarts retenus : édition riche uniquement brute, course de rendu, collision clavier orateur, export non déterministe, risque mémoire, persistance de thème, et bridges Electron trop larges. L'utilisateur demande explicitement de tout traiter.
- 2026-09-11 — Hardening : l’inspecteur riche patch la source YAML/JSON validée, localise la slide et conserve la configuration complète ; état dirty/rendu/erreur, brouillon récupérable et thème YAML/JSON persistent ajoutés. Les rendus sont versionnés, la navigation d’iframe ne recharge plus à chaque slide, le rail est virtualisé sur longs decks et l’export attend le renderer/ressources avant capture.
- 2026-09-11 — Hardening : bridges Electron séparés Auteur/Scène/Orateur, sandbox activé, ouverture de fenêtre/navigation bloquées et permissions refusées par défaut. Régression espace vue orateur corrigée.
- 2026-09-11 — Documentation : guide macOS enrichi de captures, limites, comparaison documentée et matrice de preuves ; README lié. Tests desktop Bun 5/5 ; suite 84/85, échec préexistant du navigateur isolé (HTTP 400 attendu 200). ZIP et DMG arm64 générés dans `dist-presenter-hardened/`, non signés faute de Developer ID. Smoke Electron graphique indisponible dans ce shell (SIGABRT sans sortie), donc les captures ne sont pas régénérées dans cette passe.
- 2026-09-11 — Internationalisation de surface : toute l’interface `src/desktop` est maintenant en anglais (menus natifs, fenêtres, états, erreurs, contenu Markdown initial, inspecteur et régie) ; la documentation française l’indique. Aucun libellé français visible ne reste dans cette surface. Tests desktop Bun 5/5 et ZIP/DMG arm64 reconstruits dans `dist-presenter-hardened/`.
- 2026-09-11 — Native co-pilot control room completed: the app starts a Streamable HTTP MCP server only on `127.0.0.1`, with a random ephemeral bearer token and a narrow tool set (status, Stage start/stop, Speaker View, navigation, countdown, and cues). It exposes no shell, deck-writing, deployment, or system tool. The Author panel displays the connection object without revealing its token by default.
- 2026-09-11 — Live operating surfaces completed: deck and slide clocks, pauseable countdown, red timeout cue, macOS notification, private speaker cue, activity trail, Stage HUD, Dock menu, and menu-bar controller share one state snapshot. The branded `Gamma Presenter` app icon is packaged and used by the app, Dock, windows, and tray controller.
- 2026-09-11 — Explicit local CLI co-pilot completed: the Author panel detects local `codex` and `claude`; the operator selects and sends the instruction. Codex executes in `read-only` sandbox mode, Claude Code in `plan` mode; output remains local, has a 120-second/1 MB cap, and MCP cannot invoke either CLI.
- 2026-09-11 — Packaging regression fixed: bridge injection now targets the final document `</body>` rather than a literal string inside the embedded ECharts runtime. This fixed the packaged Stage `Unexpected identifier 'gamma'` failure. The source regression test and a packaged Author → authenticated MCP → Stage smoke both pass. Final unsigned arm64 outputs are `dist-presenter-control-room-final/Gamma Presenter-2.0.0-arm64.dmg` (SHA-256 `f81d1f172f6512c65c4bfb902860594151a21e2041df7643df29d2a9660a0f5e`) and `dist-presenter-control-room-final/Gamma Presenter-2.0.0-arm64-mac.zip` (SHA-256 `d57018180cc8a5dcabf97acd79a5fc909f709fb94464d2e1b533ad2314c57a2c`). `docs/images/gamma-presenter-control-room.png` is a packaged Electron capture with the bearer token masked.

- 2026-09-11 — Public marketing delivery: the Pages root is now an English-first Gamma Presenter landing with self-hosted type, verified Electron captures, product positioning, local macOS quick start, and stable generated-deck routes. The builder copies the exact screenshot, icon, and font assets into the static artifact. It also fixes the mobile Archify short-chain fallback that previously made the YouTube pilot block a full Pages build. The Bun suite passes with 95 tests and one intentional isolated-browser skip; a full seven-deck library build completes.
- 2026-09-11 — Theme identity recovery: the active deck's `theme-*` class was selecting every nested chooser swatch, so all three previews inherited the same appearance. Swatches are now scoped to their own option. Plain Presenter Markdown title slides now use the same editorial cover composition as their selected theme, with honest defaults (`01` and the deck title) instead of generic engine output. The full Bun suite passes (98 passed, 1 explicit browser skip) and the real source Electron smoke cycles the three themes, verifies three background/font systems, then completes the Author → MCP → approved action → Stage flow.
- 2026-09-11 — Release readiness: the fresh unsigned arm64 ZIP and DMG were built locally, and the packaged Electron smoke completed Author → all three theme identities → authenticated MCP approval → Stage. The release workflow uploads only the DMG, ZIP, and SHA-256 manifest from a `v*` tag; the Pages/README/macOS guide use the stable latest-release ZIP URL.

# Decisions

- Le format Markdown de l'application sera volontairement simple et compatible avec l'intention iA : `#` pour le titre d'une slide, `##` pour le contenu projeté, paragraphe simple pour les notes, et `---` ou trois retours à la ligne comme séparateur de slide.
- L'interface reprend les interactions de référence, mais adopte les composants, thèmes et identité Gamma ; elle ne copie pas les assets ni le code d'iA.
- Les fichiers YAML/JSON Gamma Slides existants continuent d'être utilisables : l'éditeur macOS ne les remplace pas.
- Les exports PPTX, la publication temporaire hébergée et l'édition avancée par rail (glisser-déposer, duplication, suppression) ne sont pas représentés comme livrés : ils exigent un modèle de document/une autorisation de déploiement distincts.

# Blockers

- Aucun à ce stade.

# Validation

- Tests ciblés desktop : 3/3 réussis, dont la conservation du renderer Gamma riche pour un deck YAML.
- Suite Node : 82/83 réussis ; le test préexistant `isolated browser is opt-in, token protected, navigates and interacts` échoue sur un retour HTTP 400 attendu 200, dans le navigateur isolé sans lien avec la surface Electron.
- Electron : lancement et captures isolées de l'auteur, de la scène et de la vue orateur réussis dans `.impeccable/review/`; les trois cartes du rail et du mode Slides ont été vérifiées.
- Packaging Electron arm64 : reconstruit et réussi. Détecteur Impeccable : aucun constat déterministe, mais en mode dégradé (parseurs HTML indisponibles) ; revue visuelle indépendante : `SHIP` après une passe corrective.
- Bun : `bun ci`, le CLI via Bun et `bun run test` ont été vérifiés ; 82/82 tests passent.
- Browser crash mitigation: `bun run test` passes 85/86 with the sole Chromium integration test skipped when no explicit executable is configured; a deterministic injected-launcher test proves failure latching and explicit re-arming.
- Electron : capture Auteur Markdown, YAML riche et scène graphique/3D effectuées dans `.impeccable/review/presenter-rich/`. Le détecteur Impeccable ne rapporte aucun constat (parseur HTML indisponible, résultat sous-estimé) ; revue visuelle indépendante : `ship`.
- Packaging Electron arm64 : la destination usuelle `dist/mac-arm64` était ouverte et n'a pas été remplacée ; build finale vérifiée dans `dist-presenter-review/mac-arm64/Gamma Presenter.app`, non signée faute d'identité Developer ID.
