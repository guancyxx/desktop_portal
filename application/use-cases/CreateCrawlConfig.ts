/**
 * CreateCrawlConfig Use Case
 * 
 * Creates a new crawl configuration for a tenant.
 * Ensures unique names and handles default config logic.
 */

import { CrawlConfig } from '@/domain/models/CrawlConfig'
import { ICrawlConfigRepository } from '@/domain/repositories/ICrawlConfigRepository'

export interface CreateCrawlConfigInput {
  organizationId: string
  userId: string
  name: string
  description?: string
  browserConfig: {
    headless?: boolean
    viewport?: { width: number; height: number }
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
    timeout?: number
    userAgent?: string
  }
  crawlerConfig: {
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

export interface CreateCrawlConfigOutput {
  success: boolean
  config?: CrawlConfig
  error?: string
}

/**
 * CreateCrawlConfig Use Case
 * 
 * Creates a new crawl configuration for a tenant.
 * Handles name uniqueness validation and default config management.
 * If setting as default, automatically unsets previous default.
 * 
 * @class CreateCrawlConfig
 */
export class CreateCrawlConfig {
  /**
   * Creates an instance of CreateCrawlConfig use case
   * 
   * @param configRepository - Repository for CrawlConfig persistence
   */
  constructor(private configRepository: ICrawlConfigRepository) {}

  /**
   * Create a new crawl configuration
   * 
   * @param input - Configuration properties and context
   * @param input.organizationId - Tenant identifier
   * @param input.userId - User creating the configuration
   * @param input.name - Configuration name (must be unique within organization)
   * @param input.description - Optional: Configuration description
   * @param input.browserConfig - Browser settings (headless mode, viewport, timeout, etc.)
   * @param input.crawlerConfig - Crawler settings (max depth, follow links, robots.txt, etc.)
   * @param input.llmProvider - Optional: Default LLM provider (e.g., 'ollama')
   * @param input.llmModel - Optional: Default LLM model (e.g., 'qwen3-coder:30b')
   * @param input.isDefault - Optional: Set as organization's default config (default: false)
   * 
   * @returns Promise resolving to creation result
   * @returns {success: true, config: CrawlConfig} - If creation succeeds
   * @returns {success: false, error: string} - If name already exists or database error
   * 
   * @throws Never throws - all errors are caught and returned in response
   * 
   * @example
   * ```typescript
   * const result = await createCrawlConfig.execute({
   *   organizationId: 'org-123',
   *   userId: 'user-456',
   *   name: 'Fast Mobile Crawl',
   *   browserConfig: {
   *     headless: true,
   *     viewport: { width: 375, height: 667 },
   *     timeout: 10000
   *   },
   *   crawlerConfig: {
   *     maxDepth: 1,
   *     respectRobotsTxt: true
   *   },
   *   isDefault: true
   * });
   * ```
   */
  async execute(input: CreateCrawlConfigInput): Promise<CreateCrawlConfigOutput> {
    try {
      // Check for duplicate name
      const existing = await this.configRepository.findByName(
        input.name,
        input.organizationId
      )

      if (existing) {
        return {
          success: false,
          error: `Configuration with name "${input.name}" already exists`,
        }
      }

      // If setting as default, unset other defaults first
      if (input.isDefault) {
        const allConfigs = await this.configRepository.findAllByOrganization(input.organizationId)
        for (const cfg of allConfigs) {
          if (cfg.isDefault) {
            cfg.unsetAsDefault()
            await this.configRepository.update(cfg)
          }
        }
      }

      // Create the config entity
      const config = CrawlConfig.create({
        organizationId: input.organizationId,
        userId: input.userId,
        name: input.name,
        description: input.description || null,
        browserConfig: input.browserConfig,
        crawlerConfig: input.crawlerConfig,
        llmProvider: input.llmProvider || null,
        llmModel: input.llmModel || null,
        isDefault: input.isDefault || false,
      })

      // Persist to database
      const created = await this.configRepository.create(config)

      return {
        success: true,
        config: created,
      }
    } catch (error) {
      console.error('[CreateCrawlConfig] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create configuration',
      }
    }
  }
}
