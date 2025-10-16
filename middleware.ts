export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/portal/:path*', '/profile/:path*', '/settings/:path*'],
}

