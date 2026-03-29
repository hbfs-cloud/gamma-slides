import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { uploadToYouTube } from './upload.js';
import { generateThumbnail } from '../video/thumbnail.js';

export async function publishToYouTube(opts) {
  const {
    videoPath,
    metaPath,
    htmlPath,
    privacy = 'unlisted',
    thumbnailSlide,
    thumbnailText,
  } = opts;

  const absVideo = resolve(videoPath);
  if (!existsSync(absVideo)) throw new Error(`Video not found: ${absVideo}`);

  // Load metadata
  let meta = {};
  const absMetaPath = metaPath || absVideo.replace(/\.mp4$/, '.meta.json');
  if (existsSync(absMetaPath)) {
    meta = JSON.parse(readFileSync(absMetaPath, 'utf-8'));
  }

  // Load description
  const descPath = absVideo.replace(/\.mp4$/, '.description.txt');
  const description = existsSync(descPath) ? readFileSync(descPath, 'utf-8') : meta.description || '';

  // Generate thumbnail if HTML available
  let thumbnailPath = null;
  const absHtml = htmlPath ? resolve(htmlPath) : absVideo.replace(/\.mp4$/, '.html');
  if (existsSync(absHtml)) {
    thumbnailPath = absVideo.replace(/\.mp4$/, '_thumb.png');
    console.log('  Generating thumbnail...');
    await generateThumbnail({
      htmlPath: absHtml,
      slideIndex: thumbnailSlide || meta.thumbnail?.slide || 0,
      textOverlay: thumbnailText || meta.thumbnail?.text_overlay,
      outputPath: thumbnailPath,
    });
    console.log(`  Thumbnail: ${thumbnailPath}`);
  }

  // Upload
  const result = await uploadToYouTube({
    videoPath: absVideo,
    title: meta.title || 'Presentation',
    description,
    tags: meta.tags || [],
    category: meta.category || 'Education',
    thumbnailPath,
    playlist: meta.playlist,
    privacy,
  });

  return result;
}
