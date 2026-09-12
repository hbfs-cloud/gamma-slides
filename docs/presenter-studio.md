# Presenter Studio

Studio keeps controls in the working window and opens a separate **video output** for the audience. Camera, slides, and selected demonstrations appear there. Opening a preparation menu or terminal must never send it into a recording.

## Start the demonstration

```bash
bun bin/gamma-slides.js generate -f presentations/studio-demo.yaml -o output/studio-demo.html
bun bin/gamma-slides.js serve -f output/studio-demo.html --port 4173 --browser --terminal
```

Open `http://127.0.0.1:4173` in a regular Chrome window. The [Studio regression source](../presentations/studio-demo.yaml) has 47 slides: illustrations, Archify architectures/workflows, browser, video, native ECharts, tables, trading, and GPU visualizations. Financial data and calibration clip are illustrative. It is an English-language regression corpus in the public library and remains excluded from the packaged template gallery; use the [English capability tour](https://hbfs-cloud.github.io/gamma-slides/gamma-presenter-capabilities/) for the concise product proof.

`--browser` enables an isolated browser session; `--terminal` enables the local shell. Both are optional and stay on the local server. For a verified repository deck, use `repo-present --browser --terminal` or `serve -d output/review/site --browser --terminal`.

## Interactive terminal

With local `--terminal`, system commands use a pseudo-terminal (`node-pty`) and xterm.js. `htop` receives keys and dimensions after console resize; `q` exits htop, and `Ctrl+C` or **Stop** interrupts a command. Closing the console stops its process; minimizing preserves it.

While a command runs, keys belong to the terminal and do not navigate, toggle camera, or pause recording. When it closes, focus returns to the slide. History and current directory remain for the next command. One system command runs at a time per server; output streams with a 16MB limit and bounded history. A disconnect closes the process; a client without heartbeat for three minutes is cleaned up. The shell is unavailable in static files and GitHub Pages.

## Prepare a take without recording controls

1. Open **M → Studio**. The round M works with hover, touch, and keyboard.
2. Enable the camera and microphone. In **Composition and sources**, choose devices, camera position, and size. Drag its bar or resize handle; arrow keys work when those handles have focus.
3. Keep **Source to record → Clean Output**, then **Open video output**. Allow that window if the browser blocks it.
4. Choose the source and select the **VIDEO OUTPUT** tab precisely in the browser picker. Studio verifies tab identity and rejects a different or unverifiable source. This requires Capture Handle support; use regular Chrome because private windows can return a null identity.
5. Check composition in video output, then start recording from Studio. Keep output open throughout the take.

**Raw capture** also records menus in the selected source. **External source** records the chosen screen/tab with camera composited above it. Neither guarantees clean control exclusion. In **Demonstrations → Broadcast in video**, explicitly choose **Slides**, **Terminal**, or **Browser**. Opening a tool does not broadcast it; return to **Slides** to finish a demonstration.

## During and after recording

The take bar exposes elapsed time, **Pause / Resume**, microphone, camera, and end take. Muting microphone preserves camera; hiding camera preserves microphone. Pause stops MediaRecorder and usable duration resumes with the take.

| Key | Action |
| --- | --- |
| `↑` | Open slide carousel |
| `←` / `→` | Move through carousel slides |
| `Enter` / `↓` / `Escape` | Return to selected slide |
| `M` | Open or close round menu |
| `T` | Open terminal |
| `C` | Show or hide camera |
| `U` | Enable or mute microphone |
| `P` | Pause or resume take |
| `R` | Open setup, review take, or focus active controls |
| `F` | Fullscreen |
| `S` | Presenter notes |

After stop, review shows actual format, dimensions, duration, and size. MP4/WebM depends on available codec. Every segment is progressively retained in IndexedDB; the counter shows committed bytes. **Takes stored on this device** recovers a take after reload/crash up to the last written segment. This copy depends on browser, profile, and origin; clearing site data removes it. Export important takes.

Integrated preview is capped at 128MiB. Above that, **Export** writes segments in sequence without reconstructing the full take in memory; use Chrome’s save picker. The fallback download is limited to small takes. Local copies stay until explicit deletion. Full/slow storage stops the take while retaining written segments.

## Image, audio, and authoring

Fixed formats reject a source that is too small: selecting 1080p cannot turn a 720p capture into a false 1080p master. **Enlarge output** attempts to size its window; the browser may constrain it. Check shared resolution or use **Keep source resolution**. A source reduction during a take stops cleanly.

**Program audio** provides separate voice/media gains, ducking, limiter, and peak meter. The limiter cannot repair clipping that already occurred in a microphone. **Devices** can replace camera/microphone during a take or pause. Enable **Raw tracks for editing** before a take to retain Voice and Media separately; they are before gain/limiter, follow pause/resume, and are exportable from stored takes. Sample-accurate synchronization is not claimed.

Read [the schema](../src/schema/deck.schema.json) and use the demo deck as an executable example. An LLM writes YAML/JSON and produces or references assets; the CLI does not itself include image generation. `visual` accepts an image/GIF; `media.kind` accepts user-controlled `video` or `audio`. Local SVG, PNG, JPEG, GIF, WebP, AVIF, MP4, WebM, MP3, WAV, and OGG assets are resolved from YAML and embedded up to 50MB per asset. Remote URLs require network access. Use native `chart.type: echarts` for ECharts JSON; arbitrary JavaScript functions, extensions, and external maps are not automatically supplied.

See [the 20-scene pilot](youtube-production.md) for a coherent narration and architecture close-ups. Studio tests are in `qa/studio-recording.spec.js`; evidence is written to `output/studio-review/`. Inspect the produced files and public output; distinguish synthetic camera/microphone sources from hardware trials.
