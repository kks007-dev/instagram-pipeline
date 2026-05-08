# Instagram-to-Google-Tasks Pipeline - Complete Index

This directory contains a complete, production-ready pipeline for analyzing Instagram/Telegram videos using Claude Code Routines.

## Start Here

**First time?** Start with one of these:
- **[QUICK_START.txt](QUICK_START.txt)** - 2-minute overview and quick setup
- **[README.md](README.md)** - Full project overview and features

**Ready to set up?** Follow this:
- **[SETUP.md](SETUP.md)** - Detailed 6-step setup guide

**Technical details?** Read these:
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and technical deep dive
- **[FILES.md](FILES.md)** - Complete reference for every file

## File Organization

### Application Code (3 files)
```
server.js              Main Express.js webhook server
package.json           Node.js dependencies and scripts
.env.example           Environment variables template (copy to .env)
```

### Claude Code Routine (1 file)
```
routine-prompt.md      System prompt for Claude analysis
```

### Deployment Configuration (3 files)
```
railway.json           Railway.app one-click deployment
render.yaml            Render.com deployment config
Dockerfile             Docker container (any platform)
```

### Testing & Utilities (2 files)
```
example-test-payload.json    Sample API trigger payload
test-routine-api.sh          Script to test Routine API manually
```

### Documentation (5 files)
```
README.md              Project overview and quick reference
SETUP.md               Step-by-step setup guide (detailed)
ARCHITECTURE.md        Technical design documentation
QUICK_START.txt        One-page quick reference
FILES.md               Complete file reference guide
```

### Configuration (2 files)
```
.gitignore             Git ignore patterns
.dockerignore          Docker build ignore patterns
```

## The Pipeline at a Glance

```
User sends video to Telegram bot
         ↓
    Webhook Server (server.js)
         ↓
  Claude Code Routine API
         ↓
    ┌─────────────────┐
    │ Routine Tasks:  │
    ├─────────────────┤
    │ Download video  │
    │ Transcribe      │ (AssemblyAI API)
    │ Analyze         │ (Claude)
    │ Format JSON     │
    │ Create task     │ (Google Tasks API)
    └─────────────────┘
         ↓
   Google Tasks
(Structured analysis)
```

## Quick Links by Task

### I want to...

**Get started quickly**
→ [QUICK_START.txt](QUICK_START.txt)

**Do a full setup**
→ [SETUP.md](SETUP.md) (6 steps)

**Deploy to production**
→ [SETUP.md](SETUP.md) - Step 4: Deploy Webhook Server

**Deploy to Railway**
→ [SETUP.md](SETUP.md) - Option A: Deploy to Railway

**Deploy to Render**
→ [SETUP.md](SETUP.md) - Option B: Deploy to Render

**Deploy with Docker**
→ [Dockerfile](Dockerfile)

**Test the Routine API**
→ [SETUP.md](SETUP.md) - Step 3.5: Test the Routine
→ Run: `./test-routine-api.sh example-test-payload.json`

**Understand the architecture**
→ [ARCHITECTURE.md](ARCHITECTURE.md)

**Fix a problem**
→ [SETUP.md](SETUP.md) - Troubleshooting section

**Customize the analysis**
→ Edit [routine-prompt.md](routine-prompt.md)

**Modify the webhook behavior**
→ Edit [server.js](server.js)

**Find all config options**
→ [FILES.md](FILES.md) - Configuration section

## Key Files to Know

### For Setup
| File | Purpose | Read When |
|------|---------|-----------|
| [SETUP.md](SETUP.md) | Complete setup guide | Starting from scratch |
| [.env.example](.env.example) | Environment variables | Copying to .env |
| [QUICK_START.txt](QUICK_START.txt) | Quick reference | Need fast overview |

### For Development
| File | Purpose | Read When |
|------|---------|-----------|
| [server.js](server.js) | Webhook server code | Modifying behavior |
| [package.json](package.json) | Dependencies | Adding packages |
| [routine-prompt.md](routine-prompt.md) | Claude instructions | Customizing analysis |

### For Deployment
| File | Purpose | Read When |
|------|---------|-----------|
| [railway.json](railway.json) | Railway config | Deploying to Railway |
| [render.yaml](render.yaml) | Render config | Deploying to Render |
| [Dockerfile](Dockerfile) | Docker image | Using containers |

### For Documentation
| File | Purpose | Read When |
|------|---------|-----------|
| [README.md](README.md) | Project overview | Learning about it |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical details | Understanding design |
| [FILES.md](FILES.md) | Complete reference | Looking up details |

## Environment Variables

Copy [.env.example](.env.example) to `.env` and fill in:

```env
TELEGRAM_BOT_TOKEN=your_token_from_botfather
ROUTINE_API_ENDPOINT=https://api.claude.ai/code/routines/your-id/trigger
ROUTINE_BEARER_TOKEN=your_bearer_token
PORT=3000
NODE_ENV=production
```

See [SETUP.md](SETUP.md) for where to get each value.

## Deployment Options

| Platform | Config File | Time | Cost | Free Tier |
|----------|---|---|---|---|
| Railway | [railway.json](railway.json) | 5 min | ~$7/mo | Yes |
| Render | [render.yaml](render.yaml) | 5 min | ~$7/mo | Yes |
| Docker | [Dockerfile](Dockerfile) | Varies | Varies | Yes |
| Local | None | <1 min | $0 | Yes |

See [SETUP.md](SETUP.md) - Step 4 for detailed instructions.

## Testing

Use the provided test script:
```bash
./test-routine-api.sh example-test-payload.json
```

Requires:
- `ROUTINE_API_ENDPOINT` environment variable
- `ROUTINE_BEARER_TOKEN` environment variable

See [SETUP.md](SETUP.md) - Step 3.5 for details.

## Key APIs Used

| API | Purpose | Key File |
|-----|---------|----------|
| Telegram Bot API | Video reception | [server.js](server.js) |
| Claude Code Routine API | Trigger analysis | [server.js](server.js) |
| AssemblyAI | Video transcription | [routine-prompt.md](routine-prompt.md) |
| Google Tasks | Store results | [routine-prompt.md](routine-prompt.md) |

## Architecture Overview

**Webhook Server**: Node.js/Express running on Railway/Render/Docker
- Receives Telegram webhook POSTs
- Extracts video information
- Calls Telegram CDN to get video URL
- Triggers Claude Code Routine with video URL

**Claude Code Routine**: Cloud-based analysis engine
- Downloads video from URL
- Transcribes with AssemblyAI API
- Analyzes transcript intelligently
- Creates Google Task with structured results

**Google Tasks**: Results storage
- Task created with analysis summary
- Full JSON in task notes
- Searchable and shareable

See [ARCHITECTURE.md](ARCHITECTURE.md) for deep technical details.

## Quick Setup Checklist

- [ ] Create Telegram bot (@BotFather) - get TOKEN
- [ ] Get AssemblyAI API key (assemblyai.com)
- [ ] Create Claude Code Routine (claude.ai/code/routines)
- [ ] Get Routine API endpoint and bearer token
- [ ] Connect Google Tasks connector in Routine
- [ ] Copy .env.example to .env
- [ ] Fill in .env with your tokens
- [ ] Deploy webhook server (Railway/Render/Docker)
- [ ] Register Telegram webhook with server URL
- [ ] Test with sample video
- [ ] Verify task appears in Google Tasks

See [SETUP.md](SETUP.md) for detailed step-by-step instructions.

## Common Commands

```bash
# Development
npm install          # Install dependencies
npm run dev         # Start with auto-reload
npm start           # Start production server

# Testing
./test-routine-api.sh example-test-payload.json

# Docker
docker build -t instagram-pipeline .
docker run -e TELEGRAM_BOT_TOKEN=... -p 3000:3000 instagram-pipeline

# Deployment
git push origin main  # Triggers auto-deployment to Railway/Render
```

## Documentation Map

```
START HERE:
├── QUICK_START.txt        ← 2-minute overview
├── README.md              ← Full overview
└── SETUP.md               ← 6-step guide

THEN:
├── ARCHITECTURE.md        ← How it works
├── FILES.md              ← File reference
└── This file (INDEX.md)   ← You are here

FOR DEVELOPMENT:
├── server.js             ← Webhook code
├── routine-prompt.md     ← Analysis instructions
├── package.json          ← Dependencies
└── .env.example          ← Configuration

FOR DEPLOYMENT:
├── railway.json          ← Railway config
├── render.yaml           ← Render config
├── Dockerfile            ← Docker config
├── .gitignore            ← Git patterns
└── .dockerignore         ← Docker patterns

FOR TESTING:
├── example-test-payload.json  ← Sample payload
└── test-routine-api.sh        ← Test script
```

## Support

**Setup help**: See [SETUP.md](SETUP.md) - Troubleshooting section

**Architecture questions**: See [ARCHITECTURE.md](ARCHITECTURE.md)

**API documentation**:
- Telegram: https://core.telegram.org/bots/api
- Claude Code: https://claude.ai/code/docs
- AssemblyAI: https://www.assemblyai.com/docs
- Google Tasks: https://developers.google.com/tasks

**External resources**:
- Telegram Bot Guide: https://core.telegram.org/bots
- AssemblyAI Quickstart: https://www.assemblyai.com/docs/getting-started
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs

## What's Included

16 files totaling ~2500 lines of code and documentation:
- 1 main application (Node.js/Express)
- 1 Claude Code Routine system prompt
- 3 deployment configs (Railway, Render, Docker)
- 2 utility scripts for testing
- 5 comprehensive documentation files
- 2 configuration files for version control
- 2 JSON/YAML templates

Everything needed for production deployment.

## Next Steps

1. **Start**: Read [QUICK_START.txt](QUICK_START.txt)
2. **Setup**: Follow [SETUP.md](SETUP.md) step-by-step
3. **Deploy**: Use [railway.json](railway.json) or [render.yaml](render.yaml)
4. **Test**: Send a video to your Telegram bot
5. **Customize**: Edit [routine-prompt.md](routine-prompt.md) for your needs

---

**Created**: May 8, 2026  
**Status**: Production Ready  
**Version**: 1.0.0

Questions? See [SETUP.md](SETUP.md#troubleshooting) or [ARCHITECTURE.md](ARCHITECTURE.md).
