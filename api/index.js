const REQUEST_TIMEOUT_MS = 45_000;

function sendJson(res, statusCode, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The download service timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeYouTubeUrl(value) {
  if (typeof value !== 'string' || value.length > 2_048) return null;
  try {
    const parsed = new URL(value.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const allowedHosts = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);
    if (parsed.protocol !== 'https:' || !allowedHosts.has(host)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function getCobaltEndpoint() {
  const configuredUrl = process.env.COBALT_API_URL;
  if (!configuredUrl) throw new Error('Download service is not configured. Set COBALT_API_URL in your deployment settings.');
  let endpoint;
  try {
    endpoint = new URL(configuredUrl);
  } catch {
    throw new Error('Download service configuration is invalid.');
  }
  if (!['http:', 'https:'].includes(endpoint.protocol)) throw new Error('Download service configuration is invalid.');
  return endpoint.toString().replace(/\/$/, '');
}

function createCobaltRequest(url, format, quality) {
  const safeQuality = ['144', '240', '360', '480', '720', '1080', '1440', '2160', '4320', 'max'].includes(quality) ? quality : '720';
  const safeFormat = ['auto', 'audio', 'mute'].includes(format) ? format : 'auto';
  return {
    url,
    filenameStyle: 'pretty',
    youtubeVideoCodec: 'h264',
    youtubeVideoContainer: 'mp4',
    downloadMode: safeFormat,
    videoQuality: safeQuality,
    ...(safeFormat === 'audio' ? { audioFormat: 'mp3', audioBitrate: '128' } : {})
  };
}

async function downloadVideo(url, format, quality) {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (process.env.COBALT_API_KEY) headers.Authorization = `Api-Key ${process.env.COBALT_API_KEY}`;
  const response = await fetchWithTimeout(getCobaltEndpoint(), {
    method: 'POST', headers, body: JSON.stringify(createCobaltRequest(url, format, quality))
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`The download service rejected this request (${data?.error?.code || `HTTP ${response.status}`}).`);
  if (!data || data.status === 'error') throw new Error(data?.error?.code || 'The download service could not process this video.');
  const downloadUrl = data.url || (data.status === 'picker' ? data.picker?.find((item) => item.type === 'video')?.url : null);
  if (!downloadUrl) throw new Error('This video needs local processing, which is unavailable on this download service.');
  return { success: true, url: downloadUrl, filename: data.filename || 'youtube_video', source: 'Cobalt', quality };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });
  if (!['GET', 'POST'].includes(req.method)) return sendJson(res, 405, { error: 'Method not allowed' });
  const params = req.method === 'GET' ? req.query : (req.body || {});
  const url = normalizeYouTubeUrl(params.url);
  if (!url) return sendJson(res, 400, { error: 'Enter a valid HTTPS YouTube or youtu.be URL.' });
  try {
    return sendJson(res, 200, await downloadVideo(url, params.format || 'auto', params.quality || '720'));
  } catch (error) {
    console.error('Download error:', error.message);
    return sendJson(res, 502, { error: 'Download failed', message: error.message });
  }
}
