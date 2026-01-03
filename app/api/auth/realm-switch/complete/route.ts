/**
 * Realm 切换完成端点
 * 
 * 接收OAuth code并交换tokens，然后返回给前端
 * 前端负责更新session
 */

import { NextRequest, NextResponse } from 'next/server'
import { keycloakAdmin } from '@/lib/keycloak/admin-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const KEYCLOAK_INTERNAL_URL = process.env.KEYCLOAK_INTERNAL_URL || 'http://keycloak:8080'

export async function POST(req: NextRequest) {
  try {
    // 验证当前用户已登录
    const session = await getServerSession(authOptions)
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

    console.log(`[RealmSwitchComplete] Processing realm switch to: ${realm}`)

    // 获取目标realm的client secret
    const clientSecret = await keycloakAdmin.getClientSecret(realm)
    if (!clientSecret) {
      console.error('[RealmSwitchComplete] Failed to get client secret')
      return NextResponse.json(
        { error: '无法获取客户端凭据' },
        { status: 500 }
      )
    }

    // 交换tokens
    const tokenUrl = `${KEYCLOAK_INTERNAL_URL}/realms/${realm}/protocol/openid-connect/token`
    console.log(`[RealmSwitchComplete] Exchanging code for tokens...`)

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
      console.error('[RealmSwitchComplete] Token exchange failed:', errorData)
      return NextResponse.json(
        { error: 'Token交换失败' },
        { status: 500 }
      )
    }

    const tokens = await tokenResponse.json()
    console.log(`[RealmSwitchComplete] Successfully obtained tokens`)

    // 返回tokens给前端
    return NextResponse.json({
      success: true,
      realm: realm,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresIn: tokens.expires_in,
      },
    })

  } catch (error) {
    console.error('[RealmSwitchComplete] Error:', error)
    return NextResponse.json(
      { error: '处理realm切换时发生错误' },
      { status: 500 }
    )
  }
}





