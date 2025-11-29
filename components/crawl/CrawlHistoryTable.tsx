/**
 * CrawlHistoryTable Component
 * 
 * Displays crawl task history with status badges, filtering, and pagination.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCrawlTask } from '@/hooks/useCrawlTask'
import { CrawlHistoryResponse } from '@/types/crawl'
import { CrawlStatus } from '@/domain/models/CrawlTask'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, XCircle, Clock, Loader2, FileText, Database } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function CrawlHistoryTable() {
  const router = useRouter()
  const { getHistory, isLoadingHistory } = useCrawlTask()

  const [history, setHistory] = useState<CrawlHistoryResponse | null>(null)
  const [statusFilter, setStatusFilter] = useState<CrawlStatus | ''>('')
  const [urlFilter, setUrlFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage])

  async function loadHistory() {
    const result = await getHistory({
      status: statusFilter || undefined,
      url: urlFilter || undefined,
      page: currentPage,
      limit: 20,
    })
    if (result) {
      setHistory(result)
    }
  }

  function handleSearch() {
    setCurrentPage(1)
    loadHistory()
  }

  function handleRowClick(taskId: string) {
    router.push(`/crawl/${taskId}`)
  }

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
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (isLoadingHistory && !history) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CrawlStatus | '')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value={CrawlStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={CrawlStatus.FAILED}>Failed</SelectItem>
            <SelectItem value={CrawlStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={CrawlStatus.PENDING}>Pending</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Filter by URL..."
            value={urlFilter}
            onChange={(e) => setUrlFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No crawl tasks found
                </TableCell>
              </TableRow>
            ) : (
              history?.items.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(task.id)}
                >
                  <TableCell className="max-w-md truncate font-medium">
                    {task.url}
                  </TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {task.hasContent && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Markdown
                        </Badge>
                      )}
                      {task.hasExtractedData && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Data
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.executionTimeMs ? `${task.executionTimeMs}ms` : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {history && history.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {history.pagination.page} of {history.pagination.totalPages} ({history.pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(history.pagination.totalPages, p + 1))}
              disabled={currentPage === history.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
