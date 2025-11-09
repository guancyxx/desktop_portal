/**
 * 获取当前用户可以访问的所有 Realm
 * 
 * 优化方案：
 * 1. 使用用户的 access token 而非 admin 凭据
 * 2. 前端可以直接调用 Keycloak API，后端仅作为备用
 * 3. 统一使用 realm-service 避免代码重复
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserAccessibleRealms } from '@/lib/services/realm-service'

const KEYCLOAK_INTERNAL_URL = process.env.KEYCLOAK_INTERNAL_URL || 'http://keycloak:8080'

export async function GET(req: NextRequest) {
  try {
    // 获取当前用户 session
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    console.log('[API] Fetching realms using user token...')

    try {
      // 使用统一的 realm 服务
      const accessibleRealms = await getUserAccessibleRealms(
        session.accessToken as string,
        KEYCLOAK_INTERNAL_URL,
        '[API]'
      )

      return NextResponse.json({
        success: true,
        realms: accessibleRealms,
        primaryRealm: accessibleRealms.length > 0 ? accessibleRealms[0].realmName : null,
        count: accessibleRealms.length,
      })
    } catch (error) {
      // 如果用户 token 没有权限，使用 Admin Client fallback
      if (error instanceof Error && error.message.includes('403')) {
        console.log('[API] User does not have admin access, using fallback method')
        return await getFallbackRealms(session)
      }
      throw error
    }
  } catch (error) {
    console.error('[API] Error fetching user realms:', error)
    return NextResponse.json(
      { 
        error: '获取 Realm 列表失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * 备用方案：如果用户没有 admin 权限，使用预定义的 realm 列表
 */
async function getFallbackRealms(session: any) {
  // 方案A：从环境变量或配置文件读取可用的 realm 列表
  // 方案B：使用 Keycloak Admin Client（当前方案的备用）
  const { keycloakAdmin } = await import('@/lib/keycloak/admin-client')
  
  try {
    const realms = await keycloakAdmin.getUserRealms(session.user?.email || '')
    
    return NextResponse.json({
      success: true,
      realms: realms.map((r: any) => ({
        realmName: r.realm,
        displayName: r.displayName || r.realm,
        enabled: r.enabled,
      })),
      primaryRealm: realms.length > 0 ? realms[0].realm : null,
      count: realms.length,
    })
  } catch (error) {
    console.error('[API] Fallback method also failed:', error)
    return NextResponse.json({
      success: true,
      realms: [],
      primaryRealm: null,
      count: 0,
    })
  }
}

