/**
 * CrawlTask Entity - Domain Model
 * 
 * Represents a single web crawling operation within a tenant context.
 * Enforces business rules and validation at the domain level.
 */

export enum CrawlStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface CrawlTaskProps {
  id: string
  organizationId: string
  userId: string
  url: string
  configId?: string | null
  status: CrawlStatus
  priority: number
  markdownContent?: string | null
  extractedData?: Record<string, any> | null
  errorMessage?: string | null
  llmProvider?: string | null
  llmModel?: string | null
  llmSchema?: Record<string, any> | null
  llmInstruction?: string | null
  cacheKey?: string | null
  executionTimeMs?: number | null
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | null
}

export class CrawlTask {
  private constructor(private props: CrawlTaskProps) {
    this.validate()
  }

  static create(props: Omit<CrawlTaskProps, 'id' | 'createdAt' | 'updatedAt'>): CrawlTask {
    return new CrawlTask({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitute(props: CrawlTaskProps): CrawlTask {
    return new CrawlTask(props)
  }

  private validate(): void {
    // URL validation
    if (!this.props.url || this.props.url.length > 2048) {
      throw new Error('URL must be between 1 and 2048 characters')
    }

    try {
      const url = new URL(this.props.url)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('URL must use HTTP or HTTPS protocol')
      }
    } catch {
      throw new Error('Invalid URL format')
    }

    // Priority validation
    if (this.props.priority < 1 || this.props.priority > 10) {
      throw new Error('Priority must be between 1 and 10')
    }

    // Organization ID validation
    if (!this.props.organizationId) {
      throw new Error('organizationId is required for tenant isolation')
    }

    // User ID validation
    if (!this.props.userId) {
      throw new Error('userId is required')
    }

    // Status-specific validations
    if (
      [CrawlStatus.COMPLETED, CrawlStatus.FAILED, CrawlStatus.CANCELLED].includes(this.props.status) &&
      !this.props.completedAt
    ) {
      throw new Error('completedAt is required for COMPLETED, FAILED, or CANCELLED status')
    }

    if (
      [CrawlStatus.PENDING, CrawlStatus.IN_PROGRESS].includes(this.props.status) &&
      this.props.completedAt
    ) {
      throw new Error('completedAt must be null for PENDING or IN_PROGRESS status')
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

  get url(): string {
    return this.props.url
  }

  get status(): CrawlStatus {
    return this.props.status
  }

  get priority(): number {
    return this.props.priority
  }

  get markdownContent(): string | null | undefined {
    return this.props.markdownContent
  }

  get extractedData(): Record<string, any> | null | undefined {
    return this.props.extractedData
  }

  get errorMessage(): string | null | undefined {
    return this.props.errorMessage
  }

  get completedAt(): Date | null | undefined {
    return this.props.completedAt
  }

  get executionTimeMs(): number | null | undefined {
    return this.props.executionTimeMs
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get metadata(): Record<string, any> {
    return this.props.metadata
  }

  // State transition methods
  canTransitionTo(newStatus: CrawlStatus): boolean {
    const transitions: Record<CrawlStatus, CrawlStatus[]> = {
      [CrawlStatus.PENDING]: [CrawlStatus.IN_PROGRESS, CrawlStatus.FAILED, CrawlStatus.CANCELLED],
      [CrawlStatus.IN_PROGRESS]: [CrawlStatus.COMPLETED, CrawlStatus.FAILED, CrawlStatus.CANCELLED],
      [CrawlStatus.COMPLETED]: [], // Terminal state
      [CrawlStatus.FAILED]: [CrawlStatus.PENDING], // Allow retry
      [CrawlStatus.CANCELLED]: [], // Terminal state
    }

    return transitions[this.props.status].includes(newStatus)
  }

  startProcessing(): void {
    if (!this.canTransitionTo(CrawlStatus.IN_PROGRESS)) {
      throw new Error(`Cannot transition from ${this.props.status} to IN_PROGRESS`)
    }

    this.props.status = CrawlStatus.IN_PROGRESS
    this.props.updatedAt = new Date()
  }

  complete(markdownContent: string, extractedData?: Record<string, any>, executionTimeMs?: number): void {
    if (!this.canTransitionTo(CrawlStatus.COMPLETED)) {
      throw new Error(`Cannot transition from ${this.props.status} to COMPLETED`)
    }

    this.props.status = CrawlStatus.COMPLETED
    this.props.markdownContent = markdownContent
    this.props.extractedData = extractedData || null
    this.props.executionTimeMs = executionTimeMs
    this.props.completedAt = new Date()
    this.props.updatedAt = new Date()
  }
  fail(errorMessage: string): void {
    if (!this.canTransitionTo(CrawlStatus.FAILED)) {
      throw new Error(`Cannot transition from ${this.props.status} to FAILED`)
    }

    this.props.status = CrawlStatus.FAILED
    this.props.errorMessage = errorMessage
    this.props.completedAt = new Date()
    this.props.updatedAt = new Date()
  }

  cancel(reason?: string): void {
    if (!this.canTransitionTo(CrawlStatus.CANCELLED)) {
      throw new Error(`Cannot transition from ${this.props.status} to CANCELLED`)
    }

    this.props.status = CrawlStatus.CANCELLED
    this.props.errorMessage = reason || 'Cancelled by user'
    this.props.completedAt = new Date()
    this.props.updatedAt = new Date()
  }

  // Business logic methods
  isCompleted(): boolean {
    return this.props.status === CrawlStatus.COMPLETED
  }

  isFailed(): boolean {
    return this.props.status === CrawlStatus.FAILED
  }

  isCancelled(): boolean {
    return this.props.status === CrawlStatus.CANCELLED
  }

  isActive(): boolean {
    return [CrawlStatus.PENDING, CrawlStatus.IN_PROGRESS].includes(this.props.status)
  }

  isTerminal(): boolean {
    return [CrawlStatus.COMPLETED, CrawlStatus.FAILED, CrawlStatus.CANCELLED].includes(this.props.status)
  }
  // Business logic methods
  isCompleted(): boolean {
    return this.props.status === CrawlStatus.COMPLETED
  }

  isFailed(): boolean {
    return this.props.status === CrawlStatus.FAILED
  }

  isActive(): boolean {
    return [CrawlStatus.PENDING, CrawlStatus.IN_PROGRESS].includes(this.props.status)
  }

  belongsToOrganization(organizationId: string): boolean {
    return this.props.organizationId === organizationId
  }

  toPlainObject(): CrawlTaskProps {
    return { ...this.props }
  }
}
