/**
 * Applications API - 应用程序数据访问层
 * 
 * 负责：
 * - 获取应用列表
 * - 获取单个应用详情
 * - 更新应用状态
 */
import { Application, Role } from '@/types'

export interface ApplicationsResponse {
  applications: Application[]
  categories: string[]
  total: number
}

export interface ApplicationsQueryParams {
  roles?: Role[]
  category?: string
  status?: string
}

/**
 * Applications API 客户端
 */
export class ApplicationsAPI {
  private baseURL: string
  
  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }
  
  /**
   * 获取应用列表（带权限过滤）
   */
  async getApplications(params?: ApplicationsQueryParams): Promise<ApplicationsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.roles) {
      searchParams.set('roles', params.roles.join(','))
    }
    if (params?.category) {
      searchParams.set('category', params.category)
    }
    if (params?.status) {
      searchParams.set('status', params.status)
    }
    
    const url = `${this.baseURL}/applications${searchParams.toString() ? `?${searchParams}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 } // 5分钟缓存
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  /**
   * 根据ID获取应用详情
   */
  async getApplicationById(id: string): Promise<Application> {
    const response = await fetch(`${this.baseURL}/applications/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Application not found: ${id}`)
      }
      throw new Error(`Failed to fetch application: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  /**
   * 更新应用状态
   */
  async updateApplicationStatus(
    id: string,
    status: 'active' | 'inactive' | 'maintenance'
  ): Promise<void> {
    const response = await fetch(`${this.baseURL}/applications/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update application status: ${response.statusText}`)
    }
  }
}

// 单例实例
export const applicationsAPI = new ApplicationsAPI()

