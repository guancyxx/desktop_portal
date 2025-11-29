/**
 * useCrawlTask Hook
 * 
 * React hook for crawl task operations (submit, status check, history).
 * Handles loading states, error handling, and cache management.
 */

import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import {
  CrawlRequest,
  CrawlTaskResponse,
  CrawlHistoryResponse,
  HealthCheckResponse,
  GetCrawlHistoryQuery,
} from '@/types/crawl'

export interface UseCrawlTaskResult {
  // Submit crawl task
  submitCrawl: (request: CrawlRequest) => Promise<CrawlTaskResponse | null>
  isSubmitting: boolean
  submitError: string | null

  // Get task status
  getTaskStatus: (taskId: string) => Promise<CrawlTaskResponse | null>
  isLoadingStatus: boolean
  statusError: string | null

  // Get crawl history
  getHistory: (query?: GetCrawlHistoryQuery) => Promise<CrawlHistoryResponse | null>
  isLoadingHistory: boolean
  historyError: string | null

  // Health check
  checkHealth: () => Promise<HealthCheckResponse | null>
  isCheckingHealth: boolean
  healthError: string | null
}

export function useCrawlTask(): UseCrawlTaskResult {
  const { toast } = useToast()

  // Submit crawl states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Status check states
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  // History states
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // Health check states
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [healthError, setHealthError] = useState<string | null>(null)

  /**
   * Submit a new crawl task
   */
  const submitCrawl = useCallback(
    async (request: CrawlRequest): Promise<CrawlTaskResponse | null> => {
      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const response = await fetch('/api/crawl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to submit crawl task')
        }

        const data: CrawlTaskResponse = await response.json()

        toast({
          title: 'Crawl submitted successfully',
          description: data.fromCache
            ? 'Result retrieved from cache'
            : `Task ${data.id} is ${data.status}`,
        })

        return data
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        setSubmitError(message)

        toast({
          variant: 'destructive',
          title: 'Crawl failed',
          description: message,
        })

        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [toast]
  )

  /**
   * Get task status by ID
   */
  const getTaskStatus = useCallback(
    async (taskId: string): Promise<CrawlTaskResponse | null> => {
      setIsLoadingStatus(true)
      setStatusError(null)

      try {
        const response = await fetch(`/api/crawl/${taskId}`)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to get task status')
        }

        const data: CrawlTaskResponse = await response.json()
        return data
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        setStatusError(message)

        toast({
          variant: 'destructive',
          title: 'Failed to load task',
          description: message,
        })

        return null
      } finally {
        setIsLoadingStatus(false)
      }
    },
    [toast]
  )

  /**
   * Get crawl history with pagination and filters
   */
  const getHistory = useCallback(
    async (query?: GetCrawlHistoryQuery): Promise<CrawlHistoryResponse | null> => {
      setIsLoadingHistory(true)
      setHistoryError(null)

      try {
        const params = new URLSearchParams()
        if (query?.status) params.append('status', query.status)
        if (query?.url) params.append('url', query.url)
        if (query?.page) params.append('page', query.page.toString())
        if (query?.limit) params.append('limit', query.limit.toString())

        const url = `/api/crawl/history${params.toString() ? `?${params}` : ''}`
        const response = await fetch(url)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to get crawl history')
        }

        const data: CrawlHistoryResponse = await response.json()
        return data
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        setHistoryError(message)

        toast({
          variant: 'destructive',
          title: 'Failed to load history',
          description: message,
        })

        return null
      } finally {
        setIsLoadingHistory(false)
      }
    },
    [toast]
  )

  /**
   * Check service health
   */
  const checkHealth = useCallback(async (): Promise<HealthCheckResponse | null> => {
    setIsCheckingHealth(true)
    setHealthError(null)

    try {
      const response = await fetch('/api/crawl/health')

      if (!response.ok) {
        throw new Error('Health check failed')
      }

      const data: HealthCheckResponse = await response.json()
      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setHealthError(message)
      return null
    } finally {
      setIsCheckingHealth(false)
    }
  }, [])

  return {
    submitCrawl,
    isSubmitting,
    submitError,
    getTaskStatus,
    isLoadingStatus,
    statusError,
    getHistory,
    isLoadingHistory,
    historyError,
    checkHealth,
    isCheckingHealth,
    healthError,
  }
}
