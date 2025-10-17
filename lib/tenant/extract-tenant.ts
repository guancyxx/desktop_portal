/**
 * 租户信息提取模块
 * 从 JWT Token 中自动识别用户所属租户
 */

export interface TenantInfo {
  tenantId: string
  tenantName: string
  tenantRealm: string
  isAdmin: boolean
  isDefault: boolean
  groups: string[]
}

/**
 * 从 Token 中提取租户信息
 * 
 * @param token - JWT Token payload
 * @returns 租户信息
 */
export function extractTenantFromToken(token: any): TenantInfo {
  // 优先使用 realmName 信息（多 Realm 架构）
  if (token.realmName) {
    const realmName = token.realmName
    const isAdmin = token.roles?.includes('admin') || token.roles?.includes('realm-admin') || false
    
    console.log('识别到 Realm 租户:', { tenantId: realmName, tenantName: realmName, tenantRealm: realmName, isAdmin })
    
    return {
      tenantId: realmName,
      tenantName: realmName,
      tenantRealm: realmName,
      isAdmin,
      isDefault: realmName === 'Dreambuilder',
      groups: token.groups || [],
    }
  }
  
  // 兼容旧的 groups 方式
  const groups = token.groups || []
  
  // 查找租户组（以 /tenants/ 开头）
  const tenantGroups = groups.filter((g: string) => g.startsWith('/tenants/'))
  
  // 如果没有租户组，使用默认租户
  if (tenantGroups.length === 0) {
    console.log('未找到租户组，使用默认租户')
    return {
      tenantId: 'Dreambuilder',
      tenantName: 'Dreambuilder',
      tenantRealm: 'Dreambuilder',
      isAdmin: false,
      isDefault: true,
      groups: [],
    }
  }
  
  // 提取第一个租户组的信息
  const tenantPath = tenantGroups[0]
  const pathParts = tenantPath.split('/')
  
  if (pathParts.length < 3) {
    console.warn('租户组路径格式不正确:', tenantPath)
    return {
      tenantId: 'Dreambuilder',
      tenantName: 'Dreambuilder',
      tenantRealm: 'Dreambuilder',
      isAdmin: false,
      isDefault: true,
      groups: [],
    }
  }
  
  const tenantId = pathParts[2] // /tenants/acme-corp -> acme-corp
  
  // 检查是否是租户管理员
  const isAdmin = groups.some((g: string) => 
    g.includes(`/tenants/${tenantId}/admins`)
  )
  
  // 提取租户名称（如果 token 中有）
  const tenantName = token.tenant_name || formatTenantName(tenantId)
  
  console.log('识别到租户:', { tenantId, tenantName, isAdmin })
  
  return {
    tenantId,
    tenantName,
    tenantRealm: tenantId,
    isAdmin,
    isDefault: false,
    groups: tenantGroups,
  }
}

/**
 * 格式化租户 ID 为显示名称
 * 
 * @param tenantId - 租户 ID (例如: acme-corp)
 * @returns 格式化的名称 (例如: Acme Corp)
 */
function formatTenantName(tenantId: string): string {
  return tenantId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * 验证租户信息是否有效
 * 
 * @param tenant - 租户信息
 * @returns 是否有效
 */
export function isValidTenant(tenant: TenantInfo | null | undefined): boolean {
  return !!tenant && !!tenant.tenantId
}

/**
 * 检查用户是否属于特定租户
 * 
 * @param tenant - 租户信息
 * @param targetTenantId - 目标租户 ID
 * @returns 是否属于该租户
 */
export function belongsToTenant(tenant: TenantInfo, targetTenantId: string): boolean {
  return tenant.tenantId === targetTenantId
}

/**
 * 检查用户是否有管理员权限
 * 
 * @param tenant - 租户信息
 * @returns 是否是管理员
 */
export function isTenantAdmin(tenant: TenantInfo): boolean {
  return tenant.isAdmin
}

