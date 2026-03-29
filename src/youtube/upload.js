import { google } from 'googleapis';
import { createReadStream, existsSync, readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { getAuthenticatedClient } from './auth.js';

const CATEGORY_MAP = {
  'Education': '27',
  'Science & Technology': '28',
  'Entertainment': '24',
  'People & Blogs': '22',
  'News & Politics': '25',
  'Howto & Style': '26',
  'Film & Animation': '1',
};

export async function uploadToYouTube(opts) {
  const {
    videoPath,
    title,
    description,
    tags = [],
    category = 'Education',
    thumbnailPath,
    playlist,
    privacy = 'unlisted',
  } = opts;

  if (!existsSync(videoPath)) throw new Error(`Video not found: ${videoPath}`);

  const auth = await getAuthenticatedClient();
  const youtube = google.youtube({ version: 'v3', auth });

  console.log(`\n  Uploading to YouTube...`);
  console.log(`  Title: ${title}`);
  console.log(`  Privacy: ${privacy}`);
  console.log(`  Video: ${videoPath}\n`);

  // Upload video
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: title.slice(0, 100),
        description: description.slice(0, 5000),
        tags: tags.slice(0, 30),
        categoryId: CATEGORY_MAP[category] || '27',
        defaultLanguage: 'en',
      },
      status: {
        privacyStatus: privacy,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: createReadStream(videoPath),
    },
  }, {
    onUploadProgress: (evt) => {
      const pct = Math.round((evt.bytesRead / getFileSize(videoPath)) * 100);
      process.stdout.write(`\r  Uploading... ${pct}%`);
    },
  });

  const videoId = res.data.id;
  const videoUrl = `https://youtube.com/watch?v=${videoId}`;
  console.log(`\n\n  Video uploaded: ${videoUrl}`);

  // Upload thumbnail
  if (thumbnailPath && existsSync(thumbnailPath)) {
    try {
      await youtube.thumbnails.set({
        videoId,
        media: {
          mimeType: 'image/png',
          body: createReadStream(thumbnailPath),
        },
      });
      console.log(`  Thumbnail set: ${thumbnailPath}`);
    } catch (err) {
      console.log(`  Thumbnail skipped (requires verified account): ${err.message}`);
    }
  }

  // Add to playlist
  if (playlist) {
    try {
      const playlistId = await findOrCreatePlaylist(youtube, playlist);
      await youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: { kind: 'youtube#video', videoId },
          },
        },
      });
      console.log(`  Added to playlist: ${playlist}`);
    } catch (err) {
      console.log(`  Playlist skipped: ${err.message}`);
    }
  }

  return { videoId, videoUrl };
}

async function findOrCreatePlaylist(youtube, title) {
  // Search existing playlists
  const list = await youtube.playlists.list({
    part: ['snippet'],
    mine: true,
    maxResults: 50,
  });

  const existing = list.data.items?.find(p => p.snippet.title === title);
  if (existing) return existing.id;

  // Create new playlist
  const created = await youtube.playlists.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title, description: `Auto-created by gamma-slides` },
      status: { privacyStatus: 'unlisted' },
    },
  });

  return created.data.id;
}

function getFileSize(filePath) {
  return statSync(filePath).size;
}
