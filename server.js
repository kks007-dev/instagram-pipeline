const express = require('express');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Telegram webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    // Return 200 immediately to Telegram
    res.status(200).json({ ok: true });

    // Process the message asynchronously
    processMessage(req.body).catch(err => {
      console.error('Error processing message:', err);
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ ok: true }); // Still return 200 to Telegram
  }
});

/**
 * Process incoming Telegram message
 * Extracts video, downloads it, and triggers Claude Code Routine
 */
const INSTAGRAM_REGEX = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/;

async function processMessage(update) {
  try {
    if (!update.message) return;

    const message = update.message;
    const messageId = message.message_id;
    const timestamp = new Date(message.date * 1000).toISOString();
    const chatId = message.chat.id;

    // Handle Instagram links in text or caption
    const text = message.text || message.caption || '';
    const instagramMatch = text.match(INSTAGRAM_REGEX);

    if (instagramMatch) {
      const instagramUrl = instagramMatch[0];
      console.log(`Processing Instagram link from chat ${chatId}: ${instagramUrl}`);

      // Resolve Instagram URL to direct MP4 via RapidAPI
      const directUrl = await resolveInstagramUrl(instagramUrl);
      console.log(`Resolved to direct URL: ${directUrl}`);

      await triggerClaudeRoutine({
        video_url: directUrl,
        caption: text,
        message_id: messageId,
        timestamp: timestamp,
        chat_id: chatId,
        file_id: null
      });

      console.log('Successfully triggered Claude Code Routine for Instagram link');
      return;
    }

    // Handle direct video file uploads
    if (!update.message.video) {
      console.log('No video or Instagram link in message, skipping');
      return;
    }

    const video = message.video;
    const caption = message.caption || '';

    console.log(`Processing video from chat ${chatId}, message ${messageId}`);
    console.log(`Caption: ${caption}`);
    console.log(`Video file_id: ${video.file_id}`);

    // Step 1: Get file path from Telegram
    const fileInfo = await getTelegramFile(video.file_id);

    // Step 2: Download video from Telegram
    const videoUrl = await downloadTelegramFile(fileInfo.file_path);

    console.log(`Downloaded video: ${videoUrl}`);

    // Step 3: Call Claude Code Routine API trigger
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
    // Don't throw - we already returned 200 to Telegram
  }
}

/**
 * Resolve Instagram URL to direct MP4 download URL via RapidAPI
 */
async function resolveInstagramUrl(instagramUrl) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) throw new Error('RAPIDAPI_KEY not set');

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

  // Download and re-upload to transfer.sh so the URL is not IP-locked
  console.log('Downloading video to re-host...');
  const videoResponse = await fetch(cdnUrl);
  if (!videoResponse.ok) throw new Error(`Failed to download video: ${videoResponse.status}`);

  const videoBuffer = await videoResponse.buffer();

  const uploadResponse = await fetch('https://transfer.sh/video.mp4', {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Max-Days': '1'
    },
    body: videoBuffer
  });

  if (!uploadResponse.ok) throw new Error(`transfer.sh upload failed: ${uploadResponse.status}`);

  const publicUrl = await uploadResponse.text();
  console.log(`Re-hosted at: ${publicUrl.trim()}`);
  return publicUrl.trim();
}

/**
 * Get file information from Telegram Bot API
 */
async function getTelegramFile(fileId) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not set');
  }

  const url = `https://api.telegram.org/bot${botToken}/getFile`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId })
  });

  if (!response.ok) {
    throw new Error(`Telegram getFile failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data.result;
}

/**
 * Download file from Telegram servers
 * Returns a public URL that the Routine can access
 */
async function downloadTelegramFile(filePath) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // Return direct Telegram CDN URL that Claude Code Routine can fetch from
  // This avoids needing to store the file ourselves
  const telegramFileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

  return telegramFileUrl;
}

/**
 * Trigger Claude Code Routine via API
 * POSTs to the Routine's API endpoint with the video info
 */
async function triggerClaudeRoutine(payload) {
  const routineEndpoint = process.env.ROUTINE_API_ENDPOINT;
  const bearerToken = process.env.ROUTINE_BEARER_TOKEN;

  if (!routineEndpoint) {
    throw new Error('ROUTINE_API_ENDPOINT not set');
  }

  if (!bearerToken) {
    throw new Error('ROUTINE_BEARER_TOKEN not set');
  }

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

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(200).json({ ok: true }); // Still return 200 to Telegram
});

// Start server
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
  console.log(`Telegram webhook: POST /webhook`);
  console.log(`Health check: GET /health`);
});
