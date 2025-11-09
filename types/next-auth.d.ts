/**
 * NextAuth v5 类型扩展
 */

import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    idToken?: string
    refreshToken?: string
    realmName?: string
    roles?: string[]
    error?: string
    user: {
      roles?: string[]
    } & DefaultSession["user"]
    // Realm切换相关
    switchRealm?: string
    tokens?: {
      accessToken: string
      refreshToken: string
      idToken: string
      expiresAt: number
      roles?: string[]
      groups?: string[]
    }
  }

  interface JWT {
    accessToken?: string
    idToken?: string
    refreshToken?: string
    expiresAt?: number
    realmName?: string
    roles?: string[]
    groups?: string[]
    error?: string
  }

  interface User {
    roles?: string[]
    groups?: string[]
    realmName?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    idToken?: string
    refreshToken?: string
    expiresAt?: number
    realmName?: string
    roles?: string[]
    groups?: string[]
    error?: string
  }
}
