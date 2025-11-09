/**
 * NextAuth v5 Middleware
 * 
 * v5 的 middleware 使用新的 auth 导出
 */

import { auth } from "@/auth"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 管理员专属路径
const adminPaths = ['/admin', '/settings/users', '/settings/system']

// 公开路径（不需要认证）
const publicPaths = ['/login', '/error', '/about', '/api/auth']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  
  console.log(`[Middleware v5] Path: ${pathname}, isLoggedIn: ${isLoggedIn}`)
  
  // 公开路径允许访问
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // 未登录用户重定向到登录页
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    console.log(`[Middleware v5] Redirecting to login: ${loginUrl}`)
    return NextResponse.redirect(loginUrl)
  }
  
  // 如果已认证且访问根路径，重定向到 /desktop
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/desktop', req.url))
  }
  
  // 如果访问旧的 /portal 路径，重定向到 /desktop
  if (pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/desktop', req.url))
  }
  
  // 管理员路径权限检查
  if (adminPaths.some(path => pathname.startsWith(path))) {
    const roles = (req.auth?.roles as string[]) || []
    
    if (!roles.includes('admin')) {
      return NextResponse.redirect(
        new URL('/error?code=403&message=权限不足', req.url)
      )
    }
  }
  
  // 创建响应并添加安全头
  const response = NextResponse.next()
  
  // 安全头
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const cspHeader = process.env.NODE_ENV === 'production'
    ? "default-src 'self'; frame-src 'self' http://localhost:* https://localhost:*; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://keycloak:8080 http://localhost:8080;"
    : "default-src 'self'; frame-src 'self' http://localhost:* https://localhost:*; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* https://localhost:* ws://localhost:*;"
  
  response.headers.set('Content-Security-Policy', cspHeader)
  
  return response
})

export const config = {
  matcher: [
    '/',
    '/desktop/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/help/:path*',
    '/portal/:path*',
    '/admin/:path*',
    '/realm-switching/:path*',
  ],
}
