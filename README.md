# Instagram Video → Google Tasks Pipeline

Transform Instagram/Telegram videos into analyzed, transcribed tasks in Google Tasks using Claude Code Routines and AssemblyAI.

## What It Does

1. **Receives Videos**: Telegram bot accepts video messages (from Instagram or direct uploads)
2. **Triggers Analysis**: Webhook server forwards videos to Claude Code Routine API
3. **Transcribes**: AssemblyAI automatically transcribes video audio
4. **Analyzes**: Claude analyzes the transcript as a research assistant
5. **Saves Results**: Creates structured task in Google Tasks with full analysis

## Pipeline Diagram

```
Instagram/Telegram Video
        ↓
   Telegram Bot
        ↓
Webhook Server (Node.js/Express)
        ↓
Claude Code Routine API Trigger
        ↓
┌─────────────────────────────┐
│ Claude Code Routine Tasks:  │
├─────────────────────────────┤
│ • Fetch video from URL      │
│ • Call AssemblyAI           │
│ • Analyze transcript        │
│ • Format JSON output        │
│ • Create Google Task        │
└─────────────────────────────┘
        ↓
    Google Tasks
```

## Key Features

- **Fully Cloud-Based**: Routine runs on Claude subscription (no desktop needed)
- **Webhook-Driven**: Responds immediately to video uploads
- **Transcription Included**: AssemblyAI automatically generates transcripts
- **Smart Analysis**: Claude provides structured insights (title, summary, concepts, tags)
- **Task Integration**: Automatically creates organized tasks in Google Tasks
- **Error Handling**: Graceful failures with detailed error tasks
- **Scalable**: Deploy to Railway or Render for public access

## Architecture

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Telegram Bot | Bot API | Receives video messages |
| Webhook Server | Node.js/Express | Processes messages, triggers Routine |
| Claude Code Routine | Cloud API | Orchestrates analysis workflow |
| AssemblyAI | SaaS | Transcribes video audio |
| Google Tasks | Cloud API | Stores analysis results |

### Data Flow

```json
// Webhook receives:
{
  "video_url": "https://api.telegram.org/file/bot.../video.mp4",
  "caption": "Optional message",
  "message_id": 12345,
  "timestamp": "2026-05-08T15:30:00Z",
  "chat_id": 987654,
  "file_id": "AgADBAAD..."
}

// Routine outputs to Google Tasks:
{
  "title": "Key Technologies in AI Research",
  "summary": "Discussion of transformer models and their applications in NLP...",
  "key_concepts": ["Transformers", "Attention Mechanisms", "NLP"],
  "why_it_matters": "Understanding modern AI architectures is crucial...",
  "next_steps": ["Research attention mechanisms", "Explore implementations"],
  "tags": ["#AI", "#NLP", "#Research"],
  "transcript": "[full audio transcript]",
  "metadata": {...}
}
```

## Quick Start

1. **Clone/Download** this repository
2. **Follow SETUP.md** for step-by-step configuration
3. **Deploy** to Railway or Render (~5 minutes)
4. **Send videos** to your Telegram bot
5. **Check Google Tasks** for analysis results

## Requirements

- Telegram account + bot (free via @BotFather)
- Claude account with Routines access
- AssemblyAI account (free tier: 600 min/month)
- Google account with Google Tasks
- Deployment platform (Railway, Render, or local)

## File Structure

```
instagram-pipeline/
├── server.js              # Node.js webhook server
├── package.json          # Dependencies (Express, node-fetch, etc.)
├── .env.example          # Environment variables template
├── routine-prompt.md     # Claude Code Routine system prompt
├── railway.json          # Railway deployment config
├── render.yaml           # Render deployment config
├── SETUP.md             # Complete step-by-step setup guide
└── README.md            # This file
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | From @BotFather on Telegram |
| `ROUTINE_API_ENDPOINT` | From claude.ai/code/routines |
| `ROUTINE_BEARER_TOKEN` | From Routine API trigger settings |
| `ASSEMBLYAI_API_KEY` | From assemblyai.com (set in Routine) |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | production or development |

### Claude Code Routine Setup

The `routine-prompt.md` file contains:
- **System instructions** for Claude
- **Input/output specifications** with JSON schemas
- **Step-by-step process** for analysis
- **Error handling** procedures
- **AssemblyAI integration** details

## Deployment

### Railway (Recommended)
```bash
# 1. Push to GitHub
git push origin main

# 2. Go to railway.app and link repository
# 3. Add environment variables in Railway dashboard
# 4. Deploy automatically on push
```

### Render
```bash
# 1. Push to GitHub
# 2. Go to render.com and create Web Service
# 3. Connect GitHub repository
# 4. Add environment variables
# 5. Deploy
```

### Local (Testing)
```bash
npm install
cp .env.example .env
# Fill in .env with your values
npm start
# Then use ngrok or similar to expose: ngrok http 3000
```

## API Endpoints

### Health Check
```
GET /health
Returns: { "status": "ok", "timestamp": "2026-05-08T15:30:00Z" }
```

### Telegram Webhook
```
POST /webhook
Telegram sends message updates here automatically
Returns: 200 OK (to Telegram)
```

## Output Format

Each Google Task contains:

```json
{
  "title": "Concise 5-10 word description",
  "summary": "2-3 sentence overview",
  "key_concepts": ["concept1", "concept2", "concept3"],
  "why_it_matters": "1-2 sentences on relevance",
  "next_steps": ["action1", "action2"],
  "tags": ["#tag1", "#tag2", "#tag3"],
  "transcript": "Full audio transcription...",
  "metadata": {
    "duration_seconds": 120,
    "original_caption": "User's message",
    "processed_at": "2026-05-08T15:30:45Z",
    "confidence": "high"
  }
}
```

## Troubleshooting

### Common Issues

**Webhook not receiving messages?**
- Verify URL is publicly accessible
- Check webhook registration: `curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo`

**Routine not triggering?**
- Check API endpoint and bearer token are correct
- Verify environment variables are set
- Review Routine logs in Claude dashboard

**No Google Tasks created?**
- Ensure Google Tasks connector is authenticated
- Check Routine logs for API errors
- Verify task list exists in Google Tasks

See **SETUP.md** for detailed troubleshooting guide.

## Advanced Usage

### Custom Analysis Rules
Edit `routine-prompt.md` to customize:
- JSON output schema
- Analysis depth and focus
- Metadata collected
- Error handling

### Multiple Bots/Routines
- Create separate bots for different content types
- Create separate Routines for specialized analysis
- Route webhooks to different endpoints

### Monitoring
- **Railway**: Built-in logs and monitoring
- **Render**: Dashboard logs and metrics
- **Claude**: Routine logs and activity history

### Scaling
- Webhook server handles concurrent requests
- Transcription typically takes 1-3 minutes
- Consider background queues for high volume

## Limitations

- Telegram video size limit: 50 MB
- AssemblyAI free tier: 600 minutes/month
- Transcription takes 1-3 minutes per video
- Video URL valid for ~12 hours (process quickly)
- Google Tasks API rate limits apply

## Costs

| Service | Cost | Notes |
|---------|------|-------|
| Telegram Bot | Free | Unlimited messages |
| Claude Code Routine | Included | Part of Claude subscription |
| AssemblyAI | Free (600 min/mo) | Or ~$0.17/min overage |
| Google Tasks | Free | Unlimited |
| Railway/Render | ~$7/mo | Or free tier available |

## Security

- Bearer token required for Routine API
- Telegram webhook uses HTTPS only
- Environment variables in secure vaults
- No video storage (processed immediately)
- Logs contain minimal sensitive data

## Contributing

Improvements welcome:
- Additional analysis types
- More output connectors
- Performance optimizations
- Better error messages

## License

MIT

## Support

- **Setup Issues**: See SETUP.md troubleshooting section
- **API Docs**: Check links in SETUP.md
- **Claude Code**: Visit claude.ai/code

---

**Pipeline Version**: 1.0.0  
**Created**: May 2026  
**Status**: Production Ready
