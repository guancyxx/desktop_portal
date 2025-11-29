/**
 * Async Crawl Job Demo Page
 * 
 * Demonstrates asynchronous crawl job submission with real-time status polling.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CrawlSubmitForm } from '@/components/crawl/CrawlSubmitForm'
import { CrawlJobStatus } from '@/components/crawl/CrawlJobStatus'
import { CrawlTaskDetail } from '@/components/crawl/CrawlTaskDetail'
import { CrawlTaskResponse } from '@/types/crawl'
import { ArrowLeft, Zap } from 'lucide-react'

export default function AsyncCrawlPage() {
  const router = useRouter()
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [completedTask, setCompletedTask] = useState<CrawlTaskResponse | null>(null)

  function handleAsyncSubmit(taskId: string) {
    setCurrentTaskId(taskId)
    setCompletedTask(null)
  }

  function handleComplete(result: CrawlTaskResponse) {
    setCompletedTask(result)
  }

  function handleReset() {
    setCurrentTaskId(null)
    setCompletedTask(null)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Async Crawl Jobs</h1>
          </div>
          <p className="text-muted-foreground">
            Submit crawl jobs for background processing with real-time status updates
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/crawl')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Crawl
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Submission Form */}
        {!currentTaskId && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Async Crawl Job</CardTitle>
              <CardDescription>
                Submit a URL for background crawling. You'll receive a task ID to track progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CrawlSubmitForm onAsyncSubmit={handleAsyncSubmit} />
            </CardContent>
          </Card>
        )}

        {/* Job Status Polling */}
        {currentTaskId && !completedTask && (
          <div className="space-y-6">
            <CrawlJobStatus
              taskId={currentTaskId}
              onComplete={handleComplete}
              showActions={true}
            />
            <Button onClick={handleReset} variant="outline" className="w-full">
              Submit Another Job
            </Button>
          </div>
        )}

        {/* Completed Task Details */}
        {completedTask && (
          <div className="space-y-6">
            <CrawlTaskDetail task={completedTask} />
            <Button onClick={handleReset} className="w-full">
              Submit Another Job
            </Button>
          </div>
        )}
      </div>

      {/* Info Cards */}
      {!currentTaskId && (
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <div className="font-medium">Submit Job</div>
                  <div className="text-muted-foreground">
                    Enable "Async Mode" and submit your crawl request
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <div className="font-medium">Get Task ID</div>
                  <div className="text-muted-foreground">
                    Receive task ID immediately without waiting
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <div className="font-medium">Auto-Polling</div>
                  <div className="text-muted-foreground">
                    Status updates every 2 seconds automatically
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <div className="font-medium">View Results</div>
                  <div className="text-muted-foreground">
                    Access markdown and extracted data when complete
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="text-green-600 mt-0.5">✓</div>
                <div>
                  <div className="font-medium">Non-blocking Submission</div>
                  <div className="text-muted-foreground">
                    Submit multiple jobs without waiting for completion
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="text-green-600 mt-0.5">✓</div>
                <div>
                  <div className="font-medium">Real-time Updates</div>
                  <div className="text-muted-foreground">
                    Automatic status polling every 2 seconds
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="text-green-600 mt-0.5">✓</div>
                <div>
                  <div className="font-medium">Webhook Notifications</div>
                  <div className="text-muted-foreground">
                    Optional POST callback when job completes
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="text-green-600 mt-0.5">✓</div>
                <div>
                  <div className="font-medium">Progress Tracking</div>
                  <div className="text-muted-foreground">
                    Visual progress bar for running jobs
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
