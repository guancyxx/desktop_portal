/**
 * GET /api/crawl/job/[id] - Get Job Status
 * 
 * Poll for crawl job status and retrieve result when completed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withTenant } from '@/lib/withTenant'
import { container } from '@/application/container'

async function handler(
  req: NextRequest,
  context: { params: Record<string, string>; tenantContext: any }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantContext, params } = context
    if (!tenantContext?.organizationId) {
      return NextResponse.json(
        { error: 'Organization context is required' },
        { status: 400 }
      )
    }

    const taskId = params.id
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Get crawl status
    const getCrawlStatus = container.getCrawlStatus
    const result = await getCrawlStatus.execute({
      taskId,
      organizationId: tenantContext.organizationId,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Task not found' },
        { status: 404 }
      )
    }

    const task = result.task
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Build response based on task status
    const response: any = {
      taskId: task.id,
      status: task.status,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }

    // Include result data for completed tasks
    if (task.status === 'COMPLETED') {
      response.result = {
        id: task.id,
        url: task.url,
        status: task.status,
        markdownContent: task.markdownContent,
        extractedData: task.extractedData,
        executionTimeMs: task.executionTimeMs,
        fromCache: task.metadata?.fromCache || false,
        completedAt: task.completedAt,
      }
    }

    // Include error for failed tasks
    if (task.status === 'FAILED' && task.errorMessage) {
      response.error = task.errorMessage
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export const GET = withTenant(handler)
