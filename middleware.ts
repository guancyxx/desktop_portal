export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/desktop/:path*', '/profile/:path*', '/settings/:path*', '/help/:path*'],
}

