# Crawl4AI Feature - User Guide

## Overview

The Crawl4AI feature provides intelligent web crawling capabilities with LLM-powered content extraction. It enables users to:

- **Extract structured content** from web pages using AI models
- **Configure crawling behavior** with custom browser and crawler settings
- **Process requests synchronously or asynchronously** depending on workload
- **Cache results** to optimize performance and reduce costs
- **Manage multiple configurations** for different crawling scenarios

## Key Features

### 1. Dual Execution Modes

**Synchronous Crawl** (Immediate Results)
- Best for: Quick single-page extractions, interactive workflows
- Returns: Markdown content immediately in response
- Use when: You need instant results for UI display

**Asynchronous Crawl** (Background Processing)
- Best for: Batch processing, deep crawls, heavy LLM extraction
- Returns: Task ID for status polling
- Use when: Processing multiple URLs or expect long execution times

### 2. LLM-Powered Extraction

Extract structured data using Large Language Models:
- **Supported providers**: Ollama (local), OpenAI, Anthropic
- **Schema-based extraction**: Define JSON schemas for consistent output
- **Custom instructions**: Natural language instructions for extraction logic
- **Flexible models**: llama3.2, gpt-4, claude-3, etc.

### 3. Configuration Management

Create reusable crawl configurations with:
- **Browser settings**: Viewport size, user agent, headless mode
- **Crawler behavior**: Max depth, wait conditions, timeout
- **URL patterns**: Include/exclude rules for selective crawling
- **Default configuration**: Auto-apply to new tasks

### 4. Performance Optimization

- **Intelligent caching**: Avoid re-crawling unchanged content
- **Rate limiting**: 100 requests/hour per organization
- **Concurrency control**: Max 10 active jobs per organization
- **Content size limits**: 10MB maximum to prevent memory issues

## Getting Started

### Prerequisites

1. **Environment Setup**:
   ```bash
   # Ensure Crawl4AI service is running
   docker-compose up -d crawl4ai
   
   # Verify service health
   curl http://localhost:11235/health
   ```

2. **Ollama Setup** (for local LLM extraction):
   ```bash
   # Start Ollama
   docker-compose up -d ollama
   
   # Pull models
   docker exec -it ollama ollama pull llama3.2
   ```

3. **Access Portal**:
   - Navigate to your DreamBuilder desktop portal
   - Ensure you're logged in with valid organization context

## Usage Guide

### A. Quick Start: Sync Crawl

**Step 1: Navigate to Crawl Page**
- Open sidebar → Select "Crawl" app
- You'll see the crawl request form

**Step 2: Enter URL**
- Input: `https://example.com/blog/post`
- The URL must be publicly accessible (SSRF protections apply)

**Step 3: Optional - Configure LLM Extraction**
- Toggle "Use LLM Extraction"
- Select provider: Ollama
- Choose model: llama3.2
- Add instruction: "Extract the article title, author, and summary"
- (Optional) Define JSON schema for structured output

**Step 4: Submit**
- Click "Crawl Now"
- Wait for immediate response (typically 2-10 seconds)
- View markdown content in result panel

### B. Batch Processing: Async Crawl

**Step 1: Switch to Async Mode**
- Navigate to Crawl page
- Select "Background Job" tab

**Step 2: Configure Job**
- URL: Target webpage
- Priority: 1-10 (higher = more urgent)
- Configuration: Select saved config or use default
- Webhook URL: (Optional) Receive completion notification

**Step 3: Monitor Progress**
- Submit job → Receive task ID
- Navigate to "Crawl History" tab
- Filter by status: Pending → In Progress → Completed
- Refresh to see updates

**Step 4: View Results**
- Click on completed task
- Review markdown content
- Download extracted data (JSON format)

### C. Configuration Management

**Creating a Configuration**

1. **Navigate to Settings**:
   - Sidebar → Settings → Crawl Configuration

2. **Click "Create Configuration"**:
   - **Name**: "Product Pages" (descriptive, unique per org)
   - **Description**: "Extract product details from e-commerce sites"

3. **Browser Settings**:
   - Viewport: 1920x1080 (desktop view)
   - User Agent: (Leave default or customize)
   - Headless: Enabled (for background jobs)

4. **Crawler Settings**:
   - Max Depth: 3 (follow links up to 3 levels)
   - Wait Until: networkidle (wait for all resources)
   - Timeout: 30 seconds
   - Include Patterns: `/products/.*` (newline-separated)
   - Exclude Patterns: `/cart`, `/checkout`

5. **LLM Settings** (Optional):
   - Provider: Ollama
   - Model: llama3.2
   - Instruction: "Extract product name, price, description, reviews"
   - Schema:
     ```json
     {
       "type": "object",
       "properties": {
         "product_name": {"type": "string"},
         "price": {"type": "number"},
         "description": {"type": "string"},
         "review_count": {"type": "integer"}
       }
     }
     ```

6. **Set as Default** (Optional):
   - Toggle "Set as default configuration"
   - This config will auto-apply to new tasks

7. **Save**:
   - Click "Create"
   - Configuration now available in dropdown

**Editing a Configuration**

1. Navigate to Settings → Crawl Configuration
2. Find your config in the list
3. Click pencil icon (Edit)
4. Modify fields as needed
5. Click "Update" to save changes

**Deleting a Configuration**

1. Navigate to Settings → Crawl Configuration
2. Click trash icon next to config
3. Confirm deletion
4. Note: Cannot delete if it's the only config in your organization

### D. Viewing Crawl History

**Accessing History**

1. Navigate to Crawl page
2. Click "History" tab
3. View table of all your organization's crawl tasks

**Filtering Results**

- **By Status**: All / Pending / In Progress / Completed / Failed
- **By Date**: Use date range picker (coming soon)
- **By URL**: Search bar filtering (coming soon)

**Understanding Status Codes**

| Status | Meaning |
|--------|---------|
| PENDING | Job queued, waiting for worker |
| IN_PROGRESS | Currently being processed |
| COMPLETED | Successfully finished |
| FAILED | Encountered error (see error message) |
| CANCELLED | Manually cancelled by user |

**Viewing Task Details**

1. Click on any row in history table
2. View modal with:
   - Full markdown content
   - Extracted data (JSON)
   - Execution time
   - Cache status (HIT/MISS)
   - Error message (if failed)
3. Download results as JSON file

## Advanced Features

### 1. Cache Management

**How Caching Works**:
- Cache key generated from: URL + crawl config hash
- TTL: 24 hours (configurable)
- Automatically invalidates on content change

**Viewing Cache Status**:
- Check "From Cache" column in history
- Green checkmark = Cache HIT (fast)
- Empty = Cache MISS (full crawl)

**Cache Benefits**:
- Reduced latency (10x faster for cached content)
- Lower costs (no LLM API calls)
- Decreased load on target websites

### 2. Webhook Notifications

**Setting Up Webhooks**:

1. When submitting async job, provide webhook URL:
   ```
   https://your-api.com/webhooks/crawl-complete
   ```

2. On completion, receive POST request:
   ```json
   {
     "task_id": "550e8400-e29b-41d4-a716-446655440000",
     "status": "COMPLETED",
     "url": "https://example.com/page",
     "markdown": "# Extracted content...",
     "extracted_data": { "title": "Example" },
     "execution_time_ms": 3245,
     "completed_at": "2024-01-15T10:30:00Z"
   }
   ```

3. Your webhook endpoint should:
   - Accept POST requests
   - Return 200 OK within 5 seconds
   - Handle retries (3 attempts on failure)

### 3. Rate Limiting

**Limits**:
- **100 requests/hour** per organization
- Applies to both sync and async endpoints
- Shared quota across all users in org

**Handling Rate Limits**:

When limit exceeded, API returns:
```json
{
  "error": "Rate limit exceeded. Maximum 100 requests per hour per organization.",
  "retry_after": 3600
}
```

**Response Headers**:
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: 0
- `Retry-After`: 3600 (seconds)

**Best Practices**:
- Use async mode for batch operations
- Implement exponential backoff in automation
- Monitor usage via dashboard (coming soon)

### 4. Security Features

**SSRF Protection**:
- Blocks internal/private IP ranges (10.x, 192.168.x, 127.x)
- Prevents cloud metadata access (169.254.169.254)
- HTTP/HTTPS only (no file://, ftp://, etc.)
- URL length limit: 2048 characters

**Content Size Limits**:
- Maximum response size: 10MB
- Prevents memory exhaustion attacks
- Applies to both HTTP response and markdown output

**Tenant Isolation**:
- All data scoped by `organizationId`
- No cross-tenant access possible
- Verified via security audit (T092)

## Troubleshooting

### Common Issues

**1. "Rate limit exceeded" Error**

**Problem**: Too many requests in short time period.

**Solution**:
- Wait for `Retry-After` duration (check response header)
- Switch to async mode for bulk operations
- Contact admin to review rate limit policy

**2. "SSRF validation failed" Error**

**Problem**: URL points to internal/private IP address.

**Solution**:
- Verify URL is publicly accessible
- Check for localhost, 127.0.0.1, or private IPs
- Ensure URL uses http:// or https:// protocol

**3. "Content size exceeds maximum" Error**

**Problem**: Target page response > 10MB.

**Solution**:
- Target specific sub-pages instead of large listings
- Use include/exclude patterns to filter content
- Contact admin if legitimate use case requires larger limit

**4. Job Stuck in "Pending" Status**

**Problem**: Background worker not processing queue.

**Solution**:
- Check worker service status: `docker-compose ps worker`
- View worker logs: `docker-compose logs -f worker`
- Verify Redis connection: `docker-compose ps redis`
- Contact admin if issue persists

**5. LLM Extraction Returns Empty Data**

**Problem**: Model unable to extract structured data.

**Solution**:
- Verify Ollama service running: `curl http://localhost:11434/api/tags`
- Check model is pulled: `docker exec ollama ollama list`
- Review extraction instruction for clarity
- Validate JSON schema syntax
- Try different model (e.g., llama3.2 → gpt-4)

**6. "Unauthorized" Error**

**Problem**: Session expired or invalid organization context.

**Solution**:
- Refresh page to renew session
- Verify organization selected in sidebar
- Log out and log back in
- Check Keycloak service status

## API Reference

### Endpoints

**1. Sync Crawl**
```
POST /api/crawl
```

**Request**:
```json
{
  "url": "https://example.com",
  "configId": "uuid-optional",
  "llmProvider": "ollama",
  "llmModel": "llama3.2",
  "llmInstruction": "Extract title and summary",
  "llmSchema": { "type": "object", "properties": {...} }
}
```

**Response** (200 OK):
```json
{
  "id": "task-uuid",
  "url": "https://example.com",
  "status": "COMPLETED",
  "markdownContent": "# Title\n\nContent...",
  "extractedData": { "title": "...", "summary": "..." },
  "executionTimeMs": 3245,
  "fromCache": false
}
```

**2. Async Crawl**
```
POST /api/crawl/job
```

**Request**:
```json
{
  "url": "https://example.com",
  "configId": "uuid-optional",
  "priority": 5,
  "webhookUrl": "https://your-api.com/webhook"
}
```

**Response** (202 Accepted):
```json
{
  "task_id": "job-uuid",
  "status": "queued"
}
```

**3. Job Status**
```
GET /api/crawl/job/:taskId
```

**Response** (200 OK):
```json
{
  "task_id": "job-uuid",
  "status": "COMPLETED",
  "result": {
    "url": "https://example.com",
    "markdown": "# Content...",
    "extracted_data": {...}
  },
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:05:23Z"
}
```

**4. Crawl History**
```
GET /api/crawl/history?status=COMPLETED&limit=20&offset=0
```

**Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": "uuid",
      "url": "https://example.com",
      "status": "COMPLETED",
      "createdAt": "2024-01-15T10:00:00Z",
      "executionTimeMs": 3245,
      "fromCache": true
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

**5. Configuration Management**
```
GET /api/crawl/config          # List all configs
POST /api/crawl/config         # Create config
PUT /api/crawl/config/:id      # Update config
DELETE /api/crawl/config/:id   # Delete config
```

## Best Practices

### Performance

1. **Use Caching**:
   - Crawl same URLs multiple times benefits from cache
   - Reduces response time from 10s to <1s

2. **Choose Appropriate Mode**:
   - Sync: Single pages, <5 second response time
   - Async: Batch jobs, LLM extraction, deep crawls

3. **Optimize Configurations**:
   - Reduce max_depth for faster crawls
   - Use specific include/exclude patterns
   - Set appropriate timeouts (default 30s)

### Cost Optimization

1. **Leverage Cache**:
   - Cache hit = no LLM API cost
   - Cache TTL = 24 hours

2. **Use Local LLM When Possible**:
   - Ollama (free) vs OpenAI (paid per token)
   - Llama3.2 sufficient for most extraction tasks

3. **Rate Limiting Awareness**:
   - Monitor quota usage
   - Batch operations during off-peak hours

### Security

1. **Validate Webhook URLs**:
   - Only use HTTPS endpoints
   - Verify webhook signature (coming soon)

2. **Sensitive Data**:
   - Do not crawl pages requiring authentication
   - Avoid extracting PII without consent

3. **Resource Limits**:
   - Respect target website's robots.txt
   - Avoid aggressive crawling (use default delays)

## FAQ

**Q: Can I crawl password-protected pages?**

A: Not currently. The crawler cannot handle authentication flows. You can use browser configs to set cookies, but this is not recommended for sensitive sites.

**Q: What's the difference between include and exclude patterns?**

A: Include patterns define which URLs to crawl (whitelist), exclude patterns define which to skip (blacklist). Both use regex patterns. If no include patterns specified, all URLs within max_depth are crawled (except excluded ones).

**Q: Why is my LLM extraction empty?**

A: Common causes:
- Model not loaded (check Ollama)
- Instruction unclear or impossible
- Schema too strict (model can't match structure)
- Content doesn't contain requested data

**Q: Can I increase rate limits?**

A: Contact your system administrator. Rate limits are configurable at the infrastructure level.

**Q: How do I monitor crawl costs?**

A: Dashboard with usage metrics coming in future release. Currently, check Ollama logs or cloud provider billing for external LLM usage.

**Q: Are there file size limits for uploads?**

A: This feature doesn't support file uploads. It only crawls public web URLs.

## Support

For technical issues:
1. Check troubleshooting section above
2. Review Docker logs: `docker-compose logs -f crawl4ai worker`
3. Contact development team via internal Slack channel
4. File bug reports in project repository

For feature requests:
- Submit enhancement proposals via project issue tracker
- Discuss in team planning meetings
