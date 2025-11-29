/**
 * Crawl4AIClient - Infrastructure Layer
 * 
 * HTTP client for Crawl4AI Docker service.
 * Handles communication with FastAPI endpoints.
 */

import axios, { AxiosInstance } from 'axios'

export interface Crawl4AIHealthResponse {
  status: string
  timestamp: number
  version: string
}

export interface CrawlRequest {
  url: string
  extraction_config?: {
    type: 'llm'
    provider?: string
    api_base?: string
    model?: string
    schema?: Record<string, any>
    instruction?: string
  }
  browser_config?: {
    headless?: boolean
    viewport?: { width: number; height: number }
    user_agent?: string
  }
  crawler_config?: {
    max_depth?: number
    wait_until?: string
    timeout?: number
  }
}

export interface CrawlResponse {
  success: boolean
  url: string
  markdown?: string
  extracted_data?: Record<string, any>
  metadata?: {
    title?: string
    description?: string
    keywords?: string[]
    execution_time_ms?: number
  }
  error?: string
}

export interface CrawlJobResponse {
  task_id: string
  status: 'queued'
}

export interface JobStatusResponse {
  task_id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  result?: CrawlResponse
  error?: string
  created_at?: string
  updated_at?: string
}

export class Crawl4AIClient {
  private client: AxiosInstance
  private readonly baseUrl: string
  private readonly MAX_RESPONSE_SIZE = 10 * 1024 * 1024 // 10MB limit to prevent memory exhaustion

  constructor() {
    this.baseUrl = process.env.CRAWL4AI_API_URL || 'http://localhost:11235'
    const timeout = parseInt(process.env.CRAWL4AI_TIMEOUT_MS || '30000', 10)

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<Crawl4AIHealthResponse> {
    try {
      const response = await this.client.get<Crawl4AIHealthResponse>('/health')
      return response.data
    } catch (error) {
      throw new Error(
        `Crawl4AI health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Synchronous crawl - waits for completion and returns result immediately
   */
  async crawl(request: CrawlRequest): Promise<CrawlResponse> {
    try {
      const response = await this.client.post<CrawlResponse>('/crawl', request, {
        maxContentLength: this.MAX_RESPONSE_SIZE,
        maxBodyLength: this.MAX_RESPONSE_SIZE,
      })
      
      // Additional validation: check markdown content size if present
      if (response.data.markdown) {
        const markdownSize = Buffer.byteLength(response.data.markdown, 'utf8')
        if (markdownSize > this.MAX_RESPONSE_SIZE) {
          throw new Error(
            `Response markdown size (${markdownSize} bytes) exceeds maximum allowed (${this.MAX_RESPONSE_SIZE} bytes)`
          )
        }
      }
      
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message
        throw new Error(`Crawl4AI crawl failed: ${message}`)
      }
      throw new Error(
        `Crawl4AI crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Asynchronous crawl - submits job and returns task_id immediately
   */
  async crawlAsync(request: CrawlRequest): Promise<CrawlJobResponse> {
    try {
      const response = await this.client.post<CrawlJobResponse>('/crawl/job', request, {
        maxContentLength: this.MAX_RESPONSE_SIZE,
        maxBodyLength: this.MAX_RESPONSE_SIZE,
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message
        throw new Error(`Crawl4AI async crawl failed: ${message}`)
      }
      throw new Error(
        `Crawl4AI async crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get job status and result
   */
  async getJobStatus(taskId: string): Promise<JobStatusResponse> {
    try {
      const response = await this.client.get<JobStatusResponse>(`/crawl/job/${taskId}`, {
        maxContentLength: this.MAX_RESPONSE_SIZE,
        maxBodyLength: this.MAX_RESPONSE_SIZE,
      })
      
      // Validate result markdown size if job completed
      if (response.data.result?.markdown) {
        const markdownSize = Buffer.byteLength(response.data.result.markdown, 'utf8')
        if (markdownSize > this.MAX_RESPONSE_SIZE) {
          throw new Error(
            `Job result markdown size (${markdownSize} bytes) exceeds maximum allowed (${this.MAX_RESPONSE_SIZE} bytes)`
          )
        }
      }
      
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message
        throw new Error(`Crawl4AI job status check failed: ${message}`)
      }
      throw new Error(
        `Crawl4AI job status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Build extraction config for LLM-based extraction
   */
  buildExtractionConfig(
    provider: string,
    model: string,
    schema?: Record<string, any>,
    instruction?: string
  ): CrawlRequest['extraction_config'] {
    const ollamaBaseUrl = process.env.OLLAMA_API_URL || 'http://host.docker.internal:11434'

    return {
      type: 'llm',
      provider,
      api_base: provider === 'ollama' ? ollamaBaseUrl : undefined,
      model,
      schema,
      instruction,
    }
  }

  /**
   * Test connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck()
      return true
    } catch {
      return false
    }
  }
}
