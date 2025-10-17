import { NextAuthOptions } from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'
import { extractTenantFromToken } from './tenant/extract-tenant'

// 使用内部地址（容器间通信）用于服务器端请求
const keycloakInternalUrl = process.env.KEYCLOAK_INTERNAL_URL || process.env.KEYCLOAK_URL || 'http://keycloak:8080'
// 使用外部地址用于浏览器重定向
const keycloakExternalUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'
const keycloakRealm = process.env.KEYCLOAK_REALM || 'Dreambuilder'

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${keycloakInternalUrl}/realms/${keycloakRealm}`,
      // 明确指定授权端点使用外部URL，让浏览器可以访问
      authorization: {
        params: {
          scope: 'openid email profile',
        },
        url: `${keycloakExternalUrl}/realms/${keycloakRealm}/protocol/openid-connect/auth`,
      },
      token: `${keycloakInternalUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
      userinfo: `${keycloakInternalUrl}/realms/${keycloakRealm}/protocol/openid-connect/userinfo`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 初始登录
      if (account && profile) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.roles = (account as any).realm_access?.roles || []
        
        // 提取租户信息
        token.groups = (profile as any).groups || []
        token.tenant_name = (profile as any).tenant_name
        
        // 添加当前 realm 信息
        // 从 Keycloak token 中提取 realm 名称
        if (token.idToken && typeof token.idToken === 'string') {
          try {
            const parts = token.idToken.split('.')
            if (parts.length >= 2) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
              token.realmName = payload.iss?.split('/realms/')[1] || keycloakRealm
            } else {
              token.realmName = keycloakRealm
            }
          } catch (error) {
            console.error('Failed to parse idToken:', error)
            token.realmName = keycloakRealm
          }
        } else {
          token.realmName = keycloakRealm
        }
        
        return token
      }

      // Token 未过期，直接返回
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      // Token 已过期，尝试刷新
      if (token.refreshToken) {
        try {
          const response = await fetch(
            `${keycloakInternalUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
                grant_type: 'refresh_token',
                refresh_token: token.refreshToken as string,
              }),
            }
          )

          const refreshedTokens = await response.json()

          if (!response.ok) {
            throw new Error('Token refresh failed')
          }

          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            idToken: refreshedTokens.id_token,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
          }
        } catch (error) {
          console.error('Error refreshing access token:', error)
          // 返回旧token，让用户重新登录
          return { ...token, error: 'RefreshAccessTokenError' }
        }
      }

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.idToken = token.idToken as string
      session.roles = token.roles as string[]
      session.user = {
        ...session.user,
        roles: token.roles as string[],
      }
      
      // 自动提取租户信息
      session.tenant = extractTenantFromToken(token)
      
      // 添加当前 realm 信息到 session
      if (token.realmName) {
        session.realmName = token.realmName as string
      }
      
      if (token.error) {
        session.error = token.error as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

