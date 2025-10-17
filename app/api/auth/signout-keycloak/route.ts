/**
 * Keycloak 全局登出 API
 * 
 * 实现真正的 Single Sign-Out (SSO)
 * 使用 Admin API 强制删除所有用户会话
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const keycloakInternalUrl = process.env.KEYCLOAK_INTERNAL_URL || process.env.KEYCLOAK_URL || 'http://keycloak:8080'
const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || 'desktop-portal'
const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    console.log('[Keycloak Signout] Starting global signout process...')
    
    // 获取当前用户 session
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 提取用户信息
    const accessToken = (session as any).accessToken
    const realmName = (session as any).realmName || 'Dreambuilder'
    
    // 从 accessToken 中解析用户ID
    let userId: string | null = null
    if (accessToken && typeof accessToken === 'string') {
      try {
        const parts = accessToken.split('.')
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
          userId = payload.sub
          console.log('[Keycloak Signout] User ID:', userId)
        }
      } catch (error) {
        console.error('[Keycloak Signout] Failed to parse accessToken:', error)
      }
    }

    if (!userId) {
      console.warn('[Keycloak Signout] No user ID found, performing client-side logout only')
      return NextResponse.json({
        success: true,
        message: '本地登出成功（未找到用户ID）',
        sessionsCleared: 0
      })
    }

    try {
      // 方法1: 使用 Service Account 获取 Admin Token
      console.log('[Keycloak Signout] Getting admin token...')
      const tokenResponse = await fetch(
        `${keycloakInternalUrl}/realms/${realmName}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: keycloakClientId,
            client_secret: keycloakClientSecret,
          }),
        }
      )

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('[Keycloak Signout] Failed to get admin token:', tokenResponse.status, errorText)
        throw new Error('Failed to get admin token')
      }

      const { access_token: adminToken } = await tokenResponse.json()
      console.log('[Keycloak Signout] Admin token obtained successfully')

      // 方法2: 使用 Admin API 删除用户的所有会话
      console.log(`[Keycloak Signout] Deleting sessions for user ${userId} in realm ${realmName}...`)
      const logoutResponse = await fetch(
        `${keycloakInternalUrl}/admin/realms/${realmName}/users/${userId}/logout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!logoutResponse.ok) {
        const errorText = await logoutResponse.text()
        console.error('[Keycloak Signout] Failed to logout user:', logoutResponse.status, errorText)
        throw new Error(`Failed to logout user: ${logoutResponse.status}`)
      }

      console.log(`[Keycloak Signout] Successfully cleared all sessions for user ${userId}`)

      return NextResponse.json({
        success: true,
        message: '全局登出成功，所有会话已清除',
        userId: userId,
        realm: realmName,
      })

    } catch (adminError) {
      console.error('[Keycloak Signout] Admin API error:', adminError)
      
      // 如果 Admin API 失败，返回成功但记录警告
      // 这样至少可以清除本地会话
      return NextResponse.json({
        success: true,
        message: '本地登出成功（Keycloak会话清除失败）',
        warning: adminError instanceof Error ? adminError.message : 'Unknown error',
      })
    }

  } catch (error) {
    console.error('[Keycloak Signout] Error during signout:', error)
    return NextResponse.json(
      { 
        error: '登出失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

