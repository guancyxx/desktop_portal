/**
 * GET /api/crawl/history - Crawl Task History
 * 
 * Retrieves crawl task history with pagination and filtering.
 * Enforces tenant isolation via withTenant middleware.
 */

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/application/container'
import { withTenant, TenantContext } from '@/lib/withTenant'
import { CrawlStatus } from '@/domain/models/CrawlTask'
import { GetCrawlHistoryQuery, CrawlHistoryResponse } from '@/types/crawl'

async function handleGetHistory(req: NextRequest, context: TenantContext): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)

    const query: GetCrawlHistoryQuery = {
      status: searchParams.get('status') as CrawlStatus | undefined,
      url: searchParams.get('url') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    }

    // Validate pagination parameters
    if (query.page < 1) {
      return NextResponse.json({ error: 'page must be >= 1' }, { status: 400 })
    }

    if (query.limit < 1 || query.limit > 100) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Execute use case
    const useCase = container.getCrawlHistory
    const result = await useCase.execute({
      organizationId: context.organizationId,
      status: query.status,
      url: query.url,
      page: query.page,
      limit: query.limit,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to retrieve history' },
        { status: 400 }
      )
    }

    const response: CrawlHistoryResponse = {
      items: result.data!.items.map((item: any) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        completedAt: item.completedAt?.toISOString(),
      })),
      pagination: result.data!.pagination,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET /api/crawl/history error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withTenant(handleGetHistory)
