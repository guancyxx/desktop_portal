/**
 * Realm 切换 OAuth Callback (NextAuth v5)
 * 
 * 处理从Keycloak返回的OAuth code，获取tokens后
 * 重定向到前端页面，由前端调用 update() 更新session
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    console.log('[RealmSwitchCallback] OAuth callback received')

    // 处理错误
    if (error) {
      console.error('[RealmSwitchCallback] OAuth error:', error, error_description)
      return NextResponse.redirect(
        new URL(`/error?code=realm_switch_error&message=${encodeURIComponent(error_description || error)}`, req.url)
      )
    }

    // 验证必需参数
    if (!code || !state) {
      console.error('[RealmSwitchCallback] Missing code or state')
      return NextResponse.redirect(
        new URL('/error?code=missing_params&message=缺少必需参数', req.url)
      )
    }

    // 解析 state
    let targetRealm = ''
    let redirectUri = ''
    
    try {
      const stateData = JSON.parse(atob(state))
      targetRealm = stateData.realm
      redirectUri = stateData.redirectUri
    } catch (e) {
      console.error('[RealmSwitchCallback] Failed to parse state:', e)
      return NextResponse.redirect(
        new URL('/error?code=invalid_state&message=无效的state参数', req.url)
      )
    }

    console.log(`[RealmSwitchCallback] Target realm: ${targetRealm}`)

    // 重定向到前端处理页面，携带 code 和 realm 信息
    const frontendUrl = new URL('/realm-switching', req.url)
    frontendUrl.searchParams.set('code', code)
    frontendUrl.searchParams.set('realm', targetRealm)
    frontendUrl.searchParams.set('redirectUri', redirectUri)
    
    console.log(`[RealmSwitchCallback] Redirecting to frontend handler`)
    
    return NextResponse.redirect(frontendUrl)

  } catch (error) {
    console.error('[RealmSwitchCallback] Error processing callback:', error)
    return NextResponse.redirect(
      new URL('/error?code=callback_error&message=处理回调时发生错误', req.url)
    )
  }
}




