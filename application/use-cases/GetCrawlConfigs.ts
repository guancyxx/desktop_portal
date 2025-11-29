/**
 * GetCrawlConfigs Use Case
 * 
 * Retrieves all crawl configurations for a tenant.
 */

import { CrawlConfig } from '@/domain/models/CrawlConfig'
import { ICrawlConfigRepository } from '@/domain/repositories/ICrawlConfigRepository'

export interface GetCrawlConfigsInput {
  organizationId: string
}

export interface GetCrawlConfigsOutput {
  success: boolean
  configs?: CrawlConfig[]
  error?: string
}

/**
 * GetCrawlConfigs Use Case
 * 
 * Retrieves all crawl configurations for a tenant.
 * Results are sorted with default config first, then alphabetically by name.
 * 
 * @class GetCrawlConfigs
 */
export class GetCrawlConfigs {
  /**
   * Creates an instance of GetCrawlConfigs use case
   * 
   * @param configRepository - Repository for CrawlConfig data access
   */
  constructor(private configRepository: ICrawlConfigRepository) {}

  /**
   * Retrieve all configurations for a tenant
   * 
   * @param input - Organization context
   * @param input.organizationId - Tenant identifier
   * 
   * @returns Promise resolving to configuration list
   * @returns {success: true, configs: CrawlConfig[]} - If query succeeds (empty array if none exist)
   * @returns {success: false, error: string} - If database error occurs
   * 
   * @throws Never throws - all errors are caught and returned in response
   * 
   * @example
   * ```typescript
   * const result = await getCrawlConfigs.execute({
   *   organizationId: 'org-123'
   * });
   * 
   * if (result.success) {
   *   const defaultConfig = result.configs.find(c => c.isDefault);
   *   console.log('Default config:', defaultConfig?.name);
   * }
   * ```
   */
  async execute(input: GetCrawlConfigsInput): Promise<GetCrawlConfigsOutput> {
    try {
      const configs = await this.configRepository.findAllByOrganization(input.organizationId)

      return {
        success: true,
        configs,
      }
    } catch (error) {
      console.error('[GetCrawlConfigs] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve configurations',
      }
    }
  }
}
