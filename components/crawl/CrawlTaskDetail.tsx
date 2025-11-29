/**
 * CrawlTaskDetail Component
 * 
 * Displays detailed information for a single crawl task including markdown preview
 * and extracted data with copy-to-clipboard functionality.
 */

'use client'

import { useState } from 'react'
import { CrawlTaskResponse } from '@/types/crawl'
import { CrawlStatus } from '@/domain/models/CrawlTask'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle2, XCircle, Clock, Loader2, Copy, ExternalLink, FileText, Database, Zap } from 'lucide-react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'

interface CrawlTaskDetailProps {
  task: CrawlTaskResponse
}

export function CrawlTaskDetail({ task }: CrawlTaskDetailProps) {
  const { toast } = useToast()
  const [copiedMarkdown, setCopiedMarkdown] = useState(false)
  const [copiedData, setCopiedData] = useState(false)

  function getStatusBadge(status: CrawlStatus) {
    const variants = {
      [CrawlStatus.COMPLETED]: { variant: 'default' as const, icon: CheckCircle2, label: 'Completed' },
      [CrawlStatus.FAILED]: { variant: 'destructive' as const, icon: XCircle, label: 'Failed' },
      [CrawlStatus.IN_PROGRESS]: { variant: 'secondary' as const, icon: Loader2, label: 'In Progress' },
      [CrawlStatus.PENDING]: { variant: 'outline' as const, icon: Clock, label: 'Pending' },
    }

    const config = variants[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-4 w-4" />
        {config.label}
      </Badge>
    )
  }

  async function copyToClipboard(text: string, type: 'markdown' | 'data') {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'markdown') {
        setCopiedMarkdown(true)
        setTimeout(() => setCopiedMarkdown(false), 2000)
      } else {
        setCopiedData(true)
        setTimeout(() => setCopiedData(false), 2000)
      }
      toast({
        title: 'Copied to clipboard',
        description: `${type === 'markdown' ? 'Markdown' : 'JSON data'} copied successfully`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">Crawl Task</CardTitle>
                {task.fromCache && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Cached
                  </Badge>
                )}
              </div>
              <CardDescription className="flex items-center gap-2">
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {task.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </div>
            {getStatusBadge(task.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Task ID</div>
              <div className="font-mono mt-1">{task.id.slice(0, 8)}...</div>
            </div>
            {task.executionTimeMs && (
              <div>
                <div className="text-muted-foreground">Execution Time</div>
                <div className="font-medium mt-1">{task.executionTimeMs}ms</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground">Created At</div>
              <div className="font-medium mt-1">
                {format(new Date(task.createdAt), 'PPp')}
              </div>
            </div>
            {task.completedAt && (
              <div>
                <div className="text-muted-foreground">Completed At</div>
                <div className="font-medium mt-1">
                  {format(new Date(task.completedAt), 'PPp')}
                </div>
              </div>
            )}
          </div>

          {task.errorMessage && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="text-sm font-medium text-destructive flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Error Message
              </div>
              <div className="text-sm mt-2 text-muted-foreground">{task.errorMessage}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Tabs */}
      {(task.markdownContent || task.extractedData) && (
        <Tabs defaultValue={task.markdownContent ? 'markdown' : 'data'} className="w-full">
          <TabsList>
            {task.markdownContent && (
              <TabsTrigger value="markdown" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Markdown
              </TabsTrigger>
            )}
            {task.extractedData && (
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Extracted Data
              </TabsTrigger>
            )}
          </TabsList>

          {task.markdownContent && (
            <TabsContent value="markdown" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Markdown Content</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(task.markdownContent!, 'markdown')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedMarkdown ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{task.markdownContent}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {task.extractedData && (
            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Extracted Data (JSON)</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(JSON.stringify(task.extractedData, null, 2), 'data')
                      }
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedData ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                    <code>{JSON.stringify(task.extractedData, null, 2)}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {!task.markdownContent && !task.extractedData && task.status === CrawlStatus.COMPLETED && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No content available for this task
          </CardContent>
        </Card>
      )}
    </div>
  )
}
