/**
 * Application Domain Model - 应用程序领域模型
 * 
 * 领域模型包含业务逻辑和规则
 */
import { Application as ApplicationDTO, Role, ApplicationStatus, WindowMode } from '@/types'

/**
 * 应用程序领域模型类
 */
export class ApplicationModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly icon: string,
    public readonly url: string,
    public readonly category: string,
    public readonly roles: readonly Role[],
    public readonly status: ApplicationStatus,
    public readonly color: string,
    public readonly order: number,
    public readonly windowMode: WindowMode
  ) {}
  
  /**
   * 从 DTO 创建领域模型
   */
  static fromDTO(dto: ApplicationDTO): ApplicationModel {
    return new ApplicationModel(
      dto.id,
      dto.name,
      dto.description,
      dto.icon,
      dto.url,
      dto.category,
      dto.roles,
      dto.status,
      dto.color,
      dto.order,
      dto.windowMode
    )
  }
  
  /**
   * 转换为 DTO
   */
  toDTO(): ApplicationDTO {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      icon: this.icon,
      url: this.url,
      category: this.category,
      roles: this.roles,
      status: this.status,
      color: this.color,
      order: this.order,
      windowMode: this.windowMode
    }
  }
  
  /**
   * 检查用户是否有权限访问
   */
  canAccessBy(userRoles: Role[]): boolean {
    // 如果应用没有角色限制，所有人都可以访问
    if (this.roles.length === 0) {
      return true
    }
    
    // 检查用户是否有任一所需角色
    return this.roles.some(role => userRoles.includes(role))
  }
  
  /**
   * 检查应用是否激活
   */
  isActive(): boolean {
    return this.status === 'active'
  }
  
  /**
   * 检查应用是否即将推出
   */
  isComingSoon(): boolean {
    return this.status === 'coming-soon'
  }
  
  /**
   * 检查应用是否维护中
   */
  isMaintenance(): boolean {
    return this.status === 'maintenance'
  }
  
  /**
   * 检查是否为内部链接
   */
  isInternalURL(): boolean {
    return this.url.startsWith('/')
  }
  
  /**
   * 检查是否为外部链接
   */
  isExternalURL(): boolean {
    return this.url.startsWith('http://') || this.url.startsWith('https://')
  }
  
  /**
   * 获取完整的 URL（用于 iframe）
   */
  getFullURL(origin: string): string {
    if (this.isExternalURL()) {
      return this.url
    }
    
    if (this.isInternalURL()) {
      return `${origin}${this.url}`
    }
    
    return this.url
  }
  
  /**
   * 检查是否应该在新标签页打开
   */
  shouldOpenInNewTab(): boolean {
    return this.windowMode === 'tab'
  }
  
  /**
   * 检查是否应该在窗口中打开
   */
  shouldOpenInWindow(): boolean {
    return this.windowMode === 'window' || (this.windowMode === 'auto' && this.isExternalURL())
  }
  
  /**
   * 验证应用数据
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!this.id || this.id.trim() === '') {
      errors.push('应用 ID 不能为空')
    }
    
    if (!this.name || this.name.trim() === '') {
      errors.push('应用名称不能为空')
    }
    
    if (!this.url || this.url.trim() === '') {
      errors.push('应用 URL 不能为空')
    }
    
    // 验证 URL 格式
    if (this.url && !this.isInternalURL() && !this.isExternalURL()) {
      errors.push('应用 URL 格式无效')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * 比较两个应用的顺序
   */
  compareOrder(other: ApplicationModel): number {
    return this.order - other.order
  }
}

