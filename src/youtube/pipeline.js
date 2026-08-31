import { copyFileSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'fs';
import { basename, dirname, join, resolve } from 'path';
import { tmpdir } from 'os';
import { loadDeckFile } from '../loader/index.js';
import { renderDeck } from '../engine/renderer.js';
import { generateVideoFromDeck } from '../video/generate-v2.js';
import { generateThumbnail } from '../video/thumbnail.js';
import { writeMetadataFiles } from '../video/metadata.js';
import { getAuthenticatedClient } from './auth.js';
import { getYouTubeChannel, listYouTubePlaylists, uploadToYouTube } from './upload.js';
import { openYouTubeStudio } from './studio.js';

function slugify(value) {
  return String(value || 'presentation')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'presentation';
}

function preserveFile(sourcePath, destinationPath) {
  mkdirSync(dirname(destinationPath), { recursive: true });
  try {
    renameSync(sourcePath, destinationPath);
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    copyFileSync(sourcePath, destinationPath);
    unlinkSync(sourcePath);
  }
}

function buildDescription(settings, metadata, deck) {
  const sections = [settings.description.trim()];
  if (deck.video?.youtube?.chapters !== false && metadata.chaptersText) {
    sections.push(`Chapters\n${metadata.chaptersText}`);
  }
  const attribution = [deck.meta?.company, deck.meta?.author ? `Presented by ${deck.meta.author}` : null]
    .filter(Boolean)
    .join(' · ');
  if (attribution) sections.push(attribution);
  return sections.filter(Boolean).join('\n\n').slice(0, 5000);
}

export async function createAndPublishDeck(opts) {
  const deckPath = resolve(opts.deckPath);
  const deck = loadDeckFile(deckPath);
  if (opts.theme) deck.theme = opts.theme;

  console.log('\n  Authenticating with YouTube OAuth…');
  const auth = await getAuthenticatedClient();
  const [channel, playlists] = await Promise.all([
    getYouTubeChannel(auth),
    listYouTubePlaylists(auth),
  ]);
  if (!channel) throw new Error('No YouTube channel is associated with this Google account');

  const publisher = opts.settings ? null : await openYouTubeStudio({ deck, channel, playlists });
  const settings = opts.settings || publisher.settings;
  const reportProgress = event => {
    publisher?.report(event);
    opts.onProgress?.(event);
  };
  const tempRoot = mkdtempSync(join(tmpdir(), 'gamma-youtube-'));
  const htmlPath = join(tempRoot, 'deck.html');
  const videoPath = join(tempRoot, 'upload-master.mp4');
  const thumbnailPath = join(tempRoot, 'thumbnail.png');
  let localVideoPath = null;

  console.log(`\n  Publishing brief accepted for ${channel.title}`);
  console.log('  Temporary assets will be removed automatically after upload.');

  try {
    writeFileSync(htmlPath, renderDeck(deck), 'utf-8');
    reportProgress({ stage: 'thumbnail', percent: 0, detail: 'Rendering selected slide' });
    await generateThumbnail({
      htmlPath,
      slideIndex: Math.min(settings.thumbnailSlide, deck.slides.length - 1),
      textOverlay: settings.thumbnailText,
      outputPath: thumbnailPath,
    });
    reportProgress({ stage: 'thumbnail', percent: 100, detail: 'Thumbnail ready' });

    const video = await generateVideoFromDeck(deck, htmlPath, videoPath, {
      srt: false,
      sidecars: false,
      workDir: tempRoot,
      onProgress: reportProgress,
    });

    const upload = await uploadToYouTube({
      auth,
      videoPath,
      thumbnailPath,
      title: settings.title,
      description: buildDescription(settings, video.metadata, deck),
      tags: settings.tags,
      category: settings.category,
      playlist: settings.playlist,
      playlistId: settings.playlistId,
      createPlaylist: settings.createPlaylist,
      privacy: settings.privacy,
      publishAt: settings.publishAt,
      language: String(deck.meta?.language || 'en').split('-')[0],
      onProgress: reportProgress,
    });

    if (settings.keepVideo || opts.keepVideo) {
      localVideoPath = resolve(opts.output || join('output', `${slugify(settings.title)}.mp4`));
      preserveFile(videoPath, localVideoPath);
      writeMetadataFiles({
        ...video.metadata,
        title: settings.title,
        description: buildDescription(settings, video.metadata, deck),
        tags: settings.tags,
        category: settings.category,
        playlist: settings.playlist || settings.playlistId || null,
        privacy: upload.privacy,
        publishAt: upload.publishAt,
        videoUrl: upload.videoUrl,
      }, localVideoPath);
    }

    const result = {
      ...upload,
      channel,
      localVideoPath,
      slides: video.slides,
      duration: video.duration,
      temporaryStorageReleased: true,
      source: basename(deckPath),
    };
    publisher?.complete(result);
    return result;
  } catch (error) {
    publisher?.fail(error);
    throw error;
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
