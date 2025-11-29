/**
 * POST /api/crawl/job - Asynchronous Crawl Job Submission
 * 
 * Submit a crawl job for background processing.
 * Returns task_id immediately without waiting for completion.
 * Rate limited to 100 requests/hour per organization.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withTenant } from '@/lib/withTenant'
import { container } from '@/application/container'
import { getQueueClient } from '@/infrastructure/queue/RedisQueueClient'
import { CrawlTask, CrawlStatus } from '@/domain/models/CrawlTask'
import { checkRateLimit } from '@/lib/middleware/rateLimiter'
import { z } from 'zod'

const jobRequestSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' }),
  configId: z.string().uuid().optional(),
  priority: z.number().min(1).max(10).default(5),
  llmProvider: z.string().optional(),
  llmModel: z.string().optional(),
  llmSchema: z.record(z.any()).optional(),
  llmInstruction: z.string().optional(),
  webhookUrl: z.string().url().optional(),
})

async function handler(
  req: NextRequest,
  context: { params: Record<string, string>; tenantContext: any }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = jobRequestSchema.parse(body)

    const { tenantContext } = context
    if (!tenantContext?.organizationId) {
      return NextResponse.json(
        { error: 'Organization context is required' },
        { status: 400 }
      )
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(tenantContext.organizationId)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 100 requests per hour per organization.' },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    // Check concurrency limit for tenant (max 10 active jobs)
    const queueClient = getQueueClient()
    const limitReached = await queueClient.checkConcurrencyLimit(
      tenantContext.organizationId,
      10
    )
    
    if (limitReached) {
      return NextResponse.json(
        { error: 'Concurrency limit reached. Maximum 10 active jobs per organization.' },
        { status: 429 }
      )
    }

    // Create task record with PENDING status
    const taskRepository = container.crawlTaskRepository
    
    const taskEntity = CrawlTask.create({
      organizationId: tenantContext.organizationId,
      userId: session.user.id,
      url: validatedData.url,
      status: CrawlStatus.PENDING,
      priority: validatedData.priority,
      configId: validatedData.configId,
      llmProvider: validatedData.llmProvider,
      llmModel: validatedData.llmModel,
      llmSchema: validatedData.llmSchema,
      llmInstruction: validatedData.llmInstruction,
      metadata: validatedData.webhookUrl 
        ? { webhookUrl: validatedData.webhookUrl }
        : {},
    })

    const task = await taskRepository.create(taskEntity)

    // Add job to Redis queue for background processing
    await queueClient.addJob({
      taskId: task.id,
      organizationId: tenantContext.organizationId,
      userId: session.user.id,
      url: validatedData.url,
      configId: validatedData.configId,
      priority: validatedData.priority,
      llm: validatedData.llmProvider ? {
        provider: validatedData.llmProvider,
        model: validatedData.llmModel,
        schema: validatedData.llmSchema,
        instruction: validatedData.llmInstruction,
      } : undefined,
      webhookUrl: validatedData.webhookUrl,
    })

    return NextResponse.json(
      {
        taskId: task.id,
        status: 'queued',
        message: 'Crawl job queued successfully. Use task ID to poll for status.',
      },
      { status: 202 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export const POST = withTenant(handler)
