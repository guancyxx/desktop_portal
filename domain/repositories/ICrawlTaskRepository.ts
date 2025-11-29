/**
 * ICrawlTaskRepository - Domain Repository Interface
 * 
 * Defines contract for CrawlTask persistence operations.
 * Infrastructure layer implements this interface using Prisma.
 */

import { CrawlTask, CrawlStatus } from '../models/CrawlTask'

export interface CrawlTaskFilter {
  organizationId: string
  userId?: string
  status?: CrawlStatus
  url?: string
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ICrawlTaskRepository {
  /**
   * Create a new crawl task
   */
  create(task: CrawlTask): Promise<CrawlTask>

  /**
   * Find task by ID (with tenant verification)
   */
  findById(id: string, organizationId: string): Promise<CrawlTask | null>

  /**
   * Find task by cache key (for cache lookup)
   */
  findByCacheKey(cacheKey: string, organizationId: string): Promise<CrawlTask | null>

  /**
   * Update existing task
   */
  update(task: CrawlTask): Promise<CrawlTask>

  /**
   * Delete task (soft delete - mark as deleted, don't remove from DB)
   */
  delete(id: string, organizationId: string): Promise<boolean>

  /**
   * Find tasks matching filter criteria with pagination
   */
  findMany(
    filter: CrawlTaskFilter,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<CrawlTask>>

  /**
   * Find all active tasks for an organization (PENDING or IN_PROGRESS)
   */
  findActiveTasks(organizationId: string): Promise<CrawlTask[]>

  /**
   * Count tasks by status for an organization
   */
  countByStatus(organizationId: string, status: CrawlStatus): Promise<number>

  /**
   * Check if URL is already being crawled (to prevent duplicates)
   */
  hasActiveCrawlForUrl(url: string, organizationId: string): Promise<boolean>
}
