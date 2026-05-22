const express = require('express');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

    if (!instagramMatch) {
      console.log('No Instagram link in message, skipping');
      return;
    }

    const instagramUrl = instagramMatch[0];
    const note = text.replace(instagramUrl, '').trim() || undefined;
    console.log(`Processing Instagram link from chat ${chatId}: ${instagramUrl}`);

    await triggerClaudeRoutine({
      instagram_url: instagramUrl,
      note,
      message_id: messageId,
      timestamp,
      trigger_id: uuidv4()
    });

    console.log('Successfully triggered Claude Code Routine');

  } catch (error) {
    console.error('Error in processMessage:', error);
  }
}

async function triggerClaudeRoutine(payload) {
  const routineEndpoint = process.env.ROUTINE_API_ENDPOINT;
  const bearerToken = process.env.ROUTINE_BEARER_TOKEN;

  if (!routineEndpoint) throw new Error('ROUTINE_API_ENDPOINT not set');
  if (!bearerToken) throw new Error('ROUTINE_BEARER_TOKEN not set');

  const triggerPayload = {
    text: JSON.stringify(payload)
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
