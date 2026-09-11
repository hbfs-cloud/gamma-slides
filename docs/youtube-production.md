# Produce the pilot episode

The [English pilot](../presentations/youtube-pilot.yaml) follows one question: how does declarative content become an understandable video? Its 20 scenes go from the YAML contract to HTML rendering, then from clean output to take review. Its three diagrams are close-ups of relationships observed in code; they do not represent the full architecture. Per-scene references live in `source` and notes.

The narration is approximately 1,520 words. Allow roughly 10–12 minutes at an explanatory pace; only generated audio or a real take establishes duration. The declared voice is `fr-FR-HenriNeural` at `-5%`. YouTube settings remain private: generating the deck or video is not publication.

## Generate and present

```bash
bun bin/gamma-slides.js generate -f presentations/youtube-pilot.yaml -o output/youtube-pilot.html
bun bin/gamma-slides.js serve -f output/youtube-pilot.html --port 4173 --browser --terminal
```

Browser and terminal are optional. The pilot remains a prepared explanation without them. To film an interaction, prepare one short local action, state what it must prove, and explicitly select it for Studio broadcast. Do not turn a take into an improvised repository read-through.

## Video composition

The pilot uses `video-story` in the existing Signal Room world: dark field, amber accent, Archivo for explanation, and Source Serif 4 for opening/closing scenes. The working frame is 1280 × 720, exported at 1920 × 1080. Ordinary titles are 64px, messages and sequence items 52px, code 48px, and important secondary text 40px. Provenance references stay small, appear in notes too, and never carry a required explanatory step.

`video-closeup` displays two Archify elements per scene. Node labels are 22 SVG units (about 50px once fitted); action labels are 20. This is a dedicated composition, not a global scaling of existing diagrams. Static SVG explicitly declares embedded JetBrains Mono so it retains the interactive rendering family.

A 1280 × 720 image viewed at 390px width is reduced to about 30.5%; 52px text becomes about 15.8px. Inspect that reduction when judging horizontal video on a phone. Responsive deck HTML is a separate check: it reorganizes content while the video file does not.

Reading evidence appears in `output/youtube-review/` after checks: `fixed-player-390.png`, `phone-player.html`, individual scenes, and `scene-review.json`.

## Camera per scene

```yaml
scene:
  camera:
    visible: true
    position: br
    width: 0.18
```

The pilot places camera lower-right at 18% width. Explanatory scenes reserve the lower-right field: body is capped at 880px and sources at 850px. Code, long sequence, and Archify close-up scenes hide camera. Scene changes adjust visibility/placement without muting the microphone or requesting camera permission again. Enable and choose hardware in Studio before recording.

This reservation is designed for this 16:9 pilot. Changing position, exceeding width, enlarging text, or recording vertically requires a new inspection. A synthetic rectangle can check overlap only; it cannot validate lighting, eyeline, face rendering, or real camera quality.

## Rehearse and record

1. Read notes and prepare local interactions.
2. Open Studio, choose camera and microphone, then listen to a short check on real hardware.
3. Keep Clean Output and open the video output.
4. Share the output tab precisely in the browser picker.
5. Check format and framing in that output, then start the take.
6. Use Pause to prepare a passage; return to slides after a demonstration.
7. Stop, review, save, and open the saved file.

See [Presenter Studio](presenter-studio.md) for capture modes, permissions, codecs, and take recovery.

## Checks and scope

```bash
bunx playwright test qa/youtube-pilot.spec.js --reporter=list --output=output/playwright-youtube
```

This checks 20 scenes for overflow at 1280 × 720, primary type scale, close-up labels, and existing architecture framing in desktop overview, mobile, and fullscreen. Interactive mobile can begin in a component; the test explicitly returns to overview to verify framing.

An initial audit observed a clipped right edge during architecture entry. The stabilized overview subsequently showed all seven nodes at existing framing. No speculative global geometry change is claimed. Captures must distinguish entry transition, selected view, overview, and static output.

These checks do not establish audience retention, hardware-take quality, or identical behavior in every browser. Judge voice, synchronization, lighting, and long-take stability from the file actually produced.
