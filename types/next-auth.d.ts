import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

/**
 * 租户信息（多 Realm 架构）
 */
export interface TenantInfo {
  /** 租户 ID（子域名） */
  tenantId: string
  /** 租户名称 */
  tenantName: string
  /** 租户所在的 Realm */
  tenantRealm: string
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    idToken?: string
    roles?: string[]
    tenant?: TenantInfo
    realmName?: string
    error?: string
    user: {
      roles?: string[]
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    roles?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    idToken?: string
    refreshToken?: string
    expiresAt?: number
    roles?: string[]
    tenantId?: string
    tenantName?: string
    realmName?: string
    error?: string
    sub?: string
    email?: string
    name?: string
    preferred_username?: string
  }
}

