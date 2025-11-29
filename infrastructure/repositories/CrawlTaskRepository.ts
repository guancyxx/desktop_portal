/**
 * CrawlTaskRepository - Infrastructure Layer (Prisma Implementation)
 * 
 * Implements ICrawlTaskRepository using Prisma ORM.
 * Handles tenant-scoped data access for CrawlTask entity.
 */

import { PrismaClient } from '@prisma/client'
import {
  CrawlTask,
  CrawlStatus,
} from '@/domain/models/CrawlTask'
import {
  ICrawlTaskRepository,
  CrawlTaskFilter,
  PaginationOptions,
  PaginatedResult,
} from '@/domain/repositories/ICrawlTaskRepository'

/**
 * CrawlTaskRepository - Prisma Implementation
 * 
 * Implements ICrawlTaskRepository interface using Prisma ORM.
 * Handles all database operations for CrawlTask entity with tenant isolation.
 * All queries automatically filter by organizationId to prevent cross-tenant data access.
 * 
 * @class CrawlTaskRepository
 * @implements {ICrawlTaskRepository}
 */
export class CrawlTaskRepository implements ICrawlTaskRepository {
  /**
   * Creates an instance of CrawlTaskRepository
   * 
   * @param prisma - Prisma client instance for database access
   */
  constructor(private prisma: PrismaClient) {}

  async create(task: CrawlTask): Promise<CrawlTask> {
    const props = task.toPlainObject()

    const created = await this.prisma.crawlTask.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        userId: props.userId,
        url: props.url,
        configId: props.configId,
        status: props.status,
        priority: props.priority,
        markdownContent: props.markdownContent,
        extractedData: props.extractedData as any,
        errorMessage: props.errorMessage,
        llmProvider: props.llmProvider,
        llmModel: props.llmModel,
        llmSchema: props.llmSchema as any,
        llmInstruction: props.llmInstruction,
        cacheKey: props.cacheKey,
        executionTimeMs: props.executionTimeMs,
        metadata: props.metadata as any,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        completedAt: props.completedAt,
      },
    })

    return this.toDomain(created)
  }

  async findById(id: string, organizationId: string): Promise<CrawlTask | null> {
    const task = await this.prisma.crawlTask.findFirst({
      where: {
        id,
        organizationId,
      },
    })

    return task ? this.toDomain(task) : null
  }

  async findByCacheKey(cacheKey: string, organizationId: string): Promise<CrawlTask | null> {
    const task = await this.prisma.crawlTask.findFirst({
      where: {
        cacheKey,
        organizationId,
        status: CrawlStatus.COMPLETED,
      },
      orderBy: {
        completedAt: 'desc',
      },
    })

    return task ? this.toDomain(task) : null
  }

  async update(task: CrawlTask): Promise<CrawlTask> {
    const props = task.toPlainObject()

    const updated = await this.prisma.crawlTask.update({
      where: { id: props.id },
      data: {
        status: props.status,
        priority: props.priority,
        markdownContent: props.markdownContent,
        extractedData: props.extractedData as any,
        errorMessage: props.errorMessage,
        llmProvider: props.llmProvider,
        llmModel: props.llmModel,
        llmSchema: props.llmSchema as any,
        llmInstruction: props.llmInstruction,
        cacheKey: props.cacheKey,
        executionTimeMs: props.executionTimeMs,
        metadata: props.metadata as any,
        updatedAt: props.updatedAt,
        completedAt: props.completedAt,
      },
    })

    return this.toDomain(updated)
  }

  /**
   * Update task status directly (optimized for queue worker)
   * 
   * This method provides a lightweight status update without loading
   * the full domain entity, useful for async job processing.
   * 
   * @param taskId - Task UUID to update
   * @param status - New status (PENDING | IN_PROGRESS | COMPLETED | FAILED | CANCELLED)
   * @param errorMessage - Optional: Error message if status is FAILED
   * 
   * @returns Promise resolving when update completes
   * @throws PrismaClientKnownRequestError if task not found
   */
  async updateStatus(
    taskId: string,
    status: CrawlStatus | string,
    errorMessage?: string
  ): Promise<void> {
    const data: any = {
      status,
      updatedAt: new Date(),
    }

    if (errorMessage) {
      data.errorMessage = errorMessage
    }

    // Set completedAt for terminal states
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
      data.completedAt = new Date()
    }

    await this.prisma.crawlTask.update({
      where: { id: taskId },
      data,
    })
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    try {
      await this.prisma.crawlTask.delete({
        where: {
          id,
          organizationId,
        },
      })
      return true
    } catch {
      return false
    }
  }

  async findMany(
    filter: CrawlTaskFilter,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<CrawlTask>> {
    const where: any = {
      organizationId: filter.organizationId,
    }

    if (filter.userId) {
      where.userId = filter.userId
    }

    if (filter.status) {
      where.status = filter.status
    }

    if (filter.url) {
      where.url = {
        contains: filter.url,
        mode: 'insensitive',
      }
    }

    const [tasks, total] = await Promise.all([
      this.prisma.crawlTask.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.crawlTask.count({ where }),
    ])

    return {
      items: tasks.map((t) => this.toDomain(t)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    }
  }

  async findActiveTasks(organizationId: string): Promise<CrawlTask[]> {
    const tasks = await this.prisma.crawlTask.findMany({
      where: {
        organizationId,
        status: {
          in: [CrawlStatus.PENDING, CrawlStatus.IN_PROGRESS],
        },
      },
      orderBy: {
        priority: 'desc',
      },
    })

    return tasks.map((t) => this.toDomain(t))
  }

  async countByStatus(organizationId: string, status: CrawlStatus): Promise<number> {
    return this.prisma.crawlTask.count({
      where: {
        organizationId,
        status,
      },
    })
  }

  async hasActiveCrawlForUrl(url: string, organizationId: string): Promise<boolean> {
    const count = await this.prisma.crawlTask.count({
      where: {
        url,
        organizationId,
        status: {
          in: [CrawlStatus.PENDING, CrawlStatus.IN_PROGRESS],
        },
      },
    })

    return count > 0
  }

  /**
   * Convert Prisma database record to domain entity
   * 
   * @param prismaTask - Prisma CrawlTask record from database
   * @returns Reconstituted CrawlTask domain entity
   * @private
   */
  private toDomain(prismaTask: any): CrawlTask {
    return CrawlTask.reconstitute({
      id: prismaTask.id,
      organizationId: prismaTask.organizationId,
      userId: prismaTask.userId,
      url: prismaTask.url,
      configId: prismaTask.configId,
      status: prismaTask.status as CrawlStatus,
      priority: prismaTask.priority,
      markdownContent: prismaTask.markdownContent,
      extractedData: prismaTask.extractedData,
      errorMessage: prismaTask.errorMessage,
      llmProvider: prismaTask.llmProvider,
      llmModel: prismaTask.llmModel,
      llmSchema: prismaTask.llmSchema,
      llmInstruction: prismaTask.llmInstruction,
      cacheKey: prismaTask.cacheKey,
      executionTimeMs: prismaTask.executionTimeMs,
      metadata: prismaTask.metadata || {},
      createdAt: prismaTask.createdAt,
      updatedAt: prismaTask.updatedAt,
      completedAt: prismaTask.completedAt,
    })
  }
}
