export const defaults = {
  version: '1',
  meta: {
    title: 'Untitled Presentation',
    language: 'en',
    date: new Date().toISOString().split('T')[0],
    tags: [],
  },
  branding: {
    logo: null,
    watermark: null,
    company_url: null,
  },
  theme: 'corporate',
  style: {},
  narration: {
    voice: 'en-US-AndrewNeural',
    rate: '-5%',
    pitch: '+0Hz',
  },
  music: {
    track: null,
    volume: 0.08,
    fade_in: 3,
    fade_out: 4,
  },
  video: {
    resolution: '1920x1080',
    fps: 30,
    format: 'mp4',
    subtitles: true,
    thumbnail: { slide: 0 },
    youtube: { chapters: true },
  },
};

export const voiceMap = {
  en: 'en-US-AndrewNeural',
  fr: 'fr-FR-HenriNeural',
  es: 'es-ES-AlvaroNeural',
  de: 'de-DE-ConradNeural',
  it: 'it-IT-DiegoNeural',
  pt: 'pt-BR-AntonioNeural',
  ja: 'ja-JP-KeitaNeural',
  zh: 'zh-CN-YunxiNeural',
  ko: 'ko-KR-InJoonNeural',
  ar: 'ar-SA-HamedNeural',
};

export function resolveVoice(lang, explicit) {
  if (explicit) return explicit;
  return voiceMap[lang] || voiceMap.en;
}
