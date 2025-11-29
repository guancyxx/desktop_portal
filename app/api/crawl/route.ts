/**
 * POST /api/crawl - Submit Crawl Task
 * 
 * Synchronous crawl endpoint that returns markdown content immediately.
 * Enforces tenant isolation via withTenant middleware.
 * Rate limited to 100 requests/hour per organization.
 */

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/application/container'
import { withTenant, TenantContext } from '@/lib/withTenant'
import { CrawlRequest } from '@/types/crawl'
import { checkRateLimit } from '@/lib/middleware/rateLimiter'

async function handleCrawl(req: NextRequest, context: TenantContext): Promise<NextResponse> {
  try {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(context.organizationId)
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

    const body: CrawlRequest = await req.json()

    // Validate required fields
    if (!body.url) {
      return NextResponse.json(
        { error: 'Missing required field: url' },
        { status: 400 }
      )
    }

    // Execute use case
    const useCase = container.submitCrawlTask
    const result = await useCase.execute({
      url: body.url,
      organizationId: context.organizationId,
      userId: context.userId,
      configId: body.configId,
      priority: body.priority,
      llmProvider: body.llmProvider,
      llmModel: body.llmModel,
      llmSchema: body.llmSchema,
      llmInstruction: body.llmInstruction,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Crawl failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      id: result.task.id,
      url: result.task.url,
      status: result.task.status,
      markdownContent: result.task.markdownContent,
      extractedData: result.task.extractedData,
      executionTimeMs: result.task.executionTimeMs,
      fromCache: result.task.fromCache,
    })
  } catch (error) {
    console.error('POST /api/crawl error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withTenant(handleCrawl)
