import { google } from 'googleapis';
import { createReadStream, existsSync, statSync } from 'fs';
import { extname } from 'path';
import { Transform } from 'stream';
import { getAuthenticatedClient } from './auth.js';

const YOUTUBE_RESUMABLE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';
const YOUTUBE_UPLOAD_ALIGNMENT = 256 * 1024;
const DEFAULT_UPLOAD_CHUNK_SIZE = 8 * 1024 * 1024;
const DEFAULT_UPLOAD_RETRIES = 4;
const VIDEO_CONTENT_TYPES = {
  '.avi': 'video/x-msvideo',
  '.m4v': 'video/x-m4v',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export const YOUTUBE_CATEGORIES = {
  'Film & Animation': '1',
  'Education': '27',
  'Science & Technology': '28',
  'Entertainment': '24',
  'People & Blogs': '22',
  'News & Politics': '25',
  'Howto & Style': '26',
};

function createYouTube(auth) {
  return google.youtube({ version: 'v3', auth });
}

function getResponseHeader(headers, name) {
  if (typeof headers?.get === 'function') return headers.get(name);
  if (!headers || typeof headers !== 'object') return null;
  const normalizedName = name.toLowerCase();
  const key = Object.keys(headers).find(candidate => candidate.toLowerCase() === normalizedName);
  return key ? headers[key] : null;
}

function getVideoContentType(videoPath) {
  return VIDEO_CONTENT_TYPES[extname(videoPath).toLowerCase()] || 'application/octet-stream';
}

function acceptsResumableStatus(status) {
  return status === 308 || (status >= 200 && status < 300);
}

function acknowledgedBytes(response, fileSize) {
  if (response.status !== 308) return fileSize;
  const range = getResponseHeader(response.headers, 'range');
  if (!range) return 0;
  const match = /^bytes\s*=\s*0-(\d+)$/i.exec(String(range).trim());
  if (!match) throw new Error('YouTube returned an invalid resumable upload range');
  return Math.min(fileSize, Number(match[1]) + 1);
}

function isRetryableUploadError(error) {
  const status = Number(error?.response?.status || error?.status || 0);
  if (status) return status === 408 || status === 429 || status >= 500;
  return !['EACCES', 'EISDIR', 'ENOENT'].includes(error?.code);
}

function uploadFailure(error, attempts) {
  const status = Number(error?.response?.status || error?.status || 0);
  const suffix = status ? ` (HTTP ${status})` : '';
  return new Error(`YouTube resumable upload failed after ${attempts} retries${suffix}`, { cause: error });
}

function waitForRetry(attempt, baseDelayMs) {
  const delay = Math.min(10_000, baseDelayMs * (2 ** Math.max(0, attempt - 1)));
  return delay > 0 ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve();
}

async function putUploadChunk({ auth, sessionUrl, videoPath, contentType, fileSize, start, end }) {
  const source = createReadStream(videoPath, { start, end });
  let transmitted = 0;
  const meter = new Transform({
    transform(chunk, encoding, callback) {
      transmitted += chunk.length;
      callback(null, chunk);
    },
  });
  source.on('error', error => meter.destroy(error));
  source.pipe(meter);

  try {
    const response = await auth.request({
      url: sessionUrl,
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      },
      data: meter,
      responseType: 'json',
      retry: false,
      validateStatus: acceptsResumableStatus,
    });
    if (transmitted !== end - start + 1) throw new Error('The local video stream ended before the chunk was complete');
    return response;
  } finally {
    if (!source.destroyed) source.destroy();
    if (!meter.destroyed) meter.destroy();
  }
}

function getUploadStatus(auth, sessionUrl, fileSize) {
  return auth.request({
    url: sessionUrl,
    method: 'PUT',
    headers: {
      'Content-Length': 0,
      'Content-Range': `bytes */${fileSize}`,
    },
    data: '',
    responseType: 'json',
    retry: false,
    validateStatus: acceptsResumableStatus,
  });
}

/**
 * Upload a video through YouTube's explicit resumable-upload protocol.
 * The media body stays a file stream; only the small JSON metadata document is
 * materialised in memory. The opaque session URL is deliberately never logged.
 */
export async function uploadVideoResumable({
  auth,
  videoPath,
  requestBody,
  fileSize = statSync(videoPath).size,
  chunkSize = DEFAULT_UPLOAD_CHUNK_SIZE,
  maxRetries = DEFAULT_UPLOAD_RETRIES,
  retryBaseDelayMs = 500,
  onProgress,
}) {
  if (!auth?.request) throw new Error('An authenticated OAuth client is required for YouTube upload');
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0) throw new Error('The YouTube video file is empty');
  if (!Number.isSafeInteger(chunkSize) || chunkSize < YOUTUBE_UPLOAD_ALIGNMENT || chunkSize % YOUTUBE_UPLOAD_ALIGNMENT) {
    throw new Error('YouTube upload chunks must be a multiple of 256 KiB');
  }
  if (!Number.isSafeInteger(maxRetries) || maxRetries < 0) throw new Error('Invalid YouTube retry limit');

  const contentType = getVideoContentType(videoPath);
  const metadata = JSON.stringify(requestBody);
  const session = await auth.request({
    url: YOUTUBE_RESUMABLE_UPLOAD_URL,
    method: 'POST',
    params: {
      uploadType: 'resumable',
      part: 'snippet,status',
      fields: 'id',
    },
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Content-Length': Buffer.byteLength(metadata),
      'X-Upload-Content-Length': fileSize,
      'X-Upload-Content-Type': contentType,
    },
    data: metadata,
    responseType: 'json',
    retry: false,
  });

  const sessionUrl = getResponseHeader(session.headers, 'location');
  if (!sessionUrl) throw new Error('YouTube did not return a resumable upload session');

  let offset = 0;
  let failures = 0;
  const reportProgress = bytesRead => {
    const percent = Math.min(100, Math.round((bytesRead / fileSize) * 100));
    onProgress?.({ percent, bytesRead, totalBytes: fileSize });
  };
  reportProgress(0);

  while (offset < fileSize) {
    const end = Math.min(fileSize, offset + chunkSize) - 1;
    let response;
    let responseWasStatusProbe = false;

    try {
      response = await putUploadChunk({
        auth,
        sessionUrl,
        videoPath,
        contentType,
        fileSize,
        start: offset,
        end,
      });
    } catch (error) {
      if (!isRetryableUploadError(error) || failures >= maxRetries) throw uploadFailure(error, failures);
      failures += 1;
      await waitForRetry(failures, retryBaseDelayMs);

      try {
        response = await getUploadStatus(auth, sessionUrl, fileSize);
        responseWasStatusProbe = true;
      } catch (statusError) {
        if (!isRetryableUploadError(statusError) || failures >= maxRetries) {
          throw uploadFailure(statusError, failures);
        }
        continue;
      }
    }

    if (response.status !== 308) {
      reportProgress(fileSize);
      return response.data;
    }

    const nextOffset = Math.max(offset, acknowledgedBytes(response, fileSize));
    if (nextOffset > offset) {
      offset = nextOffset;
      failures = 0;
      reportProgress(offset);
      continue;
    }

    if (!responseWasStatusProbe) failures += 1;
    if (failures > maxRetries) {
      throw uploadFailure(new Error('YouTube did not acknowledge the uploaded chunk'), maxRetries);
    }
    if (!responseWasStatusProbe) await waitForRetry(failures, retryBaseDelayMs);
  }

  throw new Error('YouTube resumable upload ended without a video response');
}

export async function getYouTubeChannel(authClient) {
  const auth = authClient || await getAuthenticatedClient();
  const youtube = createYouTube(auth);
  const response = await youtube.channels.list({
    part: ['snippet'],
    mine: true,
    maxResults: 1,
  });
  const channel = response.data.items?.[0];
  return channel ? {
    id: channel.id,
    title: channel.snippet?.title || 'YouTube channel',
    thumbnail: channel.snippet?.thumbnails?.default?.url || null,
  } : null;
}

export async function listYouTubePlaylists(authClient) {
  const auth = authClient || await getAuthenticatedClient();
  const youtube = createYouTube(auth);
  const playlists = [];
  let pageToken;

  do {
    const response = await youtube.playlists.list({
      part: ['snippet', 'status', 'contentDetails'],
      mine: true,
      maxResults: 50,
      pageToken,
    });
    for (const playlist of response.data.items || []) {
      playlists.push({
        id: playlist.id,
        title: playlist.snippet?.title || 'Untitled playlist',
        privacy: playlist.status?.privacyStatus || 'private',
        itemCount: playlist.contentDetails?.itemCount || 0,
      });
    }
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return playlists.sort((a, b) => a.title.localeCompare(b.title));
}

export async function uploadToYouTube(opts) {
  const {
    videoPath,
    title,
    description = '',
    tags = [],
    category = 'Education',
    thumbnailPath,
    playlist,
    playlistId,
    createPlaylist = true,
    privacy = 'unlisted',
    publishAt,
    language = 'en',
    auth: authClient,
    onProgress,
  } = opts;

  if (!existsSync(videoPath)) throw new Error(`Video not found: ${videoPath}`);
  if (!String(title || '').trim()) throw new Error('A YouTube title is required');
  if (!['public', 'unlisted', 'private'].includes(privacy)) throw new Error(`Invalid privacy status: ${privacy}`);

  let scheduledAt = null;
  if (publishAt) {
    scheduledAt = new Date(publishAt);
    if (Number.isNaN(scheduledAt.getTime())) throw new Error('Invalid YouTube publication date');
    if (scheduledAt.getTime() <= Date.now()) throw new Error('The YouTube publication date must be in the future');
  }

  const auth = authClient || await getAuthenticatedClient();
  const youtube = createYouTube(auth);
  const effectivePrivacy = scheduledAt ? 'private' : privacy;
  const fileSize = statSync(videoPath).size;

  console.log('\n  Uploading to YouTube…');
  console.log(`  Title: ${title}`);
  console.log(`  Privacy: ${effectivePrivacy}${scheduledAt ? ` → ${scheduledAt.toISOString()}` : ''}`);

  const status = {
    privacyStatus: effectivePrivacy,
    selfDeclaredMadeForKids: false,
  };
  if (scheduledAt) status.publishAt = scheduledAt.toISOString();

  const uploadedVideo = await uploadVideoResumable({
    auth,
    videoPath,
    fileSize,
    requestBody: {
      snippet: {
        title: String(title).trim().slice(0, 100),
        description: String(description).slice(0, 5000),
        tags: tags.map(String).filter(Boolean).slice(0, 30),
        categoryId: YOUTUBE_CATEGORIES[category] || YOUTUBE_CATEGORIES.Education,
        defaultLanguage: language,
      },
      status,
    },
    onProgress: event => {
      const percent = event.percent;
      process.stdout.write(`\r  Uploading… ${String(percent).padStart(3)}%`);
      onProgress?.({ stage: 'upload', ...event });
    },
  });

  const videoId = uploadedVideo?.id;
  if (!videoId) throw new Error('YouTube upload completed without returning a video ID');
  const videoUrl = `https://youtube.com/watch?v=${videoId}`;
  process.stdout.write('\n');

  if (thumbnailPath && existsSync(thumbnailPath)) {
    try {
      await youtube.thumbnails.set({
        videoId,
        media: { mimeType: 'image/png', body: createReadStream(thumbnailPath) },
      });
      console.log('  Custom thumbnail uploaded');
    } catch (error) {
      console.warn(`  Thumbnail skipped: ${error.message}`);
    }
  }

  let selectedPlaylistId = playlistId || null;
  if (!selectedPlaylistId && playlist) {
    selectedPlaylistId = await findPlaylist(youtube, playlist);
    if (!selectedPlaylistId && createPlaylist) selectedPlaylistId = await createYouTubePlaylist(youtube, playlist, effectivePrivacy);
  }

  if (selectedPlaylistId) {
    try {
      await youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId: selectedPlaylistId,
            resourceId: { kind: 'youtube#video', videoId },
          },
        },
      });
      console.log('  Added to playlist');
    } catch (error) {
      console.warn(`  Playlist skipped: ${error.message}`);
    }
  }

  return {
    videoId,
    videoUrl,
    playlistId: selectedPlaylistId,
    privacy: effectivePrivacy,
    publishAt: scheduledAt?.toISOString() || null,
  };
}

async function findPlaylist(youtube, title) {
  let pageToken;
  do {
    const response = await youtube.playlists.list({
      part: ['snippet'],
      mine: true,
      maxResults: 50,
      pageToken,
    });
    const existing = response.data.items?.find(item => item.snippet?.title === title);
    if (existing) return existing.id;
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  return null;
}

async function createYouTubePlaylist(youtube, title, privacyStatus = 'private') {
  const created = await youtube.playlists.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title, description: 'Created by Gamma Slides' },
      status: { privacyStatus },
    },
  });
  return created.data.id;
}
