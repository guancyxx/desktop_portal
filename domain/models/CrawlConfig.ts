/**
 * CrawlConfig Entity - Domain Model
 * 
 * Represents a reusable crawling configuration for a tenant.
 * Stores browser settings, crawler parameters, and LLM defaults.
 */

export interface BrowserConfig {
  headless?: boolean
  viewport?: {
    width: number
    height: number
  }
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
  timeout?: number
  userAgent?: string
}

export interface CrawlerConfig {
  maxDepth?: number
  followLinks?: boolean
  respectRobotsTxt?: boolean
  maxPages?: number
  excludePatterns?: string[]
  includePatterns?: string[]
}

export interface CrawlConfigProps {
  id: string
  organizationId: string
  userId: string
  name: string
  isDefault: boolean
  browserConfig: BrowserConfig
  crawlerConfig: CrawlerConfig
  llmProvider?: string | null
  llmModel?: string | null
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

export class CrawlConfig {
  private constructor(private props: CrawlConfigProps) {
    this.validate()
  }

  static create(props: Omit<CrawlConfigProps, 'id' | 'createdAt' | 'updatedAt'>): CrawlConfig {
    return new CrawlConfig({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitute(props: CrawlConfigProps): CrawlConfig {
    return new CrawlConfig(props)
  }

  private validate(): void {
    // Name validation
    if (!this.props.name || this.props.name.length > 100) {
      throw new Error('Config name must be between 1 and 100 characters')
    }

    // Organization ID validation
    if (!this.props.organizationId) {
      throw new Error('organizationId is required for tenant isolation')
    }

    // User ID validation
    if (!this.props.userId) {
      throw new Error('userId is required')
    }

    // Browser config validation
    if (this.props.browserConfig.viewport) {
      const { width, height } = this.props.browserConfig.viewport
      if (width < 320 || width > 3840 || height < 240 || height > 2160) {
        throw new Error('Viewport dimensions must be within reasonable bounds')
      }
    }

    if (this.props.browserConfig.timeout && this.props.browserConfig.timeout < 1000) {
      throw new Error('Browser timeout must be at least 1000ms')
    }

    // Crawler config validation
    if (this.props.crawlerConfig.maxDepth && this.props.crawlerConfig.maxDepth < 1) {
      throw new Error('maxDepth must be at least 1')
    }

    if (this.props.crawlerConfig.maxPages && this.props.crawlerConfig.maxPages < 1) {
      throw new Error('maxPages must be at least 1')
    }
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get organizationId(): string {
    return this.props.organizationId
  }

  get userId(): string {
    return this.props.userId
  }

  get name(): string {
    return this.props.name
  }

  get isDefault(): boolean {
    return this.props.isDefault
  }

  get browserConfig(): BrowserConfig {
    return this.props.browserConfig
  }

  get crawlerConfig(): CrawlerConfig {
    return this.props.crawlerConfig
  }

  get llmProvider(): string | null | undefined {
    return this.props.llmProvider
  }

  get llmModel(): string | null | undefined {
    return this.props.llmModel
  }

  get description(): string | null | undefined {
    return this.props.description
  }

  // Business logic methods
  belongsToOrganization(organizationId: string): boolean {
    return this.props.organizationId === organizationId
  }

  setAsDefault(): void {
    this.props.isDefault = true
    this.props.updatedAt = new Date()
  }

  unsetAsDefault(): void {
    this.props.isDefault = false
    this.props.updatedAt = new Date()
  }

  updateBrowserConfig(config: Partial<BrowserConfig>): void {
    this.props.browserConfig = {
      ...this.props.browserConfig,
      ...config,
    }
    this.props.updatedAt = new Date()
    this.validate()
  }

  updateCrawlerConfig(config: Partial<CrawlerConfig>): void {
    this.props.crawlerConfig = {
      ...this.props.crawlerConfig,
      ...config,
    }
    this.props.updatedAt = new Date()
    this.validate()
  }

  updateLLMSettings(provider?: string, model?: string): void {
    this.props.llmProvider = provider || null
    this.props.llmModel = model || null
    this.props.updatedAt = new Date()
  }

  toPlainObject(): CrawlConfigProps {
    return { ...this.props }
  }
}
