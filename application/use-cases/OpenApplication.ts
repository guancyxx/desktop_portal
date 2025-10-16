/**
 * Open Application Use Case - 打开应用用例
 * 
 * 协调领域服务和仓储，实现打开应用的业务流程
 */
import { ApplicationService } from '@/domain/services/ApplicationService'
import { Role } from '@/types'
import { UnauthorizedError, NotFoundError } from '@/lib/errors/app-error'

export interface OpenApplicationRequest {
  appId: string
  userRoles: Role[]
}

export interface OpenApplicationResponse {
  success: boolean
  url?: string
  openInNewTab: boolean
  error?: string
}

/**
 * 打开应用用例
 */
export class OpenApplicationUseCase {
  constructor(private applicationService: ApplicationService) {}
  
  async execute(request: OpenApplicationRequest): Promise<OpenApplicationResponse> {
    const { appId, userRoles } = request
    
    try {
      // 1. 验证权限
      const validation = await this.applicationService.validateApplicationAccess(
        appId,
        userRoles
      )
      
      if (!validation.canAccess) {
        if (!validation.app) {
          throw new NotFoundError('应用')
        }
        
        throw new UnauthorizedError(validation.reason || '无权限访问此应用')
      }
      
      const app = validation.app!
      
      // 2. 检查应用状态
      if (!app.isActive()) {
        return {
          success: false,
          openInNewTab: false,
          error: '应用当前不可用'
        }
      }
      
      // 3. 返回应用信息
      return {
        success: true,
        url: app.url,
        openInNewTab: app.shouldOpenInNewTab()
      }
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
        throw error
      }
      
      return {
        success: false,
        openInNewTab: false,
        error: error instanceof Error ? error.message : '打开应用失败'
      }
    }
  }
}

