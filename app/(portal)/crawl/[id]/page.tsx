/**
 * Crawl Task Detail Page
 * 
 * Displays detailed information for a specific crawl task including content and metadata.
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCrawlTask } from '@/hooks/useCrawlTask'
import { CrawlTaskDetail } from '@/components/crawl/CrawlTaskDetail'
import { CrawlTaskResponse } from '@/types/crawl'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function CrawlTaskPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const { getTaskStatus, isLoadingStatus } = useCrawlTask()
  const [task, setTask] = useState<CrawlTaskResponse | null>(null)

  async function loadTask() {
    const result = await getTaskStatus(taskId)
    if (result) {
      setTask(result)
    }
  }

  useEffect(() => {
    loadTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  if (isLoadingStatus && !task) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Task Not Found</h1>
          <p className="text-muted-foreground">
            The crawl task you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/crawl')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Crawl
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/crawl')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Crawl
        </Button>
        <Button variant="outline" onClick={loadTask} disabled={isLoadingStatus}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <CrawlTaskDetail task={task} />
    </div>
  )
}
