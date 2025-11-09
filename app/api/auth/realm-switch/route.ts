/**
 * Realm 切换回调处理
 * 
 * 专门用于处理realm切换的OAuth callback
 * 与标准登录流程分离，避免NextAuth的限制
 */

import { NextRequest, NextResponse } from 'next/server'
import { keycloakAdmin } from '@/lib/keycloak/admin-client'
import {
  createRealmSession,
  getSessionCookieName,
  getSessionCookieOptions,
  type RealmTokens,
} from '@/lib/session-manager'

const KEYCLOAK_INTERNAL_URL = process.env.KEYCLOAK_INTERNAL_URL || 'http://keycloak:8080'
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    console.log('[RealmSwitch] Callback received')

    // 处理错误
    if (error) {
      console.error('[RealmSwitch] OAuth error:', error, error_description)
      return NextResponse.redirect(
        new URL(`/error?code=realm_switch_error&message=${encodeURIComponent(error_description || error)}`, req.url)
      )
    }

    // 验证必需参数
    if (!code) {
      console.error('[RealmSwitch] Missing authorization code')
      return NextResponse.redirect(
        new URL('/error?code=missing_code&message=缺少授权码', req.url)
      )
    }

    // 从 state 中提取 realm 信息和回调 URL
    let targetRealm = 'Dreambuilder'
    let callbackUrl = '/desktop'
    
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
        if (stateData.realm) {
          targetRealm = stateData.realm
        }
        if (stateData.callbackUrl) {
          callbackUrl = stateData.callbackUrl
        }
      } catch (e) {
        console.warn('[RealmSwitch] Failed to parse state:', e)
      }
    }

    console.log(`[RealmSwitch] Switching to realm: ${targetRealm}`)

    // 动态获取目标 realm 的 client secret
    const clientSecret = await keycloakAdmin.getClientSecret(targetRealm)
    
    if (!clientSecret) {
      console.error('[RealmSwitch] Failed to get client secret for realm:', targetRealm)
      return NextResponse.redirect(
        new URL('/error?code=client_error&message=无法获取客户端凭据', req.url)
      )
    }

    // 使用 authorization code 交换 access token
    const tokenUrl = `${KEYCLOAK_INTERNAL_URL}/realms/${targetRealm}/protocol/openid-connect/token`
    const redirectUri = `${req.nextUrl.origin}/api/auth/realm-switch`

    console.log(`[RealmSwitch] Exchanging code for tokens...`)

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
      console.error('[RealmSwitch] Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/error?code=token_error&message=Token交换失败', req.url)
      )
    }

    const tokens: RealmTokens = await tokenResponse.json()
    console.log(`[RealmSwitch] Successfully obtained tokens for realm: ${targetRealm}`)

    // 创建新的 session JWT
    const sessionToken = await createRealmSession(
      targetRealm,
      tokens,
      NEXTAUTH_SECRET
    )

    console.log(`[RealmSwitch] Session created for realm: ${targetRealm}`)

    // 重定向到中间验证页面（避免NextAuth的标准OAuth流程干扰）
    const redirectUrl = new URL('/realm-switched', req.url)
    redirectUrl.searchParams.set('realm', targetRealm)
    redirectUrl.searchParams.set('callback', callbackUrl)
    
    // 创建响应
    const response = NextResponse.redirect(redirectUrl)
    
    // 设置 NextAuth session cookie
    const cookieName = getSessionCookieName(IS_PRODUCTION)
    const cookieOptions = getSessionCookieOptions(IS_PRODUCTION)
    
    response.cookies.set(cookieName, sessionToken, cookieOptions)
    
    console.log(`[RealmSwitch] Session cookie set, redirecting to: ${callbackUrl}`)

    return response
  } catch (error) {
    console.error('[RealmSwitch] Error processing realm switch:', error)
    if (error instanceof Error) {
      console.error('[RealmSwitch] Error details:', error.message, error.stack)
    }
    return NextResponse.redirect(
      new URL('/error?code=realm_switch_error&message=切换组织时发生错误', req.url)
    )
  }
}

