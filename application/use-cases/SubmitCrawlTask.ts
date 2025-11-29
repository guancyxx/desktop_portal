/**
 * SubmitCrawlTask Use Case - Application Layer
 * 
 * Orchestrates the submission of a new crawl task.
 * Handles validation, cache lookup, Crawl4AI invocation, and persistence.
 */

import { CrawlTask, CrawlStatus } from '@/domain/models/CrawlTask'
import { ICrawlTaskRepository } from '@/domain/repositories/ICrawlTaskRepository'
import { ICrawlConfigRepository } from '@/domain/repositories/ICrawlConfigRepository'
import { Crawl4AIClient } from '@/infrastructure/clients/Crawl4AIClient'
import { validateUrl, generateCacheKey, sanitizeMarkdown } from '@/lib/crawl-utils'
import { PrismaClient } from '@prisma/client'

export interface SubmitCrawlTaskRequest {
  url: string
  organizationId: string
  userId: string
  configId?: string
  priority?: number
  llmProvider?: string
  llmModel?: string
  llmSchema?: Record<string, any>
  llmInstruction?: string
}

export interface SubmitCrawlTaskResponse {
  success: boolean
  task: {
    id: string
    url: string
    status: CrawlStatus
    markdownContent?: string
    extractedData?: Record<string, any>
    executionTimeMs?: number
    fromCache?: boolean
  }
  error?: string
}

/**
 * SubmitCrawlTask Use Case
 * 
 * Orchestrates the end-to-end process of submitting a web crawl task.
 * 
 * Workflow:
 * 1. Validates URL format and checks for SSRF vulnerabilities
 * 2. Prevents duplicate active crawls for the same URL
 * 3. Checks cache for existing results (24-hour TTL by default)
 * 4. Applies crawl configuration (default or specified)
 * 5. Executes synchronous crawl via Crawl4AI service
 * 6. Persists task result and updates cache
 * 
 * @class SubmitCrawlTask
 */
export class SubmitCrawlTask {
  /**
   * Creates an instance of SubmitCrawlTask use case
   * 
   * @param taskRepository - Repository for CrawlTask persistence
   * @param configRepository - Repository for CrawlConfig retrieval
   * @param crawl4aiClient - HTTP client for Crawl4AI service integration
   * @param prisma - Prisma client for direct cache table access
   */
  constructor(
    private taskRepository: ICrawlTaskRepository,
    private configRepository: ICrawlConfigRepository,
    private crawl4aiClient: Crawl4AIClient,
    private prisma: PrismaClient
  ) {}

  /**
   * Execute the crawl task submission workflow
   * 
   * @param request - Crawl task configuration and context
   * @param request.url - Target URL to crawl (must be valid HTTP/HTTPS, no SSRF targets)
   * @param request.organizationId - Tenant identifier for multi-tenant isolation
   * @param request.userId - User who initiated the crawl
   * @param request.configId - Optional: Specific crawl configuration ID (uses default if omitted)
   * @param request.priority - Optional: Task priority 1-10 (default: 5, higher = more urgent)
   * @param request.llmProvider - Optional: LLM provider for extraction (e.g., 'ollama')
   * @param request.llmModel - Optional: LLM model name (e.g., 'qwen3-coder:30b')
   * @param request.llmSchema - Optional: JSON schema for structured extraction
   * @param request.llmInstruction - Optional: Custom extraction instructions for LLM
   * 
   * @returns Promise resolving to task result with markdown content and status
   * @returns {success: true, task: {...}} - If crawl completes successfully (or served from cache)
   * @returns {success: false, error: string} - If validation fails or crawl errors occur
   * 
   * @throws Never throws - all errors are caught and returned in response object
   * 
   * @example
   * ```typescript
   * const result = await submitCrawlTask.execute({
   *   url: 'https://example.com',
   *   organizationId: 'org-123',
   *   userId: 'user-456',
   *   llmProvider: 'ollama',
   *   llmModel: 'qwen3-coder:30b'
   * });
   * 
   * if (result.success) {
   *   console.log('Markdown:', result.task.markdownContent);
   *   console.log('From cache:', result.task.fromCache);
   * } else {
   *   console.error('Error:', result.error);
   * }
   * ```
   */
  async execute(request: SubmitCrawlTaskRequest): Promise<SubmitCrawlTaskResponse> {
    const startTime = Date.now()

    try {
      // 1. Validate URL
      const validation = validateUrl(request.url)
      if (!validation.valid) {
        return {
          success: false,
          task: {
            id: '',
            url: request.url,
            status: CrawlStatus.FAILED,
          },
          error: validation.error,
        }
      }

      // 2. Check for active crawl of same URL (prevent duplicates)
      const hasActiveCrawl = await this.taskRepository.hasActiveCrawlForUrl(
        request.url,
        request.organizationId
      )

      if (hasActiveCrawl) {
        return {
          success: false,
          task: {
            id: '',
            url: request.url,
            status: CrawlStatus.FAILED,
          },
          error: 'An active crawl for this URL already exists in your organization',
        }
      }

      // 3. Generate cache key
      const cacheKey = generateCacheKey(request.url)

      // 4. Check cache first
      const cachedResult = await this.checkCache(cacheKey)
      if (cachedResult) {
        // Create task with cached result
        const task = CrawlTask.create({
          organizationId: request.organizationId,
          userId: request.userId,
          url: request.url,
          configId: request.configId,
          status: CrawlStatus.COMPLETED,
          priority: request.priority || 5,
          markdownContent: cachedResult.markdown,
          extractedData: cachedResult.extractedData,
          cacheKey,
          executionTimeMs: Date.now() - startTime,
          metadata: { fromCache: true },
          completedAt: new Date(),
        })

        const savedTask = await this.taskRepository.create(task)

        return {
          success: true,
          task: {
            id: savedTask.id,
            url: savedTask.url,
            status: savedTask.status,
            markdownContent: savedTask.markdownContent || undefined,
            extractedData: savedTask.extractedData || undefined,
            executionTimeMs: savedTask.executionTimeMs || undefined,
            fromCache: true,
          },
        }
      }

      // 5. Get configuration (default or specified)
      const config = request.configId
        ? await this.configRepository.findById(request.configId, request.organizationId)
        : await this.configRepository.findDefaultConfig(request.organizationId)

      // 6. Create pending task
      let task = CrawlTask.create({
        organizationId: request.organizationId,
        userId: request.userId,
        url: request.url,
        configId: config?.id,
        status: CrawlStatus.PENDING,
        priority: request.priority || 5,
        cacheKey,
        llmProvider: request.llmProvider || config?.llmProvider,
        llmModel: request.llmModel || config?.llmModel,
        llmSchema: request.llmSchema,
        llmInstruction: request.llmInstruction,
        metadata: {},
      })

      task = await this.taskRepository.create(task)

      // 7. Execute crawl synchronously
      try {
        task.startProcessing()
        await this.taskRepository.update(task)

        const crawlRequest: any = {
          url: request.url,
          browser_config: config?.browserConfig,
          crawler_config: config?.crawlerConfig,
        }

        // Add LLM extraction if configured
        if (request.llmProvider && request.llmModel) {
          crawlRequest.extraction_config = this.crawl4aiClient.buildExtractionConfig(
            request.llmProvider,
            request.llmModel,
            request.llmSchema,
            request.llmInstruction
          )
        }

        const result = await this.crawl4aiClient.crawl(crawlRequest)

        if (result.success && result.markdown) {
          const markdown = sanitizeMarkdown(result.markdown)
          const executionTimeMs = Date.now() - startTime

          task.complete(markdown, result.extracted_data, executionTimeMs)
          await this.taskRepository.update(task)

          // 8. Store in cache
          await this.storeInCache(cacheKey, request.url, markdown, result.extracted_data)

          return {
            success: true,
            task: {
              id: task.id,
              url: task.url,
              status: task.status,
              markdownContent: markdown,
              extractedData: result.extracted_data,
              executionTimeMs,
              fromCache: false,
            },
          }
        } else {
          task.fail(result.error || 'Crawl failed without specific error')
          await this.taskRepository.update(task)

          return {
            success: false,
            task: {
              id: task.id,
              url: task.url,
              status: task.status,
            },
            error: result.error || 'Crawl failed',
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        task.fail(errorMessage)
        await this.taskRepository.update(task)

        return {
          success: false,
          task: {
            id: task.id,
            url: task.url,
            status: task.status,
          },
          error: errorMessage,
        }
      }
    } catch (error) {
      return {
        success: false,
        task: {
          id: '',
          url: request.url,
          status: CrawlStatus.FAILED,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check cache for existing crawl result
   * 
   * @param cacheKey - SHA-256 hash of normalized URL
   * @returns Cached result if found and not expired, null otherwise
   * @private
   */
  private async checkCache(cacheKey: string): Promise<{
    markdown: string
    extractedData?: Record<string, any>
  } | null> {
    try {
      const cached = await this.prisma.crawlCache.findUnique({
        where: { cacheKey },
      })

      if (!cached) return null

      // Check if cache is still valid
      if (new Date() > cached.expiresAt) {
        // Cache expired, delete it
        await this.prisma.crawlCache.delete({
          where: { cacheKey },
        })
        return null
      }

      // Update hit count and last accessed time
      await this.prisma.crawlCache.update({
        where: { cacheKey },
        data: {
          hitCount: cached.hitCount + 1,
          lastAccessedAt: new Date(),
        },
      })

      return {
        markdown: cached.markdownContent,
        extractedData: cached.extractedData as Record<string, any> | undefined,
      }
    } catch {
      return null
    }
  }

  /**
   * Store successful crawl result in cache
   * 
   * @param cacheKey - SHA-256 hash of normalized URL
   * @param url - Original URL for reference
   * @param markdown - Extracted markdown content
   * @param extractedData - Optional: LLM-extracted structured data
   * @returns Promise resolving when cache write completes (errors are logged, not thrown)
   * @private
   */
  private async storeInCache(
    cacheKey: string,
    url: string,
    markdown: string,
    extractedData?: Record<string, any>
  ): Promise<void> {
    try {
      const ttlSeconds = parseInt(process.env.CRAWL4AI_CACHE_TTL_SECONDS || '3600', 10)
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

      await this.prisma.crawlCache.upsert({
        where: { cacheKey },
        update: {
          markdownContent: markdown,
          extractedData: extractedData as any,
          expiresAt,
          lastAccessedAt: new Date(),
        },
        create: {
          cacheKey,
          url,
          markdownContent: markdown,
          extractedData: extractedData as any,
          expiresAt,
        },
      })
    } catch (error) {
      // Cache storage failure shouldn't fail the crawl
      console.error('Failed to store in cache:', error)
    }
  }
}
