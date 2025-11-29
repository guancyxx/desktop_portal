/**
 * UpdateCrawlConfig Use Case
 * 
 * Updates an existing crawl configuration.
 * Handles default config switching and name uniqueness.
 */

import { ICrawlConfigRepository } from '@/domain/repositories/ICrawlConfigRepository'

export interface UpdateCrawlConfigInput {
  id: string
  organizationId: string
  name?: string
  description?: string
  browserConfig?: {
    headless?: boolean
    viewport?: { width: number; height: number }
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
    timeout?: number
    userAgent?: string
  }
  crawlerConfig?: {
    maxDepth?: number
    followLinks?: boolean
    respectRobotsTxt?: boolean
    maxPages?: number
    excludePatterns?: string[]
    includePatterns?: string[]
  }
  llmProvider?: string
  llmModel?: string
  isDefault?: boolean
}

export interface UpdateCrawlConfigOutput {
  success: boolean
  error?: string
}

/**
 * UpdateCrawlConfig Use Case
 * 
 * Updates an existing crawl configuration.
 * Handles name uniqueness validation and default config switching.
 * Enforces tenant isolation - users can only update configs in their organization.
 * 
 * @class UpdateCrawlConfig
 */
export class UpdateCrawlConfig {
  /**
   * Creates an instance of UpdateCrawlConfig use case
   * 
   * @param configRepository - Repository for CrawlConfig persistence
   */
  constructor(private configRepository: ICrawlConfigRepository) {}

  /**
   * Update an existing crawl configuration
   * 
   * @param input - Update properties and context
   * @param input.id - Configuration ID to update (UUID)
   * @param input.organizationId - Tenant identifier for isolation
   * @param input.name - Optional: New configuration name (must be unique)
   * @param input.description - Optional: New description
   * @param input.browserConfig - Optional: New browser settings
   * @param input.crawlerConfig - Optional: New crawler settings
   * @param input.llmProvider - Optional: New default LLM provider
   * @param input.llmModel - Optional: New default LLM model
   * @param input.isDefault - Optional: Set/unset as default config
   * 
   * @returns Promise resolving to update result
   * @returns {success: true} - If update succeeds
   * @returns {success: false, error: string} - If config not found, name conflict, or database error
   * 
   * @throws Never throws - all errors are caught and returned in response
   * 
   * @example
   * ```typescript
   * const result = await updateCrawlConfig.execute({
   *   id: 'config-uuid',
   *   organizationId: 'org-123',
   *   name: 'Updated Config Name',
   *   isDefault: true // Sets this as default, unsets previous default
   * });
   * ```
   */
  async execute(input: UpdateCrawlConfigInput): Promise<UpdateCrawlConfigOutput> {
    try {
      // Find existing config
      const config = await this.configRepository.findById(input.id, input.organizationId)

      if (!config) {
        return {
          success: false,
          error: 'Configuration not found',
        }
      }

      // Check name uniqueness if name is being changed
      if (input.name && input.name !== config.name) {
        const existing = await this.configRepository.findByName(
          input.name,
          input.organizationId
        )

        if (existing && existing.id !== input.id) {
          return {
            success: false,
            error: `Configuration with name "${input.name}" already exists`,
          }
        }
      }

      // If setting as default, unset other defaults first
      if (input.isDefault && !config.isDefault) {
        const allConfigs = await this.configRepository.findAllByOrganization(input.organizationId)
        for (const cfg of allConfigs) {
          if (cfg.id !== config.id && cfg.isDefault) {
            cfg.unsetAsDefault()
            await this.configRepository.update(cfg)
          }
        }
      }

      // Update browser config if provided
      if (input.browserConfig) {
        config.updateBrowserConfig(input.browserConfig)
      }

      // Update crawler config if provided
      if (input.crawlerConfig) {
        config.updateCrawlerConfig(input.crawlerConfig)
      }

      // Update LLM settings if provided
      if (input.llmProvider !== undefined || input.llmModel !== undefined) {
        config.updateLLMSettings(input.llmProvider, input.llmModel)
      }

      // Update default flag if provided
      if (input.isDefault !== undefined) {
        if (input.isDefault) {
          config.setAsDefault()
        } else {
          config.unsetAsDefault()
        }
      }

      // Persist changes
      await this.configRepository.update(config)

      return {
        success: true,
      }
    } catch (error) {
      console.error('[UpdateCrawlConfig] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update configuration',
      }
    }
  }
}
