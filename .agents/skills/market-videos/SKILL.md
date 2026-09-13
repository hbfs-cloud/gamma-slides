---
name: market-videos
description: Produce reviewed DailyTickers Signal Room long-form market videos and ticker Shorts with authentic market evidence, approved Qwen VoiceDesign narration, and controlled YouTube publication.
---

# Market Videos — Signal Room

Use this skill for English DailyTickers market video production: an approximately 30-minute
16:9 weekly or daily briefing, and sub-30-second 9:16 ticker Shorts. Work from reviewed research
only. State the requested publication and cleanup authority before any external action; rendering
does not authorize upload, deletion, or publication.

Run every command from the Gamma Slides checkout that contains this skill. When the skill is
installed through a global symlink, resolve it before changing directory:

```sh
skill_dir="$(realpath "$HOME/.codex/skills/market-videos")"
cd "$(dirname "$(dirname "$(dirname "$skill_dir")")")"
```

## Shared editorial contract

- Use only sourced facts and retain the source URLs, reference date, timezone and calculation
  inputs in the delivery folder. Do not invent entries, stops, targets, probabilities, expectancy,
  catalyst claims or chart conclusions. An incomplete setup stays conditional/watch-only.
- Narration and visible copy are English, natural and unhurried. Use the approved local Qwen
  VoiceDesign profile; do not time-stretch, accelerate, truncate, or regenerate reviewed wording
  silently. The long mixer attests `tempo_modified: false`.
- US assets use actual Finviz daily charts with Finviz attribution and authentic issuer logos.
  European assets use real daily OHLCV for the same visible date window and calculated
  SMA20/50/200; record provider coverage warnings rather than passing a custom chart as Finviz.
- Times must identify GMT and Paris time where timing matters. Keep the finished frame full-size:
  1920×1080/30fps for long video, 1080×1920/30fps and strictly below 30 seconds for a Short.
- YouTube metadata may contain DailyTickers Substack as its only promotional link. Keep factual
  evidence URLs as citations, separate from promotion.

## Ticker Shorts

Read [docs/market-shorts.md](../../../docs/market-shorts.md) before producing Shorts. It defines
the card/asset/voice contracts, QA and the maintained commands:

```sh
node bin/gamma-slides.js shorts --file cards.json --validate-only
node src/shorts/batch.js batch-config.json
```

Use `shorts-assets` with an issuer-verified registry to acquire dated charts and logos. Use the
reviewed Qwen profile in `batch-config.json`; `src/shorts/voice.py` caches speech and reports its
measured duration, while the renderer rejects an overlong narration without speeding it up. Inspect
the gallery and receipts before considering a separate, explicitly authorized YouTube upload.

## Long market video

Use a reviewed JSON deck with non-empty `slides[].narration`, where blank lines split natural
voice paragraphs. Materialize it through the maintained renderer first. The bundled approved voice
profile is [approved-voice-profile.json](assets/approved-voice-profile.json); copy it into the
delivery only when a different reviewed profile was not supplied. Do not use dated `/private/tmp`
scripts as a production dependency.

```sh
node bin/gamma-slides.js generate --file reviewed-deck.json --output delivery/deck.html
```

Create voice segments from the approved profile, then create the exact 30-minute timing and mix.

```sh
/path/to/mlx-python src/video/market-voice.py \
  --deck reviewed-deck.json --output delivery/voice \
  --model /path/to/Qwen3-VoiceDesign-model \
  --profile .agents/skills/market-videos/assets/approved-voice-profile.json

python3 src/video/market-mix.py \
  --deck reviewed-deck.json --voice-manifest delivery/voice/segments.json \
  --output delivery --target-seconds 1800 --fps 30

node src/video/market-capture.mjs \
  --html delivery/deck.html --deck reviewed-deck.json --timing delivery/timing.json \
  --output delivery/clips --browser /path/to/isolated/chromium

python3 src/video/market-finalize.py \
  --timing delivery/timing.json --clips delivery/clips --audio delivery/voice-full.wav \
  --output delivery/weekly-market.mp4 --width 1920 --height 1080
```

`market-mix.py` pads scene holds to the requested whole-frame duration; it fails if the spoken
material cannot fit, so shorten and re-approve the script. It validates exact paragraph matching
and decoded WAV duration. `market-capture.mjs` reuses the Gamma browser launcher and FFmpeg
screencast support to record each scene for its exact `timing.json` duration, then writes a scene
receipt. `market-finalize.py` pads only video frames, muxes approved narration, fully decodes
the result and writes a receipt after validating H.264/AAC, dimensions, duration and frame count.
Review representative scenes and retain the deck, Qwen profile, segment manifest, timing JSON,
source manifest and media receipt.

## Publishing and cleanup

Upload only when the current request explicitly authorizes the upload, privacy/schedule and target
channel. Use the existing authenticated publisher (`node bin/gamma-slides.js publish` for a reviewed
master, or `youtube` for its own render-and-publish flow). For an approved Short batch, place
`youtube-publish-config.json` with `{ "channelId": "..." }` in the batch directory and run
`node src/shorts/publish.js batchdir` for read-only verification; add `--publish` only with current
publication authority. It writes durable `youtube-publication.json`; successful publication must be
public, processed and HD. Capture the long-form returned video URL/ID, actual privacy and timestamp
in an equivalent durable receipt. Confirm the remote object is present and processed before removing
local media. Preserve reviewed source, configs, manifests, timing, metadata and receipts; remove only
disposable render/capture media that the request authorizes.
