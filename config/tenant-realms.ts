/**
 * 租户-Realm 映射配置
 * 
 * 方案一：多 Realm 架构
 * 每个租户对应一个独立的 Keycloak Realm
 */

export interface TenantRealmConfig {
  /** 租户 ID（子域名） */
  tenantId: string
  /** 租户名称 */
  tenantName: string
  /** Keycloak Realm 名称 */
  realmName: string
  /** Client ID */
  clientId: string
  /** Client Secret */
  clientSecret: string
  /** 是否启用 */
  enabled: boolean
  /** 描述 */
  description?: string
}

/**
 * 租户配置列表
 * 
 * 配置格式：
 * - tenantId: 子域名（例如：acme 对应 acme.dreambuilder.local）
 * - realmName: Keycloak 中的 Realm 名称
 * - clientId: 该 Realm 中的 Client ID
 * - clientSecret: 该 Realm 中的 Client Secret
 */
export const TENANT_REALMS: TenantRealmConfig[] = [
  {
    tenantId: 'acme',
    tenantName: 'ACME Corporation',
    realmName: 'acme-corp',
    clientId: 'desktop-portal',
    clientSecret: 'Mo1SXDJHXwbkrXefc6W4DyBu1TMHF3st',
    enabled: true,
    description: 'ACME Corporation 租户'
  },
  // 可以添加更多租户配置
  // {
  //   tenantId: 'techco',
  //   tenantName: 'Tech Company',
  //   realmName: 'tech-company',
  //   clientId: 'desktop-portal',
  //   clientSecret: 'your-client-secret',
  //   enabled: true,
  //   description: 'Tech Company 租户'
  // },
]

/**
 * 默认租户配置
 * 用于未识别子域名时的回退
 */
export const DEFAULT_TENANT: TenantRealmConfig = {
  tenantId: 'default',
  tenantName: 'Default Tenant',
  realmName: process.env.KEYCLOAK_REALM || 'Dreambuilder',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'desktop-portal',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  enabled: true,
  description: '默认租户（使用原 Dreambuilder Realm）'
}

/**
 * 根据租户 ID 查找租户配置
 * 
 * @param tenantId - 租户 ID（子域名）
 * @returns 租户配置，未找到时返回默认租户
 */
export function getTenantConfig(tenantId: string | null): TenantRealmConfig {
  if (!tenantId) {
    return DEFAULT_TENANT
  }

  const config = TENANT_REALMS.find(
    (tenant) => tenant.tenantId === tenantId && tenant.enabled
  )

  return config || DEFAULT_TENANT
}

/**
 * 从主机名提取租户 ID
 * 
 * 支持的格式：
 * - acme.localhost -> acme (推荐，无需配置 hosts)
 * - acme.localhost:3000 -> acme
 * - acme.dreambuilder.local -> acme
 * - acme.dreambuilder.com -> acme
 * - localhost -> null (使用默认租户)
 * - localhost:3000 -> null (使用默认租户)
 * 
 * @param hostname - 主机名
 * @returns 租户 ID 或 null
 */
export function extractTenantFromHostname(hostname: string): string | null {
  // 移除端口号
  const host = hostname.split(':')[0]

  // 纯 localhost 或 IP 地址，使用默认租户
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null
  }

  // 提取子域名
  const parts = host.split('.')
  
  // 至少需要 2 部分才有子域名
  // 支持: acme.localhost, acme.dreambuilder.local 等
  if (parts.length < 2) {
    return null
  }

  // 返回第一个部分作为租户 ID
  const tenantId = parts[0]
  
  // 验证租户 ID 格式（只允许字母、数字和连字符）
  if (!/^[a-z0-9-]+$/i.test(tenantId)) {
    return null
  }

  return tenantId
}

/**
 * 根据主机名获取租户配置
 * 
 * @param hostname - 主机名
 * @returns 租户配置
 */
export function getTenantConfigFromHostname(hostname: string): TenantRealmConfig {
  const tenantId = extractTenantFromHostname(hostname)
  return getTenantConfig(tenantId)
}

/**
 * 获取所有已启用的租户
 * 
 * @returns 已启用的租户列表
 */
export function getEnabledTenants(): TenantRealmConfig[] {
  return TENANT_REALMS.filter(tenant => tenant.enabled)
}

/**
 * 验证租户是否存在且已启用
 * 
 * @param tenantId - 租户 ID
 * @returns 是否有效
 */
export function isValidTenant(tenantId: string): boolean {
  return TENANT_REALMS.some(
    tenant => tenant.tenantId === tenantId && tenant.enabled
  )
}

