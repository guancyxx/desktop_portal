/**
 * Dependency Injection Container
 * 
 * Centralized dependency management for the application.
 */
import { ApplicationService } from '@/domain/services/ApplicationService'
import { WindowManager } from '@/domain/services/WindowManager'
import { ApplicationRepository, ApplicationAPIRepository } from '@/infrastructure/repositories/ApplicationRepository'
import { OpenApplicationUseCase } from './use-cases/OpenApplication'
import { GetApplicationsUseCase } from './use-cases/GetApplications'
import { Application } from '@/types'

// Crawl4AI Integration
import { PrismaClient } from '@prisma/client'
import { CrawlTaskRepository } from '@/infrastructure/repositories/CrawlTaskRepository'
import { CrawlConfigRepository } from '@/infrastructure/repositories/CrawlConfigRepository'
import { Crawl4AIClient } from '@/infrastructure/clients/Crawl4AIClient'
import { OllamaClient } from '@/infrastructure/clients/OllamaClient'
import { SubmitCrawlTask } from './use-cases/SubmitCrawlTask'
import { GetCrawlStatus } from './use-cases/GetCrawlStatus'
import { GetCrawlHistory } from './use-cases/GetCrawlHistory'
import { ExtractWithLLM } from './use-cases/ExtractWithLLM'
import { CreateCrawlConfig } from './use-cases/CreateCrawlConfig'
import { GetCrawlConfigs } from './use-cases/GetCrawlConfigs'
import { UpdateCrawlConfig } from './use-cases/UpdateCrawlConfig'
import { DeleteCrawlConfig } from './use-cases/DeleteCrawlConfig'

/**
 * Service Container
 */
export class ServiceContainer {
  private static instance: ServiceContainer
  
  // Repositories
  private _applicationRepository?: ApplicationRepository | ApplicationAPIRepository
  
  // Services
  private _applicationService?: ApplicationService
  private _windowManager?: WindowManager
  
  // Use Cases
  private _openApplicationUseCase?: OpenApplicationUseCase
  private _getApplicationsUseCase?: GetApplicationsUseCase
  
  // Crawl4AI - Infrastructure
  private _prismaClient?: PrismaClient
  private _crawlTaskRepository?: CrawlTaskRepository
  private _crawlConfigRepository?: CrawlConfigRepository
  private _crawl4aiClient?: Crawl4AIClient
  private _ollamaClient?: OllamaClient
  // Crawl4AI - Use Cases
  private _submitCrawlTask?: SubmitCrawlTask
  private _getCrawlStatus?: GetCrawlStatus
  private _getCrawlHistory?: GetCrawlHistory
  private _extractWithLLM?: ExtractWithLLM
  private _createCrawlConfig?: CreateCrawlConfig
  private _getCrawlConfigs?: GetCrawlConfigs
  private _updateCrawlConfig?: UpdateCrawlConfig
  private _deleteCrawlConfig?: DeleteCrawlConfig
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }
  
  /**
   * Initialize container with config file
   */
  initializeWithConfig(applications: Application[]): void {
    this._applicationRepository = new ApplicationRepository(applications)
    this._applicationService = new ApplicationService(this._applicationRepository)
    this._windowManager = new WindowManager()
    this._openApplicationUseCase = new OpenApplicationUseCase(this._applicationService)
    this._getApplicationsUseCase = new GetApplicationsUseCase(this._applicationService)
  }
  
  /**
   * Initialize container with API
   */
  initializeWithAPI(baseURL?: string): void {
    this._applicationRepository = new ApplicationAPIRepository(baseURL)
    this._applicationService = new ApplicationService(this._applicationRepository)
    this._windowManager = new WindowManager()
    this._openApplicationUseCase = new OpenApplicationUseCase(this._applicationService)
    this._getApplicationsUseCase = new GetApplicationsUseCase(this._applicationService)
  }
  
  /**
   * Get Application Repository
   */
  get applicationRepository(): ApplicationRepository | ApplicationAPIRepository {
    if (!this._applicationRepository) {
      throw new Error('Container not initialized. Call initializeWithConfig() or initializeWithAPI() first.')
    }
    return this._applicationRepository
  }
  
  /**
   * Get Application Service
   */
  get applicationService(): ApplicationService {
    if (!this._applicationService) {
      throw new Error('Container not initialized.')
    }
    return this._applicationService
  }
  
  /**
   * Get Window Manager
   */
  get windowManager(): WindowManager {
    if (!this._windowManager) {
      this._windowManager = new WindowManager()
    }
    return this._windowManager
  }
  
  /**
   * Get Open Application Use Case
   */
  get openApplicationUseCase(): OpenApplicationUseCase {
    if (!this._openApplicationUseCase) {
      throw new Error('Container not initialized.')
    }
    return this._openApplicationUseCase
  }
  
  /**
   * Get Applications Use Case
   */
  get getApplicationsUseCase(): GetApplicationsUseCase {
    if (!this._getApplicationsUseCase) {
      throw new Error('Container not initialized.')
    }
    return this._getApplicationsUseCase
  }
  
  // ===== Crawl4AI Services =====
  
  /**
   * Get Prisma Client
   */
  get prismaClient(): PrismaClient {
    if (!this._prismaClient) {
      this._prismaClient = new PrismaClient()
    }
    return this._prismaClient
  }
  
  /**
   * Get CrawlTask Repository
   */
  get crawlTaskRepository(): CrawlTaskRepository {
    if (!this._crawlTaskRepository) {
      this._crawlTaskRepository = new CrawlTaskRepository(this.prismaClient)
    }
    return this._crawlTaskRepository
  }
  
  /**
   * Get CrawlConfig Repository
   */
  get crawlConfigRepository(): CrawlConfigRepository {
    if (!this._crawlConfigRepository) {
      this._crawlConfigRepository = new CrawlConfigRepository(this.prismaClient)
    }
    return this._crawlConfigRepository
  }
  
  /**
   * Get Crawl4AI Client
   */
  get crawl4aiClient(): Crawl4AIClient {
    if (!this._crawl4aiClient) {
      this._crawl4aiClient = new Crawl4AIClient()
    }
    return this._crawl4aiClient
  }
  
  /**
   * Get Ollama Client
   */
  get ollamaClient(): OllamaClient {
    if (!this._ollamaClient) {
      this._ollamaClient = new OllamaClient()
    }
    return this._ollamaClient
  }
  
  /**
   * Get SubmitCrawlTask Use Case
   */
  get submitCrawlTask(): SubmitCrawlTask {
    if (!this._submitCrawlTask) {
      this._submitCrawlTask = new SubmitCrawlTask(
        this.crawlTaskRepository,
        this.crawlConfigRepository,
        this.crawl4aiClient,
        this.prismaClient
      )
    }
    return this._submitCrawlTask
  }
  
  /**
   * Get GetCrawlStatus Use Case
   */
  get getCrawlStatus(): GetCrawlStatus {
    if (!this._getCrawlStatus) {
      this._getCrawlStatus = new GetCrawlStatus(this.crawlTaskRepository)
    }
    return this._getCrawlStatus
  }
  
  /**
   * Get GetCrawlHistory Use Case
   */
  get getCrawlHistory(): GetCrawlHistory {
    if (!this._getCrawlHistory) {
      this._getCrawlHistory = new GetCrawlHistory(this.crawlTaskRepository)
    }
    return this._getCrawlHistory
  }
  
  /**
   * Get ExtractWithLLM Use Case
   */
  get extractWithLLM(): ExtractWithLLM {
    if (!this._extractWithLLM) {
      this._extractWithLLM = new ExtractWithLLM(
        this.crawl4aiClient,
        this.ollamaClient
      )
    }
    return this._extractWithLLM
  }
  
  /**
   * Get CreateCrawlConfig Use Case
   */
  get createCrawlConfig(): CreateCrawlConfig {
    if (!this._createCrawlConfig) {
      this._createCrawlConfig = new CreateCrawlConfig(this.crawlConfigRepository)
    }
    return this._createCrawlConfig
  }
  
  /**
   * Get GetCrawlConfigs Use Case
   */
  get getCrawlConfigs(): GetCrawlConfigs {
    if (!this._getCrawlConfigs) {
      this._getCrawlConfigs = new GetCrawlConfigs(this.crawlConfigRepository)
    }
    return this._getCrawlConfigs
  }
  
  /**
   * Get UpdateCrawlConfig Use Case
   */
  get updateCrawlConfig(): UpdateCrawlConfig {
    if (!this._updateCrawlConfig) {
      this._updateCrawlConfig = new UpdateCrawlConfig(this.crawlConfigRepository)
    }
    return this._updateCrawlConfig
  }
  
  /**
   * Get DeleteCrawlConfig Use Case
   */
  get deleteCrawlConfig(): DeleteCrawlConfig {
    if (!this._deleteCrawlConfig) {
      this._deleteCrawlConfig = new DeleteCrawlConfig(this.crawlConfigRepository)
    }
    return this._deleteCrawlConfig
  }
  
  /**
   * Reset container (mainly for testing)
   */
  reset(): void {
    this._applicationRepository = undefined
    this._applicationService = undefined
    this._windowManager = undefined
    this._openApplicationUseCase = undefined
    this._getApplicationsUseCase = undefined
    
    // Crawl4AI cleanup
    this._crawlTaskRepository = undefined
    this._crawlConfigRepository = undefined
    this._crawl4aiClient = undefined
    this._ollamaClient = undefined
    this._submitCrawlTask = undefined
    this._getCrawlStatus = undefined
    this._getCrawlHistory = undefined
    this._extractWithLLM = undefined
    
    if (this._prismaClient) {
      this._prismaClient.$disconnect()
      this._prismaClient = undefined
    }
  }
}

/**
 * Export container instance
 */
export const container = ServiceContainer.getInstance()

