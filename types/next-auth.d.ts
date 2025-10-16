import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    idToken?: string
    roles?: string[]
    error?: string
    user: {
      roles?: string[]
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    roles?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    idToken?: string
    refreshToken?: string
    expiresAt?: number
    roles?: string[]
  }
}

