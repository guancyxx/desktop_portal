import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // 如果已认证且访问根路径，重定向到 /desktop
    if (req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/desktop', req.url))
    }
    
    // 如果访问旧的 /portal 路径，重定向到 /desktop
    if (req.nextUrl.pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/desktop', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: ['/', '/desktop/:path*', '/profile/:path*', '/settings/:path*', '/help/:path*', '/portal/:path*'],
}

