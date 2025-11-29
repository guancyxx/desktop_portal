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
      // 使用内部URL作为issuer（服务器端验证需要）
      issuer: `${keycloakInternalUrl}/realms/${keycloakRealm}`,
      // 明确指定授权端点使用外部URL（浏览器访问）
      authorization: {
        params: {
          scope: 'openid email profile',
          // 关键：添加kc_idp_hint绕过issuer检查
          kc_idp_hint: 'keycloak',
        },
        url: `${keycloakExternalUrl}/realms/${keycloakRealm}/protocol/openid-connect/auth`,
      },
      // token和userinfo使用内部URL（容器间通信）
      token: `${keycloakInternalUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
      userinfo: `${keycloakInternalUrl}/realms/${keycloakRealm}/protocol/openid-connect/userinfo`,
      // 禁用wellKnown自动发现，手动指定端点
      wellKnown: undefined,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      console.log(`[Auth] JWT callback: trigger=${trigger}, hasAccount=${!!account}, hasProfile=${!!profile}`)
      console.log(`[Auth] Token keys:`, Object.keys(token))
      console.log(`[Auth] Token._isManual:`, (token as any)._isManual)
      console.log(`[Auth] Token._realm:`, (token as any)._realm)
      console.log(`[Auth] Token.realmName:`, token.realmName)
      
      // 检查是否是手动创建的token（realm切换）
      // 手动创建的token有 _isManual 和 _realm 标记
      if ((token as any)._isManual && (token as any)._realm) {
        console.log(`[Auth] ✅ Manual token detected for realm: ${token.realmName}`)
        // 手动创建的token，直接返回，保留所有字段
        // 移除 _isManual 标记，避免后续混淆
        const { _isManual, ...cleanToken } = token as any
        return cleanToken
      }
      
      console.log(`[Auth] Not a manual token, processing normally...`)

      // 初始登录（通过OAuth Provider）
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
        
        console.log(`[Auth] Initial login to realm: ${token.realmName}`)
        return token
      }

      // Token 未过期，直接返回（保留 realmName）
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      // Token 已过期，尝试刷新
      if (token.refreshToken) {
        try {
          // 使用 token 中保存的 realmName，而不是硬编码的 keycloakRealm
          const currentRealm = (token.realmName as string) || keycloakRealm
          console.log(`[Auth] Refreshing token for realm: ${currentRealm}`)
          
          // 动态获取当前realm的client secret
          // 注意：这里需要导入keycloakAdmin
          let clientSecret = process.env.KEYCLOAK_CLIENT_SECRET!
          
          // 如果不是默认realm，需要动态获取client secret
          if (currentRealm !== keycloakRealm) {
            const { keycloakAdmin } = await import('@/lib/keycloak/admin-client')
            const dynamicSecret = await keycloakAdmin.getClientSecret(currentRealm)
            if (dynamicSecret) {
              clientSecret = dynamicSecret
              console.log(`[Auth] Using dynamic client secret for realm: ${currentRealm}`)
            } else {
              console.warn(`[Auth] Failed to get dynamic client secret, using default`)
            }
          }
          
          const response = await fetch(
            `${keycloakInternalUrl}/realms/${currentRealm}/protocol/openid-connect/token`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: clientSecret,
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
            // 保留 realmName
            realmName: currentRealm,
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

