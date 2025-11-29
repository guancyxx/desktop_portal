/**
 * ICrawlConfigRepository - Domain Repository Interface
 * 
 * Defines contract for CrawlConfig persistence operations.
 * Infrastructure layer implements this interface using Prisma.
 */

import { CrawlConfig } from '../models/CrawlConfig'

export interface ICrawlConfigRepository {
  /**
   * Create a new crawl configuration
   */
  create(config: CrawlConfig): Promise<CrawlConfig>

  /**
   * Find config by ID (with tenant verification)
   */
  findById(id: string, organizationId: string): Promise<CrawlConfig | null>

  /**
   * Find default config for an organization
   */
  findDefaultConfig(organizationId: string): Promise<CrawlConfig | null>

  /**
   * Find config by name within an organization
   */
  findByName(name: string, organizationId: string): Promise<CrawlConfig | null>

  /**
   * Find all configs for an organization
   */
  findAllByOrganization(organizationId: string): Promise<CrawlConfig[]>

  /**
   * Update existing config
   */
  update(config: CrawlConfig): Promise<CrawlConfig>

  /**
   * Delete config (only if not set as default and not referenced by tasks)
   */
  delete(id: string, organizationId: string): Promise<boolean>

  /**
   * Set a config as default (unsets other defaults for the org)
   */
  setAsDefault(id: string, organizationId: string): Promise<CrawlConfig>

  /**
   * Check if config name is unique within organization
   */
  isNameUnique(name: string, organizationId: string, excludeId?: string): Promise<boolean>
}
