import fs from 'node:fs';
import { loadDeck } from '../src/loader/index.js';
import { renderDeck } from '../src/engine/renderer.js';

// The reviewed source is the maintained English regression deck. Keeping this
// materializer deliberately small prevents a one-off generator from silently
// reintroducing stale, translated copy into the public repository review.
const sourcePath = 'presentations/repository-review.yaml';
const outputDirectory = 'output/architecture-review';
const outputPath = 'output/repository-review.html';
const deck = loadDeck(sourcePath);

if (deck.meta.language !== 'en') {
  throw new Error(`${sourcePath} must remain English-first before it can be materialized.`);
}

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(outputPath, renderDeck(deck));
console.log(`${deck.slides.length} English slides → ${outputPath}`);
