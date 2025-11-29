/**
 * GetCrawlHistory Use Case - Application Layer
 * 
 * Retrieves crawl task history for a tenant with pagination.
 * Enforces tenant isolation and supports filtering.
 */

import { CrawlStatus } from '@/domain/models/CrawlTask'
import {
  ICrawlTaskRepository,
  CrawlTaskFilter,
  PaginationOptions,
} from '@/domain/repositories/ICrawlTaskRepository'

export interface GetCrawlHistoryRequest {
  organizationId: string
  userId?: string
  status?: CrawlStatus
  url?: string
  page?: number
  limit?: number
}

export interface GetCrawlHistoryResponse {
  success: boolean
  data?: {
    items: Array<{
      id: string
      url: string
      status: CrawlStatus
      priority: number
      hasContent: boolean
      hasExtractedData: boolean
      errorMessage?: string
      executionTimeMs?: number
      createdAt: Date
      completedAt?: Date
    }>
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
  error?: string
}

/**
 * GetCrawlHistory Use Case
 * 
 * Retrieves paginated crawl task history for a tenant with optional filtering.
 * Enforces tenant isolation and supports filtering by user, status, and URL.
 * 
 * @class GetCrawlHistory
 */
export class GetCrawlHistory {
  /**
   * Creates an instance of GetCrawlHistory use case
   * 
   * @param taskRepository - Repository for CrawlTask data access
   */
  constructor(private taskRepository: ICrawlTaskRepository) {}

  /**
   * Retrieve paginated crawl history
   * 
   * @param request - Filter criteria and pagination options
   * @param request.organizationId - Tenant identifier (required, enforces isolation)
   * @param request.userId - Optional: Filter by specific user
   * @param request.status - Optional: Filter by task status (PENDING | IN_PROGRESS | COMPLETED | FAILED)
   * @param request.url - Optional: Filter by URL substring (case-insensitive)
   * @param request.page - Optional: Page number (default: 1)
   * @param request.limit - Optional: Items per page (default: 20, max: 100)
   * 
   * @returns Promise resolving to paginated task list
   * @returns {success: true, data: {...}} - If query succeeds (empty array if no results)
   * @returns {success: false, error: string} - If database error occurs
   * 
   * @throws Never throws - all errors are caught and returned in response
   * 
   * @example
   * ```typescript
   * // Get first page of completed tasks
   * const result = await getCrawlHistory.execute({
   *   organizationId: 'org-123',
   *   status: CrawlStatus.COMPLETED,
   *   page: 1,
   *   limit: 20
   * });
   * 
   * if (result.success) {
   *   console.log('Total tasks:', result.data.pagination.total);
   *   result.data.items.forEach(task => {
   *     console.log(`${task.url} - ${task.status}`);
   *   });
   * }
   * ```
   */
  async execute(request: GetCrawlHistoryRequest): Promise<GetCrawlHistoryResponse> {
    try {
      const filter: CrawlTaskFilter = {
        organizationId: request.organizationId,
        userId: request.userId,
        status: request.status,
        url: request.url,
      }

      const pagination: PaginationOptions = {
        page: request.page || 1,
        limit: request.limit || 20,
      }

      const result = await this.taskRepository.findMany(filter, pagination)

      return {
        success: true,
        data: {
          items: result.items.map((task) => {
            const props = task.toPlainObject()
            return {
              id: props.id,
              url: props.url,
              status: props.status,
              priority: props.priority,
              hasContent: !!props.markdownContent,
              hasExtractedData: !!props.extractedData,
              errorMessage: props.errorMessage || undefined,
              executionTimeMs: props.executionTimeMs || undefined,
              createdAt: props.createdAt,
              completedAt: props.completedAt || undefined,
            }
          }),
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
