/**
 * 动态 Keycloak 登录处理
 * 
 * GET /api/auth/signin-keycloak?realm={realmName}&callbackUrl={callbackUrl}
 * 
 * 根据指定的 realm 动态构建 Keycloak 登录 URL
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const realmName = searchParams.get('realm')
  const callbackUrl = searchParams.get('callbackUrl') || '/desktop'

  if (!realmName) {
    return NextResponse.json(
      { error: '缺少 realm 参数' },
      { status: 400 }
    )
  }

  // 构建 Keycloak 登录 URL
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'
  const clientId = 'desktop-portal'
  const redirectUri = `${req.nextUrl.origin}/api/auth/callback/keycloak`
  
  // 构建动态的 Keycloak 登录 URL
  const authUrl = new URL(`${keycloakUrl}/realms/${realmName}/protocol/openid-connect/auth`)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', Buffer.from(JSON.stringify({ 
    callbackUrl,
    realm: realmName 
  })).toString('base64'))

  console.log(`[Auth] Redirecting to Keycloak realm: ${realmName}`)
  console.log(`[Auth] Auth URL: ${authUrl.toString()}`)

  // 重定向到指定 realm 的 Keycloak 登录页面
  return NextResponse.redirect(authUrl.toString())
}

