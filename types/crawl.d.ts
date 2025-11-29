/**
 * Crawl4AI Type Definitions
 * 
 * TypeScript types for API request/response based on OpenAPI schema.
 */

import { CrawlStatus } from '@/domain/models/CrawlTask'

// ===== API Request Types =====

export interface CrawlRequest {
  url: string
  configId?: string
  priority?: number
  llmProvider?: string
  llmModel?: string
  llmSchema?: Record<string, any>
  llmInstruction?: string
}

export interface CrawlJobRequest extends CrawlRequest {
  webhookUrl?: string
}

export interface GetCrawlHistoryQuery {
  status?: CrawlStatus
  url?: string
  page?: number
  limit?: number
}

// ===== API Response Types =====

export interface CrawlTaskResponse {
  id: string
  url: string
  status: CrawlStatus
  markdownContent?: string
  extractedData?: Record<string, any>
  errorMessage?: string
  executionTimeMs?: number
  fromCache?: boolean
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface CrawlHistoryItem {
  id: string
  url: string
  status: CrawlStatus
  priority: number
  hasContent: boolean
  hasExtractedData: boolean
  errorMessage?: string
  executionTimeMs?: number
  createdAt: string
  completedAt?: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CrawlHistoryResponse {
  items: CrawlHistoryItem[]
  pagination: PaginationMeta
}

export interface HealthCheckResponse {
  crawl4ai: {
    available: boolean
    version?: string
    error?: string
  }
  ollama: {
    available: boolean
    models?: Array<{
      name: string
      size: number
    }>
    error?: string
  }
}

export interface ErrorResponse {
  error: string
  code?: string
  details?: Record<string, any>
}

// ===== Job Status Types =====

export interface CrawlJobResponse {
  taskId: string
  status: 'queued'
  message: string
}

export interface JobStatusResponse {
  taskId: string
  status: CrawlStatus
  result?: CrawlTaskResponse
  error?: string
}

// ===== Config Types =====

export interface CrawlConfigResponse {
  id: string
  name: string
  isDefault: boolean
  browserConfig: {
    headless?: boolean
    viewport?: {
      width: number
      height: number
    }
    waitUntil?: string
    timeout?: number
  }
  crawlerConfig: {
    maxDepth?: number
    followLinks?: boolean
    respectRobotsTxt?: boolean
  }
  llmProvider?: string
  llmModel?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateConfigRequest {
  name: string
  browserConfig?: Record<string, any>
  crawlerConfig?: Record<string, any>
  llmProvider?: string
  llmModel?: string
  description?: string
  isDefault?: boolean
}

export interface UpdateConfigRequest extends Partial<CreateConfigRequest> {}
