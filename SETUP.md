# Instagram-to-Google-Tasks Pipeline Setup Guide

This guide walks you through setting up the complete pipeline: Instagram video → Telegram bot → Claude Code Routine → Google Tasks.

## Architecture Overview

```
Instagram/Telegram Video
         ↓
    Telegram Bot
         ↓
   Webhook Server (deployed to Railway/Render)
         ↓
Claude Code Routine API Trigger
         ↓
    AssemblyAI Transcription
         ↓
    Claude Analysis
         ↓
    Google Tasks
```

## Prerequisites

- A Telegram account and access to create bots
- A Claude account with access to Claude Code Routines (research preview, available since April 2026)
- An AssemblyAI account (free tier available)
- A Google account with Google Tasks enabled
- A deployment platform account (Railway or Render)

## Step 1: Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a conversation with BotFather
3. Send `/newbot`
4. Follow the prompts to name your bot (e.g., "InstagramAnalyzerBot")
5. BotFather will return your **bot token**, which looks like: `123456789:ABCDefGHIjklmnoPQRstUVwxyZ`
6. Save this token - you'll need it for environment variables

### Configure Bot Features (Optional but Recommended)

In BotFather:
- Send `/setprivacy` → select your bot → disable "Group Privacy" if you want to use it in groups
- Send `/setcommands` → add useful commands like `/start`, `/help`

## Step 2: Get AssemblyAI API Key

1. Go to [assemblyai.com](https://www.assemblyai.com)
2. Click "Sign Up" (free tier includes 600 minutes/month)
3. Create an account
4. In your dashboard, go to "API token"
5. Copy your API token (looks like a long alphanumeric string)
6. Save this for later

## Step 3: Create Claude Code Routine

### 3.1 Set Up the Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines)
2. Click "Create Routine" or "New Routine"
3. Name it: "Instagram Video Analyzer"
4. Description: "Analyzes Instagram/Telegram videos, transcribes with AssemblyAI, and saves results to Google Tasks"
5. Click "Create"

### 3.2 Configure System Prompt

1. In the Routine editor, find the "System Prompt" or "Instructions" section
2. Copy the entire contents of `routine-prompt.md` from this repository
3. Paste it into the system prompt field
4. Save the routine

### 3.3 Add Connectors

1. In the Routine settings, find "Connectors" or "Connected Services"
2. Click "Add Connector"

#### Google Tasks Connector
- Search for "Google Tasks"
- Click to connect
- You'll be prompted to authenticate with your Google account
- Grant permissions when asked
- Select the default task list or create a new one

#### AssemblyAI (Manual Environment Variable)
- You'll add this in the deployment step via environment variables
- The Routine will use `ASSEMBLYAI_API_KEY` from the environment

### 3.4 Set Up API Trigger

1. In the Routine, look for "API Trigger" or "Webhooks" section
2. Click "Enable API Trigger"
3. Copy the **API Endpoint URL** (looks like: `https://api.claude.ai/code/routines/your-routine-id/trigger`)
4. Copy the **Bearer Token** for authentication
5. Save these - you'll need them for the webhook server

### 3.5 Test the Routine (Optional)

Before deploying, you can test locally:

1. Save the API endpoint and bearer token
2. Create a test JSON file (`test-payload.json`):
   ```json
   {
     "video_url": "https://example.com/test-video.mp4",
     "caption": "Test video",
     "message_id": 1,
     "timestamp": "2026-05-08T15:00:00Z",
     "chat_id": 123,
     "file_id": "test",
     "trigger_id": "test-uuid"
   }
   ```
3. Use curl to test:
   ```bash
   curl -X POST https://api.claude.ai/code/routines/your-routine-id/trigger \
     -H "Authorization: Bearer your-bearer-token" \
     -H "Content-Type: application/json" \
     -d @test-payload.json
   ```
4. Check Google Tasks to see if a task was created

## Step 4: Deploy Webhook Server

### Option A: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up or log in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select this repository (or fork it first)
5. Railway will detect the Node.js app automatically
6. Click "Deploy"
7. In the Railway dashboard, add environment variables:
   - `TELEGRAM_BOT_TOKEN`: Your token from Step 1
   - `ROUTINE_API_ENDPOINT`: URL from Step 3.4
   - `ROUTINE_BEARER_TOKEN`: Token from Step 3.4
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
8. Railway will generate a public URL (e.g., `https://your-service.railway.app`)
9. Save this URL for the Telegram webhook step

### Option B: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up or log in
3. Click "New +" → "Web Service"
4. Connect your GitHub account and select this repository
5. Configure:
   - Name: `instagram-telegram-pipeline`
   - Environment: `Node`
   - Build command: `npm install`
   - Start command: `npm start`
6. Add environment variables:
   - `TELEGRAM_BOT_TOKEN`: Your token from Step 1
   - `ROUTINE_API_ENDPOINT`: URL from Step 3.4
   - `ROUTINE_BEARER_TOKEN`: Token from Step 3.4
   - `NODE_ENV`: `production`
7. Click "Create Web Service"
8. Wait for deployment to complete
9. Copy the service URL (e.g., `https://instagram-telegram-pipeline.onrender.com`)

### Option C: Deploy Locally (for testing)

1. Clone this repository
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Fill in the environment variables
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the server:
   ```bash
   npm start
   ```
6. Your webhook will be available at `http://localhost:3000/webhook`
7. To expose to Telegram, use a tunneling service like ngrok:
   ```bash
   ngrok http 3000
   ```

## Step 5: Register Telegram Webhook

### Set Your Bot's Webhook URL

Use the URL from your deployment (Railway/Render/ngrok):

#### Using curl:
```bash
curl -X POST https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-service.railway.app/webhook"}'
```

Replace:
- `{YOUR_BOT_TOKEN}` with your token from Step 1
- `https://your-service.railway.app/webhook` with your actual deployment URL

#### Example:
```bash
curl -X POST https://api.telegram.org/bot123456789:ABCDefGHIjklmnoPQRstUVwxyZ/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://instagram-telegram-pipeline.onrender.com/webhook"}'
```

### Verify Webhook Registration

```bash
curl https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getWebhookInfo
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-service.railway.app/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Step 6: Test the Full Pipeline

1. Start a conversation with your bot on Telegram (@YourBotName)
2. Send `/start` to activate the bot
3. Send a video or forward a video from Instagram
4. Include a caption (optional): "Test video about machine learning"
5. The webhook server will:
   - Receive the video
   - Download it from Telegram's servers
   - Trigger the Claude Code Routine
6. Monitor the logs in your deployment platform:
   - Railway: Project settings → "Logs"
   - Render: Dashboard → Service logs
7. Check Google Tasks within 2-5 minutes:
   - A new task should appear with the video analysis
   - The task details contain the full JSON with transcript and analysis

## Troubleshooting

### Webhook Not Receiving Messages

**Problem**: Bot receives messages but webhook isn't called

**Solutions**:
- Verify webhook URL is publicly accessible: `curl https://your-url/health`
- Check webhook registration: `curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo`
- Ensure the webhook URL ends with `/webhook`
- Check deployment logs for errors

### Routine Not Triggering

**Problem**: Webhook succeeds (returns 200) but Routine doesn't run

**Solutions**:
- Verify `ROUTINE_API_ENDPOINT` is correct (copy from claude.ai/code/routines)
- Verify `ROUTINE_BEARER_TOKEN` matches exactly
- Check Routine logs in Claude Code dashboard
- Test API trigger manually with curl (see Step 3.5)

### Transcription Failures

**Problem**: Video transcribed but Google Tasks task isn't created

**Solutions**:
- Check AssemblyAI API key is correct
- Ensure Google Tasks connector is properly authenticated in Routine
- Check Routine logs for error messages
- Verify video file isn't corrupted and is in a supported format

### Google Tasks Not Updated

**Problem**: Routine runs but no task appears in Google Tasks

**Solutions**:
- Verify Google Tasks connector is connected and authenticated
- Check the Google account used for OAuth
- Ensure you're looking in the right Google Tasks list
- Check Routine logs for Google Tasks API errors

### General Debugging

1. **Enable verbose logging** in deployment settings
2. **Check logs in real-time**:
   - Railway: `railway logs -f`
   - Render: Use dashboard logs
3. **Test health endpoint**: `curl https://your-url/health`
4. **Monitor Claude Code Routine logs**: claude.ai/code/routines → select routine → "Logs" or "Activity"

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token from BotFather | `123456789:ABCDefGHIjklmnoPQRstUVwxyZ` |
| `ROUTINE_API_ENDPOINT` | Yes | Claude Code Routine API trigger URL | `https://api.claude.ai/code/routines/abc123/trigger` |
| `ROUTINE_BEARER_TOKEN` | Yes | Bearer token for Routine API | `long_token_string_here` |
| `ASSEMBLYAI_API_KEY` | Yes (in Routine) | AssemblyAI API key | `your_assemblyai_token` |
| `NODE_ENV` | No | Node environment | `production` |
| `PORT` | No | Server port | `3000` |

## Security Best Practices

1. **Never commit `.env` files**: Always use `.env.example` as template
2. **Rotate tokens regularly**: If leaked, regenerate in BotFather/AssemblyAI dashboard
3. **Use HTTPS only**: All webhook URLs should be HTTPS (Railway/Render provide this by default)
4. **Monitor logs**: Watch for unusual activity or rate limits
5. **Limit Routine scope**: Only grant Google Tasks connector access to what's needed
6. **IP whitelisting** (optional): Configure your Telegram bot to only accept requests from Telegram's IP ranges

## Advanced Configuration

### Custom Analysis Rules

Edit `routine-prompt.md` to customize:
- What fields to extract from transcripts
- JSON output schema
- Analysis depth and focus
- Error handling behavior

### Batch Processing

To process multiple videos:
1. Create multiple bots or a bot that handles group messages
2. The webhook server already handles concurrent requests
3. Monitor deployment resource usage (CPU, memory, bandwidth)

### Monitoring and Alerts

Set up alerts in your deployment platform:
- **Railway**: Add monitoring with integrations
- **Render**: Set up uptime monitoring and log filters

### Performance Optimization

- Transcription is the slowest step (typically 1-3 minutes depending on video length)
- Consider implementing a background queue if processing many videos
- AssemblyAI offers batch transcription endpoints for very large volumes

## Next Steps

Once everything is working:

1. **Create additional analysis routines** for different types of content
2. **Add more connectors** (Slack, Email, Spreadsheets) for additional integrations
3. **Build a dashboard** to visualize analysis results
4. **Implement user authentication** if sharing the bot with multiple people
5. **Add video storage** if you need to archive videos alongside analyses

## Support

- **Telegram Bot API Docs**: https://core.telegram.org/bots/api
- **Claude Code Documentation**: https://claude.ai/code/docs
- **AssemblyAI Docs**: https://www.assemblyai.com/docs
- **Google Tasks API**: https://developers.google.com/tasks

## Maintenance

### Regular Checks

- Monthly: Verify webhook is still registered
- Monthly: Check AssemblyAI usage and plan limits
- Quarterly: Review and update `routine-prompt.md` if needed
- As needed: Rotate API tokens if suspected compromise

### Updates

- Keep dependencies updated: `npm update`
- Monitor security advisories: `npm audit`
- Check for Claude Code feature updates at claude.ai/code

---

**Created**: May 2026  
**Last Updated**: May 8, 2026
