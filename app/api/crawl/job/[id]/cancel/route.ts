/**
 * DELETE /api/crawl/job/[id] - Cancel Crawl Job
 * 
 * Cancel a pending or in-progress crawl job.
 * Only works for jobs that haven't completed yet.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withTenant } from '@/lib/withTenant'
import { container } from '@/application/container'
import { getQueueClient } from '@/infrastructure/queue/RedisQueueClient'

async function handler(
  req: NextRequest,
  context: { params: { id: string }; tenantContext: any }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { params, tenantContext } = context
    const taskId = params.id

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    if (!tenantContext?.organizationId) {
      return NextResponse.json(
        { error: 'Organization context is required' },
        { status: 400 }
      )
    }

    // Verify task exists and belongs to tenant
    const taskRepository = container.crawlTaskRepository
    const task = await taskRepository.findById(taskId, tenantContext.organizationId)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if task can be cancelled
    const currentStatus = task.props.status
    if (!['PENDING', 'IN_PROGRESS'].includes(currentStatus)) {
      return NextResponse.json(
        {
          error: 'Cannot cancel task',
          message: `Task is already ${currentStatus}. Only PENDING or IN_PROGRESS tasks can be cancelled.`,
        },
        { status: 400 }
      )
    }

    // Cancel job in Redis queue
    const queueClient = getQueueClient()
    const cancelled = await queueClient.cancelJob(taskId)

    if (!cancelled) {
      // Job not found in queue, update database status directly
      console.log(`[CancelJob] Job ${taskId} not found in queue, updating database status`)
    }

    // Update task status to CANCELLED
    await taskRepository.updateStatus(taskId, 'CANCELLED', 'Job cancelled by user')

    return NextResponse.json({
      taskId,
      status: 'CANCELLED',
      message: 'Crawl job cancelled successfully',
    })
  } catch (error) {
    console.error('[CancelJob] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export const DELETE = withTenant(handler)
