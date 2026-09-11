# YouTube production review

The fixes respond to the September 9, 2026 contrarian review. They cover recoverable takes, true captured resolution, audio, the interactive browser, and the readability of a prepared episode. The 47-slide catalog remains available; the 20-scene English pilot is the coherent video script.

## Verified changes

- Incremental IndexedDB writes with bounded queue, recovery after real renderer crash, quota stop, and progressive export. Recovery ends at the last committed segment.
- Rejection of a source below the requested fixed format. Native resolution is shown and dimensions never change within a take.
- Voice/media gain, ducking while speaking, compression, and mix ceiling. Optional raw tracks follow pause/resume; muting microphone also mutes its raw track.
- Isolated WebRTC browser at 1920×1080 around 30fps with measured audio. Operator monitoring mutes during broadcast and restores after; cleanup follows close, negotiation failure, or navigation disconnect.
- Per-scene camera composition, phone-readable horizontal-video type, and three Archify close-ups.
- Reorganized mobile take review, 44px touch actions, readable metadata, and an accessible Studio close action while scrolling.

## Reproducible evidence

| Check | Result | Local evidence |
| --- | --- | --- |
| Unit tests | 66 passed | `bun run test` |
| Capture, pause, microphone, camera, responsive, clean output | 6 passed | `qa/studio-recording.spec.js`, `output/studio-review/clean-proof.json` |
| Resolution, devices, take recovery | 3 passed | `qa/studio-production.spec.js` |
| Crash, quota, mix, raw tracks | 6 passed | `output/studio-durability/` |
| WebRTC, broadcast, security, close | 4 passed | `output/studio-review/browser-broadcast-proof.json`, `browser-stream-proof.json` |
| Pilot, phone reading, Archify | 3 passed | `output/youtube-review/` |
| Independent visual review | Corrections confirmed desktop/mobile | `output/studio-production-review/confirmation.md` |
| Endurance, native 1080p capture | 900-second take, 885.324 usable seconds after pauses, 148,150,268 bytes | `output/studio-production/endurance-proof.json`, `endurance.mp4` |
| GPU with truly hidden operator | Animated WebGPU, selection, and pixels broadcast; no control visible | `qa/studio-background.spec.js`, `output/studio-background/proof.json` |

`node qa/build-studio-review.js` creates `output/studio-review/index.html`, linking decoded images, videos, and measurements. Test camera/microphone sources are synthetic; tab sharing and codecs are Chrome’s. A real rehearsal with the author’s voice, camera, lighting, and hardware remains necessary before publication. Responsive phone presentation differs from mobile capture and vertical video framing.

## Long take and background

The endurance take produced H.264 MP4 at 1920×1080, around 30fps, with audio, 20-scene transitions, and regular pauses. 172 JavaScript-memory samples ranged from 14.5 to 34.9MB; observed write queue stayed below 113KB. These samples are neither all Chrome memory nor an absolute maximum. The 148MB file exceeded integrated preview limits, so it was exported segment-by-segment, inspected with ffprobe, and decoded at beginning/middle/end.

Hidden-window validation uses native Chrome driven by Puppeteer without forcing `document.hidden`. The Worker clock produced 76 callbacks in 2.78 seconds where the previous clock reached roughly one frame per second. The GPU mirror belongs to public output because `captureStream` from a hidden canvas can remain blank. Animation, selection, and changed pixels were verified in that state.
