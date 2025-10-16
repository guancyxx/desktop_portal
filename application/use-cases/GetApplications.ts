/**
 * Get Applications Use Case - 获取应用列表用例
 */
import { ApplicationService } from '@/domain/services/ApplicationService'
import { ApplicationModel } from '@/domain/models/Application'
import { Role } from '@/types'

export interface GetApplicationsRequest {
  userRoles: Role[]
  category?: string
  searchQuery?: string
}

export interface GetApplicationsResponse {
  applications: ApplicationModel[]
  categories: string[]
  total: number
}

/**
 * 获取应用列表用例
 */
export class GetApplicationsUseCase {
  constructor(private applicationService: ApplicationService) {}
  
  async execute(request: GetApplicationsRequest): Promise<GetApplicationsResponse> {
    const { userRoles, category, searchQuery } = request
    
    try {
      let applications: ApplicationModel[]
      
      // 根据不同条件获取应用
      if (searchQuery) {
        // 搜索模式
        applications = await this.applicationService.searchApplications(
          searchQuery,
          userRoles
        )
      } else if (category) {
        // 按类别过滤
        applications = await this.applicationService.getApplicationsByCategory(
          category,
          userRoles
        )
      } else {
        // 获取所有可访问的应用
        applications = await this.applicationService.getAccessibleApplications(userRoles)
      }
      
      // 获取所有类别
      const categories = await this.applicationService.getCategories(userRoles)
      
      return {
        applications,
        categories,
        total: applications.length
      }
    } catch (error) {
      console.error('Failed to get applications:', error)
      
      // 返回空结果而不是抛出错误
      return {
        applications: [],
        categories: [],
        total: 0
      }
    }
  }
}

