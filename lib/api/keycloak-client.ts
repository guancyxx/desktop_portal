/**
 * Keycloak 客户端 - 前端直接调用 Keycloak API
 * 
 * 优势：
 * 1. 不依赖后端代理
 * 2. 使用用户 token 作为鉴权，更安全
 * 3. 减少后端压力
 * 4. 更快的响应速度
 */

import { getUserAccessibleRealms, type RealmInfo } from '@/lib/services/realm-service'

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'

export type { RealmInfo }

/**
 * 使用用户 token 获取可访问的 realm 列表
 */
export async function getUserRealms(accessToken: string): Promise<RealmInfo[]> {
  try {
    // 使用统一的 realm 服务
    return await getUserAccessibleRealms(accessToken, KEYCLOAK_URL, '[KeycloakClient]')
  } catch (error) {
    console.error('[KeycloakClient] Error fetching user realms:', error)
    
    // 如果直接调用失败（如 403），尝试 fallback
    if (error instanceof Error && error.message.includes('403')) {
      console.warn('[KeycloakClient] User does not have permission, using fallback')
      return await getFallbackRealms(accessToken)
    }
    
    throw error
  }
}

/**
 * 备用方案：使用后端 API
 */
async function getFallbackRealms(accessToken: string): Promise<RealmInfo[]> {
  console.log('[KeycloakClient] Using fallback method (backend API)...')
  
  try {
    const response = await fetch('/api/user/realms', {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Backend API failed')
    }

    const data = await response.json()
    return data.realms || []
  } catch (error) {
    console.error('[KeycloakClient] Fallback method failed:', error)
    return []
  }
}

/**
 * 获取指定 realm 的详细信息
 */
export async function getRealmInfo(realmName: string, accessToken: string): Promise<any> {
  try {
    const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${realmName}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch realm info: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`[KeycloakClient] Error fetching realm ${realmName} info:`, error)
    throw error
  }
}

/**
 * 验证 token 是否有效
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${KEYCLOAK_URL}/realms/Dreambuilder/protocol/openid-connect/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    return response.ok
  } catch (error) {
    console.error('[KeycloakClient] Token validation failed:', error)
    return false
  }
}

