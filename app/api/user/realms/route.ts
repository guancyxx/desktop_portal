/**
 * 获取当前用户可以访问的所有 Realm
 * 
 * 使用 Keycloak Admin API: GET /admin/realms
 * 用户的 access token 需要有相应权限才能调用
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { keycloakAdmin } from '@/lib/keycloak/admin-client'

export async function GET(req: NextRequest) {
  try {
    // 获取当前用户 session
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 使用管理员凭据查询可访问的 realm
    const realms = await keycloakAdmin.getUserRealms(session.user.email)

    // 返回 realm 列表
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

