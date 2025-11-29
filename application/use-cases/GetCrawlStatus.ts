/**
 * GetCrawlStatus Use Case - Application Layer
 * 
 * Retrieves the status and result of a crawl task.
 * Enforces tenant isolation.
 */

import { CrawlStatus } from '@/domain/models/CrawlTask'
import { ICrawlTaskRepository } from '@/domain/repositories/ICrawlTaskRepository'

export interface GetCrawlStatusRequest {
  taskId: string
  organizationId: string
}

export interface GetCrawlStatusResponse {
  success: boolean
  task?: {
    id: string
    url: string
    status: CrawlStatus
    markdownContent?: string
    extractedData?: Record<string, any>
    errorMessage?: string
    executionTimeMs?: number
    createdAt: Date
    updatedAt: Date
    completedAt?: Date
  }
  error?: string
}

/**
 * GetCrawlStatus Use Case
 * 
 * Retrieves the current status and result of a crawl task.
 * Enforces tenant isolation - users can only access tasks from their organization.
 * 
 * @class GetCrawlStatus
 */
export class GetCrawlStatus {
  /**
   * Creates an instance of GetCrawlStatus use case
   * 
   * @param taskRepository - Repository for CrawlTask data access
   */
  constructor(private taskRepository: ICrawlTaskRepository) {}

  /**
   * Retrieve task status and result
   * 
   * @param request - Task identifier and organization context
   * @param request.taskId - Unique task identifier (UUID)
   * @param request.organizationId - Tenant identifier for isolation
   * 
   * @returns Promise resolving to task details
   * @returns {success: true, task: {...}} - If task found and belongs to organization
   * @returns {success: false, error: string} - If task not found or access denied
   * 
   * @throws Never throws - all errors are caught and returned in response
   * 
   * @example
   * ```typescript
   * const result = await getCrawlStatus.execute({
   *   taskId: 'task-uuid',
   *   organizationId: 'org-123'
   * });
   * 
   * if (result.success) {
   *   console.log('Status:', result.task.status); // PENDING | IN_PROGRESS | COMPLETED | FAILED
   *   console.log('Markdown:', result.task.markdownContent);
   * }
   * ```
   */
  async execute(request: GetCrawlStatusRequest): Promise<GetCrawlStatusResponse> {
    try {
      const task = await this.taskRepository.findById(request.taskId, request.organizationId)

      if (!task) {
        return {
          success: false,
          error: 'Task not found or access denied',
        }
      }

      const props = task.toPlainObject()

      return {
        success: true,
        task: {
          id: props.id,
          url: props.url,
          status: props.status,
          markdownContent: props.markdownContent || undefined,
          extractedData: props.extractedData || undefined,
          errorMessage: props.errorMessage || undefined,
          executionTimeMs: props.executionTimeMs || undefined,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
          completedAt: props.completedAt || undefined,
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
