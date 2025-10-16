/**
 * Dependency Injection Container - 依赖注入容器
 * 
 * 集中管理应用的依赖关系
 */
import { ApplicationService } from '@/domain/services/ApplicationService'
import { WindowManager } from '@/domain/services/WindowManager'
import { ApplicationRepository, ApplicationAPIRepository } from '@/infrastructure/repositories/ApplicationRepository'
import { OpenApplicationUseCase } from './use-cases/OpenApplication'
import { GetApplicationsUseCase } from './use-cases/GetApplications'
import { Application } from '@/types'

/**
 * 服务容器
 */
export class ServiceContainer {
  private static instance: ServiceContainer
  
  // 仓储
  private _applicationRepository?: ApplicationRepository | ApplicationAPIRepository
  
  // 服务
  private _applicationService?: ApplicationService
  private _windowManager?: WindowManager
  
  // 用例
  private _openApplicationUseCase?: OpenApplicationUseCase
  private _getApplicationsUseCase?: GetApplicationsUseCase
  
  private constructor() {}
  
  /**
   * 获取单例实例
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }
  
  /**
   * 初始化容器（使用配置文件）
   */
  initializeWithConfig(applications: Application[]): void {
    this._applicationRepository = new ApplicationRepository(applications)
    this._applicationService = new ApplicationService(this._applicationRepository)
    this._windowManager = new WindowManager()
    this._openApplicationUseCase = new OpenApplicationUseCase(this._applicationService)
    this._getApplicationsUseCase = new GetApplicationsUseCase(this._applicationService)
  }
  
  /**
   * 初始化容器（使用 API）
   */
  initializeWithAPI(baseURL?: string): void {
    this._applicationRepository = new ApplicationAPIRepository(baseURL)
    this._applicationService = new ApplicationService(this._applicationRepository)
    this._windowManager = new WindowManager()
    this._openApplicationUseCase = new OpenApplicationUseCase(this._applicationService)
    this._getApplicationsUseCase = new GetApplicationsUseCase(this._applicationService)
  }
  
  /**
   * 获取 Application Repository
   */
  get applicationRepository(): ApplicationRepository | ApplicationAPIRepository {
    if (!this._applicationRepository) {
      throw new Error('Container not initialized. Call initializeWithConfig() or initializeWithAPI() first.')
    }
    return this._applicationRepository
  }
  
  /**
   * 获取 Application Service
   */
  get applicationService(): ApplicationService {
    if (!this._applicationService) {
      throw new Error('Container not initialized.')
    }
    return this._applicationService
  }
  
  /**
   * 获取 Window Manager
   */
  get windowManager(): WindowManager {
    if (!this._windowManager) {
      this._windowManager = new WindowManager()
    }
    return this._windowManager
  }
  
  /**
   * 获取 Open Application Use Case
   */
  get openApplicationUseCase(): OpenApplicationUseCase {
    if (!this._openApplicationUseCase) {
      throw new Error('Container not initialized.')
    }
    return this._openApplicationUseCase
  }
  
  /**
   * 获取 Get Applications Use Case
   */
  get getApplicationsUseCase(): GetApplicationsUseCase {
    if (!this._getApplicationsUseCase) {
      throw new Error('Container not initialized.')
    }
    return this._getApplicationsUseCase
  }
  
  /**
   * 重置容器（主要用于测试）
   */
  reset(): void {
    this._applicationRepository = undefined
    this._applicationService = undefined
    this._windowManager = undefined
    this._openApplicationUseCase = undefined
    this._getApplicationsUseCase = undefined
  }
}

/**
 * 导出容器实例
 */
export const container = ServiceContainer.getInstance()

