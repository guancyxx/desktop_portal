/**
 * 动态 NextAuth 配置
 * 
 * 根据租户动态生成 NextAuth 配置
 * 支持多 Realm 架构
 */

import { NextAuthOptions } from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'
import { TenantRealmConfig } from '@/config/tenant-realms'

/**
 * Keycloak 配置
 */
const keycloakInternalUrl = process.env.KEYCLOAK_INTERNAL_URL || 'http://keycloak:8080'
const keycloakExternalUrl = process.env.KEYCLOAK_EXTERNAL_URL || 'http://localhost:8080'

/**
 * 根据租户配置动态生成 NextAuth 配置
 * 
 * @param tenantConfig - 租户配置
 * @returns NextAuth 配置
 */
export function getAuthOptions(tenantConfig: TenantRealmConfig): NextAuthOptions {
  const { realmName, clientId, clientSecret } = tenantConfig

  // 构建 Realm 相关的 URL
  const issuer = `${keycloakInternalUrl}/realms/${realmName}`
  const wellKnown = `${issuer}/.well-known/openid-configuration`
  const authorization = `${keycloakExternalUrl}/realms/${realmName}/protocol/openid-connect/auth`
  const token = `${issuer}/protocol/openid-connect/token`
  const userinfo = `${issuer}/protocol/openid-connect/userinfo`

  return {
    providers: [
      KeycloakProvider({
        clientId,
        clientSecret,
        issuer,
        authorization: {
          url: authorization,
          params: {
            scope: 'openid email profile',
          },
        },
        token,
        userinfo,
        wellKnown,
      }),
    ],
    callbacks: {
      async jwt({ token, account, profile, trigger, session: newSession }) {
        // 初次登录时保存 Token 信息
        if (account && profile) {
          token.accessToken = account.access_token
          token.refreshToken = account.refresh_token
          token.expiresAt = account.expires_at
          token.idToken = account.id_token

          // 保存租户信息
          token.tenantId = tenantConfig.tenantId
          token.tenantName = tenantConfig.tenantName
          token.realmName = tenantConfig.realmName

          // 保存用户信息
          token.sub = profile.sub
          token.email = profile.email
          token.name = profile.name
          token.preferred_username = (profile as any).preferred_username

          return token
        }

        // Token 刷新逻辑
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = token.expiresAt as number

        // Token 还有 5 分钟过期，尝试刷新
        if (now < expiresAt - 300) {
          return token
        }

        try {
          const refreshToken = token.refreshToken as string
          const response = await fetch(`${keycloakInternalUrl}/realms/${realmName}/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
            }),
          })

          if (!response.ok) {
            console.error('Failed to refresh token:', response.statusText)
            throw new Error('RefreshAccessTokenError')
          }

          const tokens = await response.json()

          return {
            ...token,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? token.refreshToken,
            expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
          }
        } catch (error) {
          console.error('Error refreshing token:', error)
          return {
            ...token,
            error: 'RefreshAccessTokenError',
          }
        }
      },

      async session({ session, token }) {
        // 将 Token 信息传递到 Session
        session.accessToken = token.accessToken as string
        session.idToken = token.idToken as string
        session.error = token.error as string | undefined

        // 添加租户信息到 Session
        session.tenant = {
          tenantId: token.tenantId as string,
          tenantName: token.tenantName as string,
          tenantRealm: token.realmName as string,
        }

        // 添加用户信息
        if (session.user) {
          session.user.email = token.email as string
          session.user.name = token.name as string
        }

        // 如果有 Token 刷新错误，提示需要重新登录
        if (token.error) {
          session.error = 'RefreshAccessTokenError'
        }

        return session
      },

      async redirect({ url, baseUrl }) {
        // 确保重定向到正确的子域名
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`
        }
        
        // 如果重定向 URL 和 baseUrl 在同一域名下，允许重定向
        if (new URL(url).origin === baseUrl) {
          return url
        }
        
        return baseUrl
      },
    },

    pages: {
      signIn: '/login',
      error: '/error',
    },

    session: {
      strategy: 'jwt',
      maxAge: 24 * 60 * 60, // 24 小时
    },

    secret: process.env.NEXTAUTH_SECRET,

    debug: process.env.NODE_ENV === 'development',
  }
}

/**
 * 导出类型定义
 */
export type { NextAuthOptions }


