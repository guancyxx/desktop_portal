/**
 * Application Repository - 应用程序仓储实现
 * 
 * 负责应用数据的持久化和获取
 */
import { ApplicationModel } from '@/domain/models/Application'
import { IApplicationRepository } from '@/domain/services/ApplicationService'
import { Application } from '@/types'

/**
 * 应用程序仓储实现（基于配置文件）
 */
export class ApplicationRepository implements IApplicationRepository {
  private applications: ApplicationModel[]
  
  constructor(applications: Application[]) {
    // 将 DTO 转换为领域模型
    this.applications = applications.map(app => ApplicationModel.fromDTO(app))
  }
  
  /**
   * 获取所有应用
   */
  async findAll(): Promise<ApplicationModel[]> {
    return [...this.applications]
  }
  
  /**
   * 根据 ID 查找应用
   */
  async findById(id: string): Promise<ApplicationModel | null> {
    const app = this.applications.find(app => app.id === id)
    return app || null
  }
  
  /**
   * 根据类别查找应用
   */
  async findByCategory(category: string): Promise<ApplicationModel[]> {
    return this.applications.filter(app => app.category === category)
  }
  
  /**
   * 根据状态查找应用
   */
  async findByStatus(status: string): Promise<ApplicationModel[]> {
    return this.applications.filter(app => app.status === status)
  }
}

/**
 * 应用程序仓储实现（基于 API）
 */
export class ApplicationAPIRepository implements IApplicationRepository {
  private baseURL: string
  private cache: Map<string, ApplicationModel>
  private cacheExpiry: number = 5 * 60 * 1000 // 5分钟
  private lastFetchTime: number = 0
  
  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
    this.cache = new Map()
  }
  
  /**
   * 检查缓存是否过期
   */
  private isCacheExpired(): boolean {
    return Date.now() - this.lastFetchTime > this.cacheExpiry
  }
  
  /**
   * 从 API 获取应用列表
   */
  private async fetchApplications(): Promise<ApplicationModel[]> {
    const response = await fetch(`${this.baseURL}/applications`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.statusText}`)
    }
    
    const data = await response.json()
    const applications = data.applications || []
    
    // 转换为领域模型并缓存
    const models = applications.map((app: Application) => ApplicationModel.fromDTO(app))
    
    this.cache.clear()
    models.forEach(model => this.cache.set(model.id, model))
    this.lastFetchTime = Date.now()
    
    return models
  }
  
  /**
   * 获取所有应用
   */
  async findAll(): Promise<ApplicationModel[]> {
    if (this.cache.size === 0 || this.isCacheExpired()) {
      return this.fetchApplications()
    }
    
    return Array.from(this.cache.values())
  }
  
  /**
   * 根据 ID 查找应用
   */
  async findById(id: string): Promise<ApplicationModel | null> {
    // 如果缓存中有，直接返回
    if (this.cache.has(id) && !this.isCacheExpired()) {
      return this.cache.get(id) || null
    }
    
    // 否则尝试从 API 获取
    try {
      const response = await fetch(`${this.baseURL}/applications/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to fetch application: ${response.statusText}`)
      }
      
      const data: Application = await response.json()
      const model = ApplicationModel.fromDTO(data)
      
      // 更新缓存
      this.cache.set(id, model)
      
      return model
    } catch (error) {
      console.error('Error fetching application:', error)
      return null
    }
  }
  
  /**
   * 根据类别查找应用
   */
  async findByCategory(category: string): Promise<ApplicationModel[]> {
    const allApps = await this.findAll()
    return allApps.filter(app => app.category === category)
  }
  
  /**
   * 根据状态查找应用
   */
  async findByStatus(status: string): Promise<ApplicationModel[]> {
    const allApps = await this.findAll()
    return allApps.filter(app => app.status === status)
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
    this.lastFetchTime = 0
  }
  
  /**
   * 设置缓存过期时间
   */
  setCacheExpiry(milliseconds: number): void {
    this.cacheExpiry = milliseconds
  }
}

/**
 * 创建仓储工厂函数
 */
export function createApplicationRepository(
  source: 'config' | 'api',
  data?: Application[]
): IApplicationRepository {
  if (source === 'config' && data) {
    return new ApplicationRepository(data)
  }
  
  return new ApplicationAPIRepository()
}

