# Architecture & Technical Design

Comprehensive technical documentation for the Instagram-to-Google-Tasks pipeline.

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      User/Content Source                         │
│              (Instagram video or direct Telegram)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Telegram Bot (@BotName)                     │
│                  (Receives and stores video)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  Telegram Bot API                       │
        │  (/setWebhook for push notifications)   │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │    WEBHOOK SERVER (Node.js/Express)     │
        │                                         │
        │  • Listens on POST /webhook             │
        │  • Extracts video file_id & caption     │
        │  • Calls Telegram getFile API           │
        │  • Returns Telegram file URL            │
        │  • POSTs payload to Routine API         │
        │  • Returns 200 immediately              │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  Claude Code Routine API Endpoint       │
        │  (Bearer token authenticated)           │
        └─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CLAUDE CODE ROUTINE (Cloud Session)                │
│                                                                 │
│  1. Receive API trigger payload                                │
│  2. Download video from URL                                    │
│  3. Call AssemblyAI API for transcription                      │
│  4. Analyze transcript (Claude)                                │
│  5. Format structured JSON output                              │
│  6. Create Google Task via connector                           │
│  7. Log results                                                │
└─────────────────────────────────────────────────────────────────┘
       ↓                           ↓                        ↓
  ┌─────────┐          ┌──────────────────┐      ┌──────────────┐
  │ Routine │          │   AssemblyAI     │      │ Google Tasks │
  │  Logs   │          │   (Transcript)   │      │  (Connector) │
  └─────────┘          └──────────────────┘      └──────────────┘
```

## Component Details

### 1. Telegram Bot

**Purpose**: Receive video messages from users

**Configuration**:
- Created via @BotFather
- Webhook registered via `setWebhook` API call
- Points to deployed webhook server URL

**Data Received**:
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 42,
    "date": 1715000000,
    "chat": {
      "id": 987654321,
      "type": "private"
    },
    "video": {
      "file_id": "AgADBAADjqcxGylzBqoFrBZk...",
      "file_unique_id": "AQADjqcxGylzBq",
      "width": 1920,
      "height": 1080,
      "duration": 120,
      "mime_type": "video/mp4",
      "file_size": 15728640
    },
    "caption": "Optional caption text"
  }
}
```

### 2. Webhook Server (Node.js/Express)

**Purpose**: Receive Telegram updates and orchestrate processing

**Architecture**:
```
Express Server
├── Middleware
│   ├── express.json() - Parse JSON bodies
│   └── Error handler - Return 200 to Telegram always
├── Routes
│   ├── GET /health - Health check endpoint
│   └── POST /webhook - Telegram webhook endpoint
└── Functions
    ├── processMessage() - Extract and validate message
    ├── getTelegramFile() - Get file metadata
    ├── downloadTelegramFile() - Get CDN URL
    └── triggerClaudeRoutine() - Call Routine API
```

**Request/Response Timing**:
- Accepts request from Telegram
- Returns 200 OK immediately (Telegram expects <60s response)
- Processes message asynchronously in background
- Telegram can send duplicate updates; server is idempotent via `trigger_id`

**Error Handling**:
- Always returns 200 to Telegram (to avoid message redelivery)
- Logs errors for monitoring/debugging
- Handles missing/invalid video gracefully

**Environment Variables Used**:
- `TELEGRAM_BOT_TOKEN` - For authenticating Telegram API calls
- `ROUTINE_API_ENDPOINT` - Routine API trigger URL
- `ROUTINE_BEARER_TOKEN` - Routine API authentication
- `PORT` - Server listen port (default 3000)

### 3. Telegram File Download Flow

The webhook server doesn't store videos. Instead:

1. **getFile API** returns metadata:
   ```json
   {
     "file_id": "AgADBAADjqcxGylzBq...",
     "file_unique_id": "AQADjqcxGylzBq",
     "file_size": 15728640,
     "file_path": "videos/file_12345.mp4"
   }
   ```

2. **CDN URL Construction**:
   ```
   https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}
   ```

3. **URL Characteristics**:
   - Public, doesn't require authentication
   - Valid for ~12 hours
   - Directly downloadable by any client
   - Passed to Claude Code Routine for processing

### 4. Claude Code Routine

**Purpose**: Cloud-based autonomous analysis engine

**Execution Model**:
- Runs as a full Claude Code session (cloud-only, no desktop needed)
- Triggered via HTTP API endpoint with bearer token
- Wired with connectors (Google Tasks, AssemblyAI key)
- System prompt defined in `routine-prompt.md`

**System Prompt Components**:
1. **Input Specification** - What payload structure to expect
2. **Process Steps** - Exact sequence of operations
3. **API Integration** - AssemblyAI transcription details
4. **Output Schema** - JSON structure for results
5. **Error Handling** - How to handle failures
6. **Connectors** - Google Tasks integration details

**Input Payload**:
```json
{
  "video_url": "https://api.telegram.org/file/bot.../video.mp4",
  "caption": "Optional user text",
  "message_id": 42,
  "timestamp": "2026-05-08T15:30:00Z",
  "chat_id": 987654321,
  "file_id": "AgADBAAD...",
  "trigger_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Processing Steps**:

1. **Video Fetching**
   - Downloads from `video_url`
   - Validates content type
   - Handles network failures

2. **AssemblyAI Transcription**
   ```
   POST https://api.assemblyai.com/v2/transcripts
   Headers: Authorization: Bearer {ASSEMBLYAI_API_KEY}
   Body: { "audio_url": "https://..." }
   
   Response: { "id": "transcript-id", "status": "submitted" }
   
   Poll with: GET .../transcripts/{id}
   Until: status = "completed"
   
   Get: result.text (full transcript)
   ```

3. **Analysis**
   - Claude reads transcript
   - Extracts structured information
   - Validates against schema
   - Generates insights

4. **JSON Output**
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
       "duration_seconds": number,
       "original_caption": "string",
       "processed_at": "ISO-8601",
       "confidence": "high|medium|low"
     }
   }
   ```

5. **Google Tasks Creation**
   ```
   Create new task via Google Tasks connector:
   - Title: JSON .title field
   - Notes: Full JSON as formatted text
   - List: Default or configured list
   ```

**Error States**:
- Network failure: Create task with error summary
- Transcription failure: Task with "Transcription Failed" title
- Analysis failure: Partial results in task
- Google Tasks failure: Log error, could retry

### 5. AssemblyAI Integration

**API Details**:
- **Endpoint**: `https://api.assemblyai.com/v2/transcripts`
- **Auth**: Bearer token in Authorization header
- **Model**: Automatic speech recognition (ASR)

**Request**:
```json
{
  "audio_url": "https://api.telegram.org/file/bot.../video.mp4"
}
```

**Response** (submitted state):
```json
{
  "id": "640c8a86-5581-44eb-9d74-f0a48bbb0e39",
  "language_code": "en",
  "acoustic_model": "default",
  "language_model": null,
  "status": "submitted",
  "audio_url": "https://..."
}
```

**Polling**: Check status every 5-10 seconds

**Response** (completed):
```json
{
  "id": "640c8a86-5581-44eb-9d74-f0a48bbb0e39",
  "status": "completed",
  "text": "Full transcript text here...",
  "audio_duration": 120,
  "confidence": 0.95
}
```

**Costs**:
- Free tier: 600 minutes/month
- Overage: ~$0.17/minute
- No setup fees

### 6. Google Tasks Integration

**Method**: Claude Code Routine native connector (OAuth)

**Authentication**:
- First use: Routine requests Google account access
- User grants permission (one-time)
- Token stored securely by Claude Code

**API Operations**:
```
POST https://www.googleapis.com/tasks/v1/lists/{taskListId}/tasks
{
  "title": "Key Technologies in AI Research",
  "notes": "[Full JSON output as text]",
  "due": "ISO-8601 date (optional)"
}
```

**Task Structure**:
- **Title**: 5-10 word summary (searchable)
- **Notes**: Full JSON + transcript (readable in Google Tasks UI)
- **Completed**: false (user marks done manually)
- **List**: Default list or configured

**Advantages**:
- Native Google integration
- Full-text search
- Mobile app support
- Reminders and due dates
- Sharing capabilities

## Data Flow Example

### Request Sequence

```
Time: 15:30:00 UTC

1. User sends video to Telegram bot
   → Video stored in Telegram servers
   → Telegram notifies webhook

2. Webhook receives update (< 1 second)
   GET /webhook {message object}
   ← 200 OK

3. Background processing starts:
   a. Extract: file_id, caption, message_id
   b. Call: getTelegramFile(file_id)
      → /bot{TOKEN}/getFile
      ← { file_path: "videos/file_12345.mp4" }
   c. Build: CDN URL with bot token
   d. Call: triggerClaudeRoutine(payload)
      → POST {ROUTINE_ENDPOINT}
      ← { status: "triggered", session_id: "..." }

4. Claude Code Routine starts:
   Time: 15:30:05 UTC
   a. Receive trigger payload
   b. Download video from CDN URL
   c. POST to AssemblyAI
   d. Poll AssemblyAI (every 10 sec)
      Time: 15:31:30 UTC - Transcription complete
   e. Analyze transcript
   f. Format JSON output
   g. Call Google Tasks API
      Time: 15:31:45 UTC - Task created
   h. Log completion

5. User checks Google Tasks
   Time: 15:32:00 UTC
   → New task visible with analysis
```

### Data Size Examples

**Video File**: 10-50 MB (Telegram limit: 50 MB)

**Transcript**: ~100-200 words per minute of video
- 5 min video → ~500-1000 words → ~3-5 KB text

**JSON Output**: ~2-3 KB (summary + metadata)

**Google Task**: Text stored in Google's database

## Deployment Architecture

### Webhook Server Deployment

**Option 1: Railway**
```
GitHub Repo
    ↓
Railway Platform
    ├── Automatic detection of Node.js
    ├── Builds: npm install
    ├── Runs: npm start
    └── Exposes: https://service.railway.app
```

**Option 2: Render**
```
GitHub Repo
    ↓
Render Service
    ├── Web Service configuration
    ├── Builds: npm install
    ├── Runs: npm start
    └── Exposes: https://service.onrender.com
```

**Option 3: Docker**
```
Dockerfile
    ↓
Docker Image
    ├── Base: node:18-alpine
    ├── Install: dependencies
    ├── Copy: server.js, .env
    └── Run: npm start
    
→ Deploy to:
  - Docker Hub
  - AWS ECS
  - Google Cloud Run
  - Any container registry
```

**Option 4: Local + Tunnel**
```
node server.js (localhost:3000)
    ↓
ngrok http 3000
    ↓
Tunnel to: https://abc123.ngrok.io/webhook
```

## Security Considerations

### Authentication

1. **Telegram Webhook**
   - HTTPS only (Telegram rejects HTTP)
   - Hostname validation
   - No shared secret (relies on URL obscurity)

2. **Routine API**
   - Bearer token in Authorization header
   - Token should be treated as secret
   - One token per Routine

3. **AssemblyAI**
   - API key as bearer token
   - Store in environment variables
   - Key never in logs

### Data Protection

1. **Video Data**
   - Not stored by webhook server
   - Passed via URL to Routine
   - Deleted by AssemblyAI after processing (configurable)
   - Transcript stored in Google Tasks

2. **Environment Variables**
   - Never committed to git (.gitignore)
   - Stored in platform vault (Railway/Render)
   - Not logged to console

3. **Logs**
   - Include message structure but not sensitive tokens
   - Stored in deployment platform
   - Regularly rotated

### Network

1. **HTTPS Only**
   - All external API calls use HTTPS
   - Telegram requires HTTPS webhooks
   - TLS 1.2+ enforced

2. **Rate Limiting**
   - Telegram: ~30 messages/sec per chat
   - AssemblyAI: Depends on plan
   - Google Tasks: Standard API quotas
   - Webhook server: No limit (stateless)

3. **IP Restrictions** (Optional)
   - Telegram uses specific IP ranges
   - Can whitelist Telegram IPs in firewall
   - AWS: tg.org IP list

## Performance Characteristics

### Latency

| Component | Typical Time | Max Time |
|-----------|--------------|----------|
| Message receipt to webhook | < 1 sec | 5 sec |
| Webhook processing | < 100 ms | 1 sec |
| Routine startup | 2-3 sec | 10 sec |
| Video download | 1-10 sec | 30 sec |
| Transcription | 30 sec - 2 min | 5 min |
| Analysis + output | 10-20 sec | 1 min |
| Google Tasks creation | < 1 sec | 5 sec |
| **Total time to completion** | **1-3 min** | **10 min** |

### Throughput

- **Webhook server**: Can handle 100+ concurrent requests
- **Single Routine**: Serialized (one execution at a time)
- **Multiple Routines**: Run in parallel (create separate Routine for each)
- **AssemblyAI**: Processes multiple videos in parallel
- **Google Tasks**: No practical limit

### Resource Usage

| Resource | Webhook Server | Routine | Notes |
|----------|---|---|---|
| Memory | 50 MB | 500 MB - 1 GB | Depends on video size |
| CPU | Low | Medium | Transcription is CPU-intensive |
| Network | Low | High | Video download bandwidth |
| Cost | < $1/mo | Included | Routine uses Claude credits |

## Monitoring & Observability

### Logs

**Webhook Server Logs**:
```
[2026-05-08 15:30:00] Webhook server listening on port 3000
[2026-05-08 15:30:05] Processing video from chat 987654321, message 42
[2026-05-08 15:30:05] Downloaded video: https://api.telegram.org/file/...
[2026-05-08 15:30:06] Triggering Routine with payload: {...}
[2026-05-08 15:30:07] Successfully triggered Claude Code Routine
```

**Routine Logs** (in Claude dashboard):
```
[Step 1] Received trigger payload: {video_url: ..., caption: ...}
[Step 2] Downloaded video (15 MB)
[Step 3] Called AssemblyAI transcription
[Step 4] Polling transcription status...
[Step 5] Transcription complete: 620 words
[Step 6] Analyzing transcript
[Step 7] Generated JSON output
[Step 8] Creating Google Task
[Step 9] Task created: tasks/google.com/tasks/123456
```

### Health Checks

**Webhook Server**:
```bash
curl https://service.railway.app/health
```

Returns:
```json
{ "status": "ok", "timestamp": "2026-05-08T15:30:00Z" }
```

**Routine Status**:
- Check claude.ai/code/routines dashboard
- View session logs
- See recent triggers and results

## Failure Modes & Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| Webhook server down | Messages not processed | Restart server, Telegram queues messages |
| Routine API endpoint invalid | All messages fail | Update .env and redeploy |
| AssemblyAI API quota exceeded | Transcription fails | Wait for quota reset or upgrade |
| Video URL expires | Cannot download | Unlikely (12 hour window is long) |
| Google Tasks connector not authenticated | Tasks not created | Re-authenticate in Routine settings |
| Network timeout | Request may retry | Server is idempotent via trigger_id |

## Extension Points

### Adding More Analysis
- Edit `routine-prompt.md` to add new fields
- Claude will extract additional insights
- Update JSON schema in prompt

### Connecting Other Outputs
- Google Sheets: Add connector, write results to spreadsheet
- Slack: Post analysis to channel
- Email: Send digest of analyses
- Airtable: Store results in base

### Custom Webhook Handlers
- Parse different message types
- Support image analysis
- Handle slash commands
- Implement user authentication

### Performance Optimization
- Cache AssemblyAI results
- Implement webhook request queue
- Batch process multiple videos
- Stream video upload instead of URL

---

**Architecture Version**: 1.0.0  
**Last Updated**: May 8, 2026
