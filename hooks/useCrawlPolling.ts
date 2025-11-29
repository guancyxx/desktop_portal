/**
 * useCrawlPolling Hook
 * 
 * React hook for polling crawl job status with automatic stop on completion.
 * Polls every 2 seconds until task reaches terminal state (COMPLETED/FAILED).
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CrawlStatus } from '@/domain/models/CrawlTask'
import { CrawlTaskResponse } from '@/types/crawl'
import { useToast } from '@/components/ui/use-toast'

export interface JobStatusResponse {
  taskId: string
  status: CrawlStatus
  result?: CrawlTaskResponse
  error?: string
  createdAt: string
  updatedAt: string
}

export interface UseCrawlPollingOptions {
  taskId: string
  enabled?: boolean
  interval?: number // milliseconds
  onComplete?: (result: CrawlTaskResponse) => void
  onError?: (error: string) => void
}

export function useCrawlPolling({
  taskId,
  enabled = true,
  interval = 2000,
  onComplete,
  onError,
}: UseCrawlPollingOptions) {
  const { toast } = useToast()
  const [status, setStatus] = useState<JobStatusResponse | null>(null)
  const [isPolling, setIsPolling] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  const fetchStatus = useCallback(async () => {
    if (!taskId) return

    try {
      const response = await fetch(`/api/crawl/job/${taskId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch job status')
      }

      const data: JobStatusResponse = await response.json()
      
      if (!mountedRef.current) return

      setStatus(data)
      setError(null)

      // Check if terminal state reached
      if (data.status === CrawlStatus.COMPLETED) {
        setIsPolling(false)
        if (data.result && onComplete) {
          onComplete(data.result)
        }
        toast({
          title: 'Crawl Completed',
          description: `Successfully crawled ${data.result?.url || 'URL'}`,
        })
      } else if (data.status === CrawlStatus.FAILED) {
        setIsPolling(false)
        const errorMsg = data.error || 'Crawl failed'
        setError(errorMsg)
        if (onError) {
          onError(errorMsg)
        }
        toast({
          title: 'Crawl Failed',
          description: errorMsg,
          variant: 'destructive',
        })
      } else if (data.status === CrawlStatus.CANCELLED) {
        setIsPolling(false)
        toast({
          title: 'Crawl Cancelled',
          description: 'The crawl job was cancelled',
        })
      }
    } catch (err) {
      if (!mountedRef.current) return
      
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      setIsPolling(false)
      
      toast({
        title: 'Polling Error',
        description: errorMsg,
        variant: 'destructive',
      })
    }
  }, [taskId, onComplete, onError, toast])

  // Start/stop polling based on isPolling state
  useEffect(() => {
    mountedRef.current = true

    if (isPolling && taskId) {
      // Fetch immediately
      fetchStatus()

      // Then poll at interval
      intervalRef.current = setInterval(fetchStatus, interval)
    }

    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPolling, taskId, interval, fetchStatus])

  const startPolling = useCallback(() => {
    setIsPolling(true)
    setError(null)
  }, [])

  const stopPolling = useCallback(() => {
    setIsPolling(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const refresh = useCallback(() => {
    fetchStatus()
  }, [fetchStatus])

  return {
    status,
    isPolling,
    error,
    startPolling,
    stopPolling,
    refresh,
  }
}
