# Pipeline Files Reference

Complete list of all files with descriptions and purposes.

## Core Application Files

### `server.js` (430 lines)
The main Node.js/Express webhook server.

**What it does**:
- Receives Telegram webhook POST requests at `/webhook`
- Validates and extracts video information
- Calls Telegram API to get file metadata
- Constructs download URL for the video
- POSTs trigger payload to Claude Code Routine API
- Returns 200 immediately to Telegram for reliability

**Key exports**: 
- `processMessage()` - Async message handler
- `getTelegramFile()` - Calls Telegram getFile API
- `downloadTelegramFile()` - Constructs CDN URL
- `triggerClaudeRoutine()` - HTTP POST to Routine API

**Environment variables used**:
- `TELEGRAM_BOT_TOKEN` - Authenticate with Telegram
- `ROUTINE_API_ENDPOINT` - Where to send triggers
- `ROUTINE_BEARER_TOKEN` - Routine API auth
- `PORT` - Server listen port
- `NODE_ENV` - Environment mode

**Dependencies**: express, node-fetch, uuid, dotenv

### `package.json` (31 lines)
Node.js project configuration and dependencies.

**Contents**:
- Project metadata (name, version, description)
- npm scripts: `start`, `dev`
- Dependencies: express, node-fetch, uuid, dotenv
- DevDependencies: nodemon
- Engine: Node.js >= 16.0.0

**Install**: `npm install`  
**Start**: `npm start`

### `.env.example` (14 lines)
Template for environment variables.

**Variables explained**:
- `TELEGRAM_BOT_TOKEN` - Get from @BotFather on Telegram
- `ROUTINE_API_ENDPOINT` - From claude.ai/code/routines
- `ROUTINE_BEARER_TOKEN` - From Routine API trigger settings
- `NODE_ENV` - Use "production"
- `PORT` - Default 3000

**Usage**: Copy to `.env` and fill in values

---

## Claude Code Routine Files

### `routine-prompt.md` (250 lines)
System prompt for Claude Code Routine execution.

**What it tells Claude to do**:
1. Receive API trigger payload
2. Download video from URL
3. Call AssemblyAI to transcribe
4. Analyze transcript as research assistant
5. Format structured JSON output
6. Create Google Task with results

**Input schema**:
```json
{
  "video_url": "string",
  "caption": "string",
  "message_id": "number",
  "timestamp": "ISO-8601",
  "chat_id": "number",
  "file_id": "string",
  "trigger_id": "UUID"
}
```

**Output schema**:
```json
{
  "title": "string",
  "summary": "string",
  "key_concepts": ["string"],
  "why_it_matters": "string",
  "next_steps": ["string"],
  "tags": ["#tag"],
  "transcript": "string",
  "metadata": {
    "duration_seconds": "number",
    "original_caption": "string",
    "processed_at": "ISO-8601",
    "confidence": "high|medium|low"
  }
}
```

**API integrations**:
- AssemblyAI: Transcription
- Google Tasks: Task creation

---

## Deployment Configuration Files

### `railway.json` (34 lines)
Railway.app deployment configuration.

**Includes**:
- Build configuration (Heroku buildpacks, Node.js)
- Deploy settings (start command, restart policy)
- Environment variables template
- Auto-detection of Node.js

**Deploy**: Push to GitHub, Railway auto-deploys

### `render.yaml` (16 lines)
Render.com deployment configuration.

**Includes**:
- Web service definition
- Node.js runtime
- Build and start commands
- Environment variable declarations

**Deploy**: Connect GitHub repo to Render, auto-deploys

### `Dockerfile` (21 lines)
Docker container definition for any platform.

**Includes**:
- Base image: node:18-alpine
- Dependency installation
- Application files copy
- Health check endpoint
- Port exposure (3000)
- npm start command

**Build**: `docker build -t instagram-pipeline .`  
**Run**: `docker run -e TELEGRAM_BOT_TOKEN=... -p 3000:3000 instagram-pipeline`

### `.dockerignore` (12 lines)
Files to exclude from Docker build.

**Excludes**:
- node_modules (rebuild in container)
- .env files (use ARG)
- Git files
- Documentation
- IDE config

---

## Testing & Utility Files

### `example-test-payload.json` (12 lines)
Example API trigger payload for testing.

**Contains**:
- Valid JSON structure matching Routine input
- Real example URLs and IDs
- Sample caption text
- Timestamp in ISO-8601 format

**Usage**: 
```bash
./test-routine-api.sh example-test-payload.json
```

### `test-routine-api.sh` (35 lines)
Bash script to test Routine API trigger manually.

**Requires environment variables**:
- `ROUTINE_API_ENDPOINT`
- `ROUTINE_BEARER_TOKEN`

**Usage**:
```bash
chmod +x test-routine-api.sh
./test-routine-api.sh example-test-payload.json
```

**Output**: cURL request/response with full headers

---

## Documentation Files

### `README.md` (280 lines)
Project overview and quick reference.

**Covers**:
- What the pipeline does (high-level)
- Pipeline diagram
- Key features
- Architecture overview
- Quick start steps
- File structure
- Configuration reference
- API endpoints
- Output format
- Troubleshooting
- Costs and limitations
- Support links

**Audience**: New users, overview seekers

### `SETUP.md` (550 lines)
Complete step-by-step setup guide.

**Sections**:
1. Architecture overview
2. Prerequisites checklist
3. Step 1: Create Telegram Bot
4. Step 2: Get AssemblyAI API key
5. Step 3: Create Claude Code Routine (with 5 subsections)
6. Step 4: Deploy Webhook Server (3 options)
7. Step 5: Register Telegram Webhook
8. Step 6: Test Full Pipeline
9. Troubleshooting guide (6 issues)
10. Environment variables reference
11. Security best practices
12. Advanced configuration
13. Monitoring and alerts
14. Support resources
15. Maintenance schedule

**Audience**: Users doing initial setup

### `ARCHITECTURE.md` (600 lines)
Technical deep dive into system design.

**Sections**:
- System architecture diagram
- Component details (6 major parts)
- Data flow examples
- Telegram file download mechanics
- Claude Code Routine execution model
- AssemblyAI integration details
- Google Tasks integration
- Deployment architecture (4 options)
- Security considerations (6 areas)
- Performance characteristics
- Monitoring and observability
- Failure modes and recovery
- Extension points

**Audience**: Engineers, advanced users

### `QUICK_START.txt` (120 lines)
One-page quick reference.

**Contains**:
- Files overview
- 5-step quick setup
- Environment variables summary
- Testing instructions
- Data flow diagram
- Cost breakdown
- Key features checklist
- Common issues and fixes
- Support links

**Audience**: Experienced developers, quick reference

### `FILES.md` (this file, 200+ lines)
Complete file reference and guide.

**Contains**:
- Detailed description of each file
- Line counts and purposes
- Key functions and exports
- Environment variables used
- Dependencies listed
- Usage examples
- Input/output schemas

**Audience**: Developers, maintainers

---

## Configuration & Ignore Files

### `.gitignore` (18 lines)
Git ignore patterns.

**Ignores**:
- Environment variables (.env files)
- Dependencies (node_modules)
- IDE config (.vscode, .idea)
- Logs and build artifacts
- OS files (.DS_Store, Thumbs.db)

**Usage**: Automatically used by git

### `.dockerignore` (12 lines)
Docker build ignore patterns.

**Ignores**:
- node_modules (rebuild in container)
- .env files
- Documentation
- IDE config
- Git files

**Usage**: Automatically used by Docker

---

## Summary Table

| File | Type | Size | Purpose |
|------|------|------|---------|
| server.js | Code | 430 L | Main webhook server |
| package.json | Config | 31 L | Dependencies |
| .env.example | Config | 14 L | Environment template |
| routine-prompt.md | Prompt | 250 L | Routine instructions |
| railway.json | Config | 34 L | Railway deployment |
| render.yaml | Config | 16 L | Render deployment |
| Dockerfile | Config | 21 L | Docker image |
| .gitignore | Config | 18 L | Git ignore |
| .dockerignore | Config | 12 L | Docker ignore |
| example-test-payload.json | Data | 12 L | Test payload |
| test-routine-api.sh | Script | 35 L | Testing script |
| README.md | Doc | 280 L | Overview |
| SETUP.md | Doc | 550 L | Setup guide |
| ARCHITECTURE.md | Doc | 600 L | Technical docs |
| QUICK_START.txt | Doc | 120 L | Quick ref |
| FILES.md | Doc | 200+ L | This file |

**Total**: 16 files, ~2500 lines of code + docs

---

## Reading Order Recommendation

**For First-Time Setup**:
1. README.md - Get oriented
2. QUICK_START.txt - See overview
3. SETUP.md - Follow step-by-step

**For Developers**:
1. ARCHITECTURE.md - Understand design
2. server.js - Read webhook implementation
3. routine-prompt.md - Understand Routine behavior

**For Deployment**:
1. QUICK_START.txt - Quick overview
2. SETUP.md - Step 4 (Deploy Webhook Server)
3. railway.json or render.yaml - Deployment config
4. Dockerfile - If using custom deployment

**For Customization**:
1. routine-prompt.md - Edit Routine behavior
2. server.js - Modify webhook handling
3. ARCHITECTURE.md - Understand impact

**For Troubleshooting**:
1. SETUP.md - Section "Troubleshooting"
2. ARCHITECTURE.md - Section "Failure Modes & Recovery"
3. Server logs (Railway/Render dashboard)
4. Claude Code Routine logs (claude.ai/code/routines)

---

## How to Use These Files

### For Local Development
```bash
# Clone/download all files
git clone <repo>

# Copy environment template
cp .env.example .env

# Edit .env with your values
vim .env

# Install dependencies
npm install

# Start development server
npm run dev

# Test with curl or script
./test-routine-api.sh example-test-payload.json
```

### For Railway Deployment
```bash
# Push to GitHub (all files needed)
git push origin main

# In Railway dashboard:
# - New Project
# - Connect GitHub repo
# - Auto-detect Node.js
# - Add environment variables from .env.example
# - Deploy

# To test:
./test-routine-api.sh example-test-payload.json
```

### For Docker Deployment
```bash
# Build image (all files needed)
docker build -t instagram-pipeline .

# Run container
docker run -e TELEGRAM_BOT_TOKEN=... \
           -e ROUTINE_API_ENDPOINT=... \
           -e ROUTINE_BEARER_TOKEN=... \
           -p 3000:3000 \
           instagram-pipeline

# Or use docker-compose (not provided, can be added)
```

---

## Modifying Files

### To customize Routine behavior:
Edit `routine-prompt.md`
- Change JSON output fields
- Modify analysis approach
- Update error handling
- Add new connectors

### To add webhook features:
Edit `server.js`
- Add new endpoints
- Handle additional message types
- Implement request validation
- Add metrics/monitoring

### To change deployment:
Edit `railway.json`, `render.yaml`, or `Dockerfile`
- Change base image
- Add environment setup
- Configure ports
- Add health checks

### To update dependencies:
Edit `package.json`
- Add new npm packages
- Update versions
- Change scripts
- Configure build process

---

## File Sizes & Performance

| File | Size | Execution Time |
|------|------|-----------------|
| server.js | ~15 KB | N/A (always running) |
| All .json/.yaml files | ~3 KB | N/A (config only) |
| Routine prompt | ~8 KB | 1-3 min per execution |
| Total package | ~30 KB | Deployment in <30s |

**Note**: Runtime performance is dominated by:
- Video download time: 1-10 sec
- AssemblyAI transcription: 30 sec - 2 min
- Analysis: 10-20 sec
- Total: 1-3 minutes

---

**Files Created**: May 8, 2026  
**Total Files**: 16  
**Status**: Complete & Production Ready
