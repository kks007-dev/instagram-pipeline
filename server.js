const express = require('express');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `https://instagram-pipeline.onrender.com`;

// In-memory video store: id -> buffer (cleared after 1 hour)
const videoStore = new Map();

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve temporarily stored videos
app.get('/video/:id', (req, res) => {
  const buf = videoStore.get(req.params.id);
  if (!buf) return res.status(404).send('Not found or expired');
  res.set('Content-Type', 'video/mp4');
  res.send(buf);
});

// Telegram webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    res.status(200).json({ ok: true });
    processMessage(req.body).catch(err => {
      console.error('Error processing message:', err);
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ ok: true });
  }
});

const INSTAGRAM_REGEX = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/;

async function processMessage(update) {
  try {
    if (!update.message) return;

    const message = update.message;
    const messageId = message.message_id;
    const timestamp = new Date(message.date * 1000).toISOString();
    const chatId = message.chat.id;

    const text = message.text || message.caption || '';
    const instagramMatch = text.match(INSTAGRAM_REGEX);

    if (instagramMatch) {
      const instagramUrl = instagramMatch[0];
      console.log(`Processing Instagram link from chat ${chatId}: ${instagramUrl}`);

      const hostedUrl = await resolveAndHostVideo(instagramUrl);
      console.log(`Hosted video at: ${hostedUrl}`);

      await triggerClaudeRoutine({
        video_url: hostedUrl,
        caption: text,
        message_id: messageId,
        timestamp: timestamp,
        chat_id: chatId,
        file_id: null
      });

      console.log('Successfully triggered Claude Code Routine for Instagram link');
      return;
    }

    if (!update.message.video) {
      console.log('No video or Instagram link in message, skipping');
      return;
    }

    const video = message.video;
    const caption = message.caption || '';

    console.log(`Processing video from chat ${chatId}, message ${messageId}`);

    const fileInfo = await getTelegramFile(video.file_id);
    const videoUrl = await downloadTelegramFile(fileInfo.file_path);

    await triggerClaudeRoutine({
      video_url: videoUrl,
      caption: caption,
      message_id: messageId,
      timestamp: timestamp,
      chat_id: chatId,
      file_id: video.file_id
    });

    console.log('Successfully triggered Claude Code Routine');

  } catch (error) {
    console.error('Error in processMessage:', error);
  }
}

/**
 * Download Instagram video via RapidAPI and host it on this server
 */
async function resolveAndHostVideo(instagramUrl) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) throw new Error('RAPIDAPI_KEY not set');

  // Step 1: Get CDN URL from RapidAPI
  const encodedUrl = encodeURIComponent(instagramUrl);
  const response = await fetch(
    `https://instagram-post-reels-stories-downloader-api.p.rapidapi.com/instagram/?url=${encodedUrl}`,
    {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-post-reels-stories-downloader-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey
      }
    }
  );

  if (!response.ok) throw new Error(`RapidAPI failed: ${response.status}`);

  const data = await response.json();
  if (!data.status || !data.result || !data.result[0]) {
    throw new Error('No video URL returned from RapidAPI');
  }

  const cdnUrl = data.result[0].url;
  console.log('Downloading video from CDN...');

  // Step 2: Download the video buffer
  const videoResponse = await fetch(cdnUrl);
  if (!videoResponse.ok) throw new Error(`Failed to download video: ${videoResponse.status}`);

  const videoBuffer = await videoResponse.buffer();
  console.log(`Downloaded ${videoBuffer.length} bytes`);

  // Step 3: Store in memory and return a public URL via this server
  const id = uuidv4();
  videoStore.set(id, videoBuffer);

  // Auto-delete after 1 hour
  setTimeout(() => videoStore.delete(id), 60 * 60 * 1000);

  return `${BASE_URL}/video/${id}`;
}

async function getTelegramFile(fileId) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not set');

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId })
  });

  if (!response.ok) throw new Error(`Telegram getFile failed: ${response.status}`);

  const data = await response.json();
  if (!data.ok) throw new Error(`Telegram API error: ${data.description}`);

  return data.result;
}

async function downloadTelegramFile(filePath) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
}

async function triggerClaudeRoutine(payload) {
  const routineEndpoint = process.env.ROUTINE_API_ENDPOINT;
  const bearerToken = process.env.ROUTINE_BEARER_TOKEN;

  if (!routineEndpoint) throw new Error('ROUTINE_API_ENDPOINT not set');
  if (!bearerToken) throw new Error('ROUTINE_BEARER_TOKEN not set');

  const triggerPayload = {
    text: `Analyze this Instagram video: ${payload.video_url}\nCaption: ${payload.caption || 'none'}\nTimestamp: ${payload.timestamp}`
  };

  console.log('Triggering Routine with payload:', JSON.stringify(triggerPayload, null, 2));

  const response = await fetch(routineEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'experimental-cc-routine-2026-04-01'
    },
    body: JSON.stringify(triggerPayload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Routine API failed: ${response.status} ${response.statusText} - ${text}`);
  }

  const result = await response.json();
  console.log('Routine triggered successfully:', result);
  return result;
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
  console.log(`Telegram webhook: POST /webhook`);
  console.log(`Health check: GET /health`);
});
