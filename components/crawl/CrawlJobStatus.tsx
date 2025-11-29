/**
 * CrawlJobStatus Component
 * 
 * Real-time status display for asynchronous crawl jobs with polling.
 * Shows progress indicator, status badges, and auto-refreshes every 2 seconds.
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useCrawlPolling } from '@/hooks/useCrawlPolling'
import { CrawlStatus } from '@/domain/models/CrawlTask'
import { CrawlTaskResponse } from '@/types/crawl'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  ExternalLink,
  Pause,
  Play,
  Ban,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface CrawlJobStatusProps {
  taskId: string
  onComplete?: (result: CrawlTaskResponse) => void
  onError?: (error: string) => void
  showActions?: boolean
}

export function CrawlJobStatus({
  taskId,
  onComplete,
  onError,
  showActions = true,
}: CrawlJobStatusProps) {
  const { status, isPolling, error, startPolling, stopPolling, refresh } = useCrawlPolling({
    taskId,
    enabled: true,
    interval: 2000,
    onComplete,
    onError,
  })

  const [progress, setProgress] = useState(0)

  // Simulate progress for IN_PROGRESS status
  useEffect(() => {
    if (status?.status === CrawlStatus.IN_PROGRESS) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90 // Max 90% until actual completion
          return prev + 5
        })
      }, 1000)
      return () => clearInterval(timer)
    } else if (status?.status === CrawlStatus.COMPLETED) {
      setProgress(100)
    } else if (status?.status === CrawlStatus.PENDING) {
      setProgress(0)
    }
  }, [status?.status])

  function getStatusBadge(jobStatus: CrawlStatus) {
    const variants = {
      [CrawlStatus.COMPLETED]: {
        variant: 'default' as const,
        icon: CheckCircle2,
        label: 'Completed',
        color: 'text-green-600',
      },
      [CrawlStatus.FAILED]: {
        variant: 'destructive' as const,
        icon: XCircle,
        label: 'Failed',
        color: 'text-red-600',
      },
      [CrawlStatus.IN_PROGRESS]: {
        variant: 'secondary' as const,
        icon: Loader2,
        label: 'In Progress',
        color: 'text-blue-600',
      },
      [CrawlStatus.PENDING]: {
        variant: 'outline' as const,
        icon: Clock,
        label: 'Pending',
        color: 'text-gray-600',
      },
      [CrawlStatus.CANCELLED]: {
        variant: 'secondary' as const,
        icon: Ban,
        label: 'Cancelled',
        color: 'text-gray-600',
      },
    }

    const config = variants[jobStatus]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className={`h-4 w-4 ${jobStatus === CrawlStatus.IN_PROGRESS ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    )
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this crawl job?')) {
      return
    }

    try {
      const response = await fetch(`/api/crawl/job/${taskId}/cancel`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel job')
      }

      // Refresh status immediately
      await refresh()
    } catch (error) {
      console.error('Failed to cancel job:', error)
      alert('Failed to cancel job. Please try again.')
    }
  }

  const canCancel = status?.status === CrawlStatus.PENDING || status?.status === CrawlStatus.IN_PROGRESS

  if (!status) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading job status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Job Status
              {getStatusBadge(status.status)}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              Task ID: {taskId.slice(0, 8)}...
            </CardDescription>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isPolling && status.status !== CrawlStatus.COMPLETED}
              >
                <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} />
              </Button>
              {status.status === CrawlStatus.IN_PROGRESS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPolling ? stopPolling : startPolling}
                >
                  {isPolling ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </>
                  )}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar for IN_PROGRESS */}
        {status.status === CrawlStatus.IN_PROGRESS && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Created</div>
            <div className="font-medium mt-1">
              {formatDistanceToNow(new Date(status.createdAt), { addSuffix: true })}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Updated</div>
            <div className="font-medium mt-1">
              {formatDistanceToNow(new Date(status.updatedAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* URL for completed tasks */}
        {status.result?.url && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">Target URL</div>
            <a
              href={status.result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {status.result.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Error message */}
        {(error || status.error) && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="text-sm font-medium text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Error
            </div>
            <div className="text-sm mt-2 text-muted-foreground">
              {error || status.error}
            </div>
          </div>
        )}

        {/* Success info */}
        {status.status === CrawlStatus.COMPLETED && status.result && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-sm font-medium text-green-800 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Crawl Completed Successfully
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              {status.result.executionTimeMs && (
                <div>
                  <div className="text-muted-foreground">Execution Time</div>
                  <div className="font-medium">{status.result.executionTimeMs}ms</div>
                </div>
              )}
              {status.result.markdownContent && (
                <div>
                  <div className="text-muted-foreground">Content</div>
                  <div className="font-medium">✓ Markdown Available</div>
                </div>
              )}
              {status.result.extractedData && (
                <div>
                  <div className="text-muted-foreground">Extracted Data</div>
                  <div className="font-medium">✓ JSON Available</div>
                </div>
              )}
              {status.result.fromCache && (
                <div>
                  <div className="text-muted-foreground">Cache</div>
                  <div className="font-medium">✓ From Cache</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Polling indicator */}
        {isPolling && status.status !== CrawlStatus.COMPLETED && status.status !== CrawlStatus.FAILED && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Auto-refreshing every 2 seconds...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
