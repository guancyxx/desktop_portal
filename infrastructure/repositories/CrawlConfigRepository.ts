/**
 * CrawlConfigRepository - Infrastructure Layer (Prisma Implementation)
 * 
 * Implements ICrawlConfigRepository using Prisma ORM.
 * Handles tenant-scoped data access for CrawlConfig entity.
 */

import { PrismaClient } from '@prisma/client'
import { CrawlConfig } from '@/domain/models/CrawlConfig'
import { ICrawlConfigRepository } from '@/domain/repositories/ICrawlConfigRepository'

/**
 * CrawlConfigRepository - Prisma Implementation
 * 
 * Implements ICrawlConfigRepository interface using Prisma ORM.
 * Manages crawl configuration persistence with tenant isolation.
 * Handles default config switching with transactional consistency.
 * 
 * @class CrawlConfigRepository
 * @implements {ICrawlConfigRepository}
 */
export class CrawlConfigRepository implements ICrawlConfigRepository {
  /**
   * Creates an instance of CrawlConfigRepository
   * 
   * @param prisma - Prisma client instance for database access
   */
  constructor(private prisma: PrismaClient) {}

  async create(config: CrawlConfig): Promise<CrawlConfig> {
    const props = config.toPlainObject()

    const created = await this.prisma.crawlConfig.create({
      data: {
        id: props.id,
        organizationId: props.organizationId,
        userId: props.userId,
        name: props.name,
        isDefault: props.isDefault,
        browserConfig: props.browserConfig as any,
        crawlerConfig: props.crawlerConfig as any,
        llmProvider: props.llmProvider,
        llmModel: props.llmModel,
        description: props.description,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
    })

    return this.toDomain(created)
  }

  async findById(id: string, organizationId: string): Promise<CrawlConfig | null> {
    const config = await this.prisma.crawlConfig.findFirst({
      where: {
        id,
        organizationId,
      },
    })

    return config ? this.toDomain(config) : null
  }

  async findDefaultConfig(organizationId: string): Promise<CrawlConfig | null> {
    const config = await this.prisma.crawlConfig.findFirst({
      where: {
        organizationId,
        isDefault: true,
      },
    })

    return config ? this.toDomain(config) : null
  }

  async findByName(name: string, organizationId: string): Promise<CrawlConfig | null> {
    const config = await this.prisma.crawlConfig.findFirst({
      where: {
        name,
        organizationId,
      },
    })

    return config ? this.toDomain(config) : null
  }

  async findAllByOrganization(organizationId: string): Promise<CrawlConfig[]> {
    const configs = await this.prisma.crawlConfig.findMany({
      where: {
        organizationId,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })

    return configs.map((c) => this.toDomain(c))
  }

  async update(config: CrawlConfig): Promise<CrawlConfig> {
    const props = config.toPlainObject()

    const updated = await this.prisma.crawlConfig.update({
      where: { id: props.id },
      data: {
        name: props.name,
        isDefault: props.isDefault,
        browserConfig: props.browserConfig as any,
        crawlerConfig: props.crawlerConfig as any,
        llmProvider: props.llmProvider,
        llmModel: props.llmModel,
        description: props.description,
        updatedAt: props.updatedAt,
      },
    })

    return this.toDomain(updated)
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    try {
      await this.prisma.crawlConfig.delete({
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

  /**
   * Set a configuration as the organization's default
   * 
   * Uses database transaction to ensure atomicity:
   * 1. Unsets current default config (if any)
   * 2. Sets specified config as new default
   * 
   * @param id - Configuration UUID to set as default
   * @param organizationId - Tenant identifier for isolation
   * 
   * @returns Promise resolving to updated domain entity
   * @throws PrismaClientKnownRequestError if config not found
   */
  async setAsDefault(id: string, organizationId: string): Promise<CrawlConfig> {
    // Use transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // Unset current default
      await tx.crawlConfig.updateMany({
        where: {
          organizationId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })

      // Set new default
      const updated = await tx.crawlConfig.update({
        where: {
          id,
          organizationId,
        },
        data: {
          isDefault: true,
          updatedAt: new Date(),
        },
      })

      return this.toDomain(updated)
    })
  }

  /**
   * Check if configuration name is unique within organization
   * 
   * @param name - Configuration name to check
   * @param organizationId - Tenant identifier
   * @param excludeId - Optional: Exclude this config ID from check (for updates)
   * 
   * @returns Promise resolving to true if name is unique, false if already exists
   */
  async isNameUnique(name: string, organizationId: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.crawlConfig.count({
      where: {
        name,
        organizationId,
        ...(excludeId && { id: { not: excludeId } }),
      },
    })

    return count === 0
  }

  /**
   * Convert Prisma database record to domain entity
   * 
   * @param prismaConfig - Prisma CrawlConfig record from database
   * @returns Reconstituted CrawlConfig domain entity
   * @private
   */
  private toDomain(prismaConfig: any): CrawlConfig {
    return CrawlConfig.reconstitute({
      id: prismaConfig.id,
      organizationId: prismaConfig.organizationId,
      userId: prismaConfig.userId,
      name: prismaConfig.name,
      isDefault: prismaConfig.isDefault,
      browserConfig: prismaConfig.browserConfig,
      crawlerConfig: prismaConfig.crawlerConfig,
      llmProvider: prismaConfig.llmProvider,
      llmModel: prismaConfig.llmModel,
      description: prismaConfig.description,
      createdAt: prismaConfig.createdAt,
      updatedAt: prismaConfig.updatedAt,
    })
  }
}
