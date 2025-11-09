/**
 * Realm 切换 API (NextAuth v5)
 * 
 * 利用 v5 的 update() 功能实现无缝realm切换
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { keycloakAdmin } from '@/lib/keycloak/admin-client'

const KEYCLOAK_INTERNAL_URL = process.env.KEYCLOAK_INTERNAL_URL || 'http://keycloak:8080'

export async function POST(req: NextRequest) {
  try {
    // 验证当前用户已登录
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: '未授权：请先登录' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { code, realm, redirectUri } = body

    if (!code || !realm || !redirectUri) {
      return NextResponse.json(
        { error: '缺少必需参数：code, realm, redirectUri' },
        { status: 400 }
      )
    }

    console.log(`[SwitchRealm] Switching to realm: ${realm}`)

    // 获取目标realm的client secret
    const clientSecret = await keycloakAdmin.getClientSecret(realm)
    if (!clientSecret) {
      console.error('[SwitchRealm] Failed to get client secret')
      return NextResponse.json(
        { error: '无法获取客户端凭据' },
        { status: 500 }
      )
    }

    // 交换tokens
    const tokenUrl = `${KEYCLOAK_INTERNAL_URL}/realms/${realm}/protocol/openid-connect/token`
    console.log(`[SwitchRealm] Exchanging code for tokens...`)

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'desktop-portal',
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('[SwitchRealm] Token exchange failed:', errorData)
      return NextResponse.json(
        { error: 'Token交换失败' },
        { status: 500 }
      )
    }

    const tokens = await tokenResponse.json()
    console.log(`[SwitchRealm] Successfully obtained tokens for realm: ${realm}`)

    // 解析用户信息
    let roles: string[] = []
    let groups: string[] = []
    try {
      const idTokenParts = tokens.id_token.split('.')
      if (idTokenParts.length >= 2) {
        const payload = JSON.parse(Buffer.from(idTokenParts[1], 'base64').toString())
        roles = payload.realm_access?.roles || []
        groups = payload.groups || []
      }
    } catch (error) {
      console.error('[SwitchRealm] Failed to parse id_token:', error)
    }

    // 返回tokens给前端，让前端调用 update() 来更新session
    return NextResponse.json({
      success: true,
      realm: realm,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
        roles,
        groups,
      },
    })

  } catch (error) {
    console.error('[SwitchRealm] Error:', error)
    return NextResponse.json(
      { error: '处理realm切换时发生错误' },
      { status: 500 }
    )
  }
}




