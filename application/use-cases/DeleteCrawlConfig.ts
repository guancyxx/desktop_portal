/**
 * DeleteCrawlConfig Use Case
 * 
 * Deletes a crawl configuration.
 * Prevents deletion of the default config if it's the only one.
 */

import { ICrawlConfigRepository } from '@/domain/repositories/ICrawlConfigRepository'

export interface DeleteCrawlConfigInput {
  id: string
  organizationId: string
}

export interface DeleteCrawlConfigOutput {
  success: boolean
  error?: string
}

/**
 * DeleteCrawlConfig Use Case
 * 
 * Deletes a crawl configuration.
 * Prevents deletion of the only remaining default config to ensure
 * at least one config always exists for crawl submissions.
 * 
 * @class DeleteCrawlConfig
 */
export class DeleteCrawlConfig {
  /**
   * Creates an instance of DeleteCrawlConfig use case
   * 
   * @param configRepository - Repository for CrawlConfig persistence
   */
  constructor(private configRepository: ICrawlConfigRepository) {}

  /**
   * Delete a crawl configuration
   * 
   * @param input - Configuration identifier and context
   * @param input.id - Configuration ID to delete (UUID)
   * @param input.organizationId - Tenant identifier for isolation
   * 
   * @returns Promise resolving to deletion result
   * @returns {success: true} - If deletion succeeds
   * @returns {success: false, error: string} - If config not found, is only config, or database error
   * 
   * @throws Never throws - all errors are caught and returned in response
   * 
   * @example
   * ```typescript
   * const result = await deleteCrawlConfig.execute({
   *   id: 'config-uuid',
   *   organizationId: 'org-123'
   * });
   * 
   * if (result.success) {
   *   console.log('Config deleted successfully');
   * } else {
   *   console.error('Deletion failed:', result.error);
   * }
   * ```
   */
  async execute(input: DeleteCrawlConfigInput): Promise<DeleteCrawlConfigOutput> {
    try {
      // Find the config to delete
      const config = await this.configRepository.findById(input.id, input.organizationId)

      if (!config) {
        return {
          success: false,
          error: 'Configuration not found',
        }
      }

      // Check if this is the default and only config
      if (config.isDefault) {
        const allConfigs = await this.configRepository.findAllByOrganization(input.organizationId)
        
        if (allConfigs.length === 1) {
          return {
            success: false,
            error: 'Cannot delete the only configuration. Please create another one first.',
          }
        }
      }

      // Delete the config
      const deleted = await this.configRepository.delete(input.id, input.organizationId)

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete configuration',
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      console.error('[DeleteCrawlConfig] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete configuration',
      }
    }
  }
}
