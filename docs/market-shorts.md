# Market Shorts — Signal Room

`gamma-slides shorts` turns reviewed ticker cards into English vertical Shorts:
1080 × 1920, 30 fps, exactly 29 seconds, H.264/AAC, with company logos, source charts,
four decision panels and crossfades. It also creates a local review gallery and YouTube
metadata. The pipeline never publishes automatically.

## Repeatable monthly workflow

1. Acquire dated charts and authentic logos. Keep provenance in an asset manifest.
2. Write and review cards against the weekly research. Validate before generating speech.
3. Generate the voice cache with the configured local Qwen runtime and approved profile.
4. Render the batch. Inspect the gallery, listen to the voice and review the source cards.
5. Publish only the reviewed outputs using the existing authenticated YouTube workflow.

```sh
node bin/gamma-slides.js shorts --file cards.json --validate-only

/path/to/mlx-python src/shorts/voice.py \
  --file cards.json --output batch/voice \
  --model /path/to/Qwen3-VoiceDesign-model \
  --profile voice-profile.json

node bin/gamma-slides.js shorts \
  --file cards.json --assets assets-manifest.json --voice batch/voice \
  --browser /path/to/isolated/chromium \
  --week 'SEP 14–18, 2026' --keep-going --output batch/output
```

Both stages accept `--tickers HPE,DELL` for a selected retry. One voice process runs at a
time on the GPU; do not run concurrent writers against the same output directory.
The voice cache preserves other tickers when retrying a subset. Each voice key includes
text, profile and model path. Each video key includes the complete card, asset provenance,
asset bytes, narration and renderer sources. A matching video is reused only if its stored
SHA-256 matches its current bytes. A corrected level or asset invalidates its export.

`--keep-going` retains valid exports when another card fails. The command exits nonzero
if any selected card is blocked; `failures.json` explains each failure. Fix and repeat the
same command. No successful item needs to be re-encoded. Run a final full batch to produce
an all-ticker gallery and receipt; a subset invocation describes only that subset.

## Card contract

The JSON file contains an array or an object with `items` or `cards`.
Required strings: `ticker`, `name`, `category`, `catalyst`, `setup`, `confirmation`,
`invalidation`, `catalyst_confidence`, `entry_confidence`, `expectation`, `stop`, `targets`,
`narration`, `asof`, `status`. Also include `currency`, numeric `levels` and `source_urls`.
Optional `reference_levels` selects the levels shown in the structure panel; `protocol`
contains the complete execution conditions in the downloadable card and description.

- `status`: `conditional` or `watch_only`.
- `catalyst_confidence`: `High`, `Medium` or `Unrated`; this is evidence confidence,
  not an entry probability or a win-rate estimate.
- `entry_confidence`: `Unconfirmed` for this preparation format.
- `asof`: ISO reference date matching the chart manifest.
- `source_urls`: HTTPS evidence references. An unverified watch-only reserve may have an
  empty list only with `Unrated` confidence and an explicit `evidence_note`.
- Narration: at most 48 written words and at most 27.8 measured seconds. Figures can take
  considerably longer to speak than their word count suggests. Shorten the script if needed;
  the renderer does not speed up or truncate narration.
- Mobile text: each displayed decision field at most 150 characters. Browser layout checks
  independently reject overflowing panels.
- Incomplete setups must say `Pending validation`; never manufacture a stop, target,
  expected return, probability or confirmation to complete a card.

The output has four stages: catalyst (0–6s), structure (6–13s), confirmation/invalidation
(13–21s), risk/scenario (21–29s). The full daily chart remains visible throughout.
Primary text leaves room at the right and bottom for Shorts interface controls.
Reference levels are not silently promoted to buy triggers or profit targets.

## Asset and voice manifests

The asset manifest is an array (or `items`/`assets` array) of:

```json
{
  "ticker": "HPE",
  "chart": "assets/HPE/chart-finviz.png",
  "logo": "assets/HPE/logo-hpe.svg",
  "asof": "2026-09-11",
  "source_kind": "Finviz",
  "source_url": "https://charts2.finviz.com/chart.ashx?t=HPE&ty=c&ta=1&p=d&s=l"
}
```

Asset paths resolve relative to the manifest. US charts retain Finviz attribution and
native pixels/annotations. European charts must identify the actual source, use real daily
OHLCV, the same visible window and calculated SMA20/50/200 where available. Coverage gaps
belong in `coverage_warning`; never label a custom European chart as Finviz.

A voice profile contains `instruct` (the reviewed VoiceDesign direction) and optionally
`seed`. Keep credentials outside profiles and output files. The local runtime needs
`mlx`, `mlx_audio`, `numpy` and `soundfile`; the model is configured explicitly and is not
bundled. FFmpeg/FFprobe must be on PATH. Chromium uses the existing safe browser launcher;
on macOS configure an isolated browser, not the user's primary Chrome profile.

The voice stage creates `manifest.json` with `{items:[{ticker,text,path,duration,fingerprint}]}`.
External voice providers can supply the same contract after review. The render stage checks
that narration text matches the card exactly.

## Outputs and verification

Per ticker: `short.mp4`, four frame PNGs, self-contained `index.html`, `card.json`,
`youtube.json`, `receipt.json`. At batch level: gallery, `batch-receipt.json`, `failures.json`.
Metadata defaults to private and uses DailyTickers Substack as its sole promotional URL.
Primary evidence URLs are retained separately as citations.

Automated checks cover editorial requirements, source dates, images loaded, layout overflow,
voice/card correspondence, narration duration, 870 video frames, codecs/dimensions,
strictly-under-30-second duration, and full audio/video decoding. These checks do not prove
that a catalyst or a drawn price pattern is correct: editorial source review and visual QA
remain necessary before publication.

```sh
node --test test/shorts.test.js
```

## Scripted asset acquisition and European charts

A reviewed issuer registry adds `company_name` and `issuer_verified: true` to each ticker,
plus `chart_url`/`logo_url` (public HTTPS) or local `chart`/`logo` paths, `source_kind` and
`asof`. These identity checks are deliberate: a ticker search is not proof of company identity.

```sh
node bin/gamma-slides.js shorts-assets --file issuers.json \
  --asof 2026-09-11 --output batch/assets
```

The resulting manifest connects directly to `shorts --assets`. Acquisition checks file types,
keeps logo caches, records hashes and provenance and reports individual failures. PNG, JPEG,
SVG and WebP are supported. An acquisition timestamp does not prove the date shown in a chart:
review its actual last session before production. Refresh the registry date each weekly cycle.

`src/shorts/europe-chart.js` renders a crisp 836×396 SVG from normalized real daily OHLCV,
with SMA20/50/200 computed on all supplied history before applying the visible window.
It rejects future bars, stale end dates and invalid OHLCV. The daily bars and provider coverage
warnings must be archived alongside the generated charts. No data feed or credentials are
embedded in the renderer.

```sh
node src/shorts/europe-chart.js bars.json SOI.PA \
  2026-06-01 2026-09-11 chart.svg
```

`bars.json` contains `{ "bars": [["2026-09-11", 135.40, 143.15, 133.05, 141.15, 207500]] }`
with the complete historical series, not just that illustrative row. Supply at least 200
observations for SMA200. Missing averages are labelled unavailable, never extrapolated.
For annotated references import `europeanChart(payload, {ticker, from, asof, levels})`.
The dotted reference lines remain explicitly labelled plan levels.

## One-command batch production

For recurring batches, keep a `batch-config.json` with `file`, `assets`, `voice`,
`voiceProfile`, `model`, `python`, `browser`, `week` and `output`. Paths resolve relative to
that configuration; runtime executables/model paths may be absolute. Optional `tickers`
selects a subset. The runner validates cards, reuses cached speech, then renders and verifies
all selected videos. It stops with an error if any selected card cannot be delivered.

```sh
node src/shorts/batch.js /path/to/batch-config.json
```

The September14 delivery includes a ready-to-run configuration. Its model and isolated
browser are retained in the user's DailyTickers cache; generated media is archived separately.
It contains no credentials and performs no upload. For a new week, use a new batch directory,
review the new cards/charts, and change the explicit weekly label and reference dates.

## YouTube batch publication

After explicit publication authorization, add `youtube-publish-config.json` containing the
reviewed target `channelId` to the batch directory. The configured OAuth client is loaded by the
existing authenticated helper; credentials never enter command arguments or output.

```sh
node src/shorts/publish.js /path/to/batch --publish
node src/shorts/publish.js /path/to/batch
```

The second command is read-only against YouTube and updates the local verification receipt.
Publication validates all local video hashes first, disables per-video subscriber notifications,
marks synthetic narration, and writes each returned ID immediately to `youtube-publication.json`.
A hash marker in tags supports reconciliation. An uncertain upload stops the batch; inspect the
remote channel before retrying rather than creating another video. Existing IDs are never uploaded
again. The verification requires the target channel, public visibility, processed video and HD.
Keep the receipt when deleting media; it remains usable by the read-only verification command.
