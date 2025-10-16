/**
 * Application Service - 应用程序领域服务
 * 
 * 负责应用程序相关的业务逻辑
 */
import { ApplicationModel } from '../models/Application'
import { Role } from '@/types'

/**
 * 应用仓储接口
 */
export interface IApplicationRepository {
  findAll(): Promise<ApplicationModel[]>
  findById(id: string): Promise<ApplicationModel | null>
  findByCategory(category: string): Promise<ApplicationModel[]>
  findByStatus(status: string): Promise<ApplicationModel[]>
}

/**
 * 应用程序领域服务
 */
export class ApplicationService {
  constructor(private repository: IApplicationRepository) {}
  
  /**
   * 获取用户可访问的应用列表
   */
  async getAccessibleApplications(userRoles: Role[]): Promise<ApplicationModel[]> {
    const allApps = await this.repository.findAll()
    
    return allApps
      .filter(app => app.canAccessBy(userRoles)) // 权限过滤
      .filter(app => app.isActive())             // 只显示激活的应用
      .sort((a, b) => a.compareOrder(b))         // 按顺序排序
  }
  
  /**
   * 根据类别获取应用
   */
  async getApplicationsByCategory(
    category: string,
    userRoles: Role[]
  ): Promise<ApplicationModel[]> {
    const apps = await this.repository.findByCategory(category)
    
    return apps
      .filter(app => app.canAccessBy(userRoles))
      .filter(app => app.isActive())
      .sort((a, b) => a.compareOrder(b))
  }
  
  /**
   * 验证用户是否可以访问应用
   */
  async validateApplicationAccess(
    appId: string,
    userRoles: Role[]
  ): Promise<{ canAccess: boolean; reason?: string; app?: ApplicationModel }> {
    const app = await this.repository.findById(appId)
    
    if (!app) {
      return {
        canAccess: false,
        reason: '应用不存在'
      }
    }
    
    if (!app.isActive()) {
      return {
        canAccess: false,
        reason: '应用当前不可用',
        app
      }
    }
    
    if (!app.canAccessBy(userRoles)) {
      return {
        canAccess: false,
        reason: '没有访问权限',
        app
      }
    }
    
    return {
      canAccess: true,
      app
    }
  }
  
  /**
   * 获取应用详情
   */
  async getApplicationById(id: string): Promise<ApplicationModel | null> {
    return this.repository.findById(id)
  }
  
  /**
   * 搜索应用
   */
  async searchApplications(
    query: string,
    userRoles: Role[]
  ): Promise<ApplicationModel[]> {
    const allApps = await this.getAccessibleApplications(userRoles)
    const lowerQuery = query.toLowerCase()
    
    return allApps.filter(app =>
      app.name.toLowerCase().includes(lowerQuery) ||
      app.description.toLowerCase().includes(lowerQuery) ||
      app.category.toLowerCase().includes(lowerQuery)
    )
  }
  
  /**
   * 获取应用分类列表
   */
  async getCategories(userRoles: Role[]): Promise<string[]> {
    const apps = await this.getAccessibleApplications(userRoles)
    const categories = new Set(apps.map(app => app.category))
    return Array.from(categories).sort()
  }
  
  /**
   * 获取推荐应用（基于顺序和访问频率）
   */
  async getRecommendedApplications(
    userRoles: Role[],
    limit: number = 6
  ): Promise<ApplicationModel[]> {
    const apps = await this.getAccessibleApplications(userRoles)
    
    // TODO: 可以基于用户使用历史进行推荐
    // 目前基于 order 字段返回前 N 个
    return apps.slice(0, limit)
  }
  
  /**
   * 批量验证应用访问权限
   */
  async validateMultipleAccess(
    appIds: string[],
    userRoles: Role[]
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()
    
    for (const appId of appIds) {
      const { canAccess } = await this.validateApplicationAccess(appId, userRoles)
      results.set(appId, canAccess)
    }
    
    return results
  }
}

