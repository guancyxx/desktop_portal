# Phase 5: Redis Queue & Background Processing - Quick Start

## 🚀 What's New

Phase 5 adds **true background job processing** with Redis queue:
- ✅ Non-blocking job submission (< 200ms response)
- ✅ Background worker processes jobs independently
- ✅ Webhook notifications on completion
- ✅ Job cancellation support
- ✅ Per-tenant concurrency limits (10 jobs max)

---

## 📦 Installation

Dependencies already installed via Phase 5 implementation:
- `bullmq@5.65.0` - Job queue library
- `ioredis@5.8.2` - Redis client

---

## 🎯 Quick Start

### 1. Start Redis + Worker

```powershell
# Redis is already running in docker-compose
docker-compose up -d redis

# Start the background worker (new terminal)
cd applications/desktop-portal
pnpm worker
```

**Expected Output**:
```
Starting Crawl Worker...
Environment: development
Redis Host: localhost
Redis Port: 6379
[RedisQueueClient] Initialized with Redis at localhost:6379
[CrawlWorker] Started with concurrency: 5
Crawl Worker is running. Press Ctrl+C to stop.
```

### 2. Start Desktop Portal

```powershell
# In another terminal
cd applications/desktop-portal
pnpm dev
```

### 3. Test Async Workflow

Navigate to: **http://localhost:3000/crawl/async**

1. **Submit Job**:
   - Enter URL: `https://example.com`
   - Enable "Async Mode" toggle
   - (Optional) Add webhook URL
   - Click "Submit"

2. **Watch Progress**:
   - Job status updates every 2 seconds
   - Progress bar shows 0-90% during processing
   - Status badges: PENDING → IN_PROGRESS → COMPLETED

3. **View Result**:
   - Markdown content displayed in tabs
   - Extracted data (if LLM enabled)
   - Execution time shown

---

## 🛠️ Worker Management

### Start Worker

```powershell
pnpm worker
```

### Stop Worker (Graceful)

```powershell
# Press Ctrl+C
# Worker will finish current jobs before exiting
```

### Monitor Worker Logs

Worker logs show:
- Job processing start/end
- Webhook delivery status
- Error messages

**Example**:
```
[CrawlWorker] Processing job abc-123 for URL: https://example.com
[CrawlWorker] Job abc-123 completed successfully
[WebhookSender] Webhook delivered successfully to https://webhook.site/..., status: 200
```

---

## 🧪 Testing Scenarios

### Test 1: Basic Async Job

1. Go to `/crawl/async`
2. Submit URL with async mode enabled
3. **Verify**: Immediate response (< 1 second)
4. **Verify**: Status updates automatically
5. **Verify**: Completion notification appears

### Test 2: Job Cancellation

1. Submit a job
2. While status is PENDING or IN_PROGRESS
3. Click "Cancel" button
4. **Verify**: Status changes to CANCELLED
5. **Verify**: Job removed from queue

### Test 3: Webhook Notification

1. Get webhook URL from https://webhook.site
2. Submit async job with webhook URL
3. Wait for completion
4. **Verify**: Webhook received at webhook.site

### Test 4: Concurrency Limit

1. Submit 10 jobs rapidly (write script or multiple tabs)
2. Try submitting 11th job
3. **Verify**: Error: "Concurrency limit reached"
4. Wait for one job to complete
5. **Verify**: 11th job now succeeds

---

## 📊 Queue Monitoring

### Check Queue Stats (Code)

```typescript
import { getQueueClient } from '@/infrastructure/queue/RedisQueueClient'

const stats = await getQueueClient().getStats()
console.log(stats)
// Output: { waiting: 2, active: 3, completed: 45, failed: 1 }
```

### Redis CLI Inspection

```powershell
# Connect to Redis
docker exec -it dreambuilder-redis redis-cli -a redis_password

# List queue jobs
KEYS bull:crawl-jobs:*

# Check waiting jobs count
LLEN bull:crawl-jobs:wait

# Check active jobs count
LLEN bull:crawl-jobs:active
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Required (already in docker-compose.yml)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Optional
CRAWL4AI_MAX_CONCURRENT_JOBS=10  # Per-tenant limit
```

### Worker Configuration

Edit `infrastructure/queue/CrawlWorker.ts`:

```typescript
const worker = new Worker(
  QUEUE_NAME,
  processCrawlJob,
  {
    connection: redisConnection,
    concurrency: 5, // Change this to process more jobs simultaneously
  }
)
```

---

## 🐛 Troubleshooting

### Worker Not Processing Jobs

**Symptoms**: Jobs stay in PENDING status

**Check**:
1. Is worker running? (`pnpm worker`)
2. Can worker connect to Redis?
   ```powershell
   docker logs dreambuilder-redis
   ```
3. Check worker logs for errors

### Redis Connection Errors

**Error**: `ECONNREFUSED localhost:6379`

**Solution**:
```powershell
# Start Redis
docker-compose up -d redis

# Verify Redis is running
docker ps | Select-String redis
```

### Webhook Not Delivered

**Check**:
1. Worker logs show webhook attempt?
2. Webhook URL reachable? (test with curl)
3. Timeout? (default 10 seconds)

**Note**: Webhook failure doesn't fail the job (logged as warning)

### Jobs Not Retrying

**Check BullMQ Configuration**:
```typescript
// In RedisQueueClient.ts
defaultJobOptions: {
  attempts: 3, // Retry 3 times
  backoff: {
    type: 'exponential',
    delay: 5000, // 5s, 10s, 20s
  },
}
```

---

## 📝 API Reference

### Submit Async Job

**Endpoint**: `POST /api/crawl/job`

**Request**:
```json
{
  "url": "https://example.com",
  "priority": 5,
  "webhookUrl": "https://your-server.com/webhook",
  "llmProvider": "ollama",
  "llmModel": "llama3.2:3b",
  "llmSchema": {...}
}
```

**Response** (202 Accepted):
```json
{
  "taskId": "uuid",
  "status": "queued",
  "message": "Crawl job queued successfully..."
}
```

### Get Job Status

**Endpoint**: `GET /api/crawl/job/{taskId}`

**Response** (COMPLETED):
```json
{
  "taskId": "uuid",
  "status": "COMPLETED",
  "result": {
    "id": "uuid",
    "url": "https://example.com",
    "markdownContent": "# Title\n...",
    "extractedData": {...},
    "executionTime": 3250
  },
  "createdAt": "2025-11-29T...",
  "updatedAt": "2025-11-29T...",
  "completedAt": "2025-11-29T..."
}
```

### Cancel Job

**Endpoint**: `DELETE /api/crawl/job/{taskId}/cancel`

**Response**:
```json
{
  "taskId": "uuid",
  "status": "CANCELLED",
  "message": "Crawl job cancelled successfully"
}
```

---

## 🎓 Key Concepts

### Job Lifecycle

```
User submits → PENDING (in Redis queue)
                  ↓
Worker picks up → IN_PROGRESS (processing)
                  ↓
              COMPLETED / FAILED / CANCELLED
```

### Webhook Payload

Sent on job completion (success or failure):
```json
{
  "taskId": "uuid",
  "status": "COMPLETED",
  "url": "https://example.com",
  "result": {
    "markdown": "...",
    "extractedData": {...}
  },
  "completedAt": "2025-11-29T..."
}
```

### Concurrency Limits

- **Per-Tenant**: Max 10 active jobs
- **Global Worker**: Max 5 concurrent processing
- **Checked**: Before job submission (returns 429 if exceeded)

---

## 📚 Next Steps

1. **Test All Scenarios**: Follow testing section above
2. **Production Deployment**: See PHASE_5_FINAL_COMPLETE.md for Docker setup
3. **Monitoring**: Set up queue statistics dashboard
4. **Phase 6**: Implement configuration management (optional)
5. **Phase 7**: Testing & production polish

---

## 🔗 Related Files

**Queue Infrastructure**:
- `infrastructure/queue/RedisQueueClient.ts` - Queue manager
- `infrastructure/queue/CrawlWorker.ts` - Background worker
- `infrastructure/queue/WebhookSender.ts` - Webhook delivery

**API Routes**:
- `app/api/crawl/job/route.ts` - Submit async job
- `app/api/crawl/job/[id]/route.ts` - Get status
- `app/api/crawl/job/[id]/cancel/route.ts` - Cancel job

**UI Components**:
- `components/crawl/CrawlJobStatus.tsx` - Status display + cancel button
- `app/(portal)/crawl/async/page.tsx` - Demo page
- `hooks/useCrawlPolling.ts` - Polling hook

---

**For detailed documentation, see**: [PHASE_5_FINAL_COMPLETE.md](./PHASE_5_FINAL_COMPLETE.md)
