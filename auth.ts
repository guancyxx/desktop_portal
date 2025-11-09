/**
 * NextAuth v5 (Auth.js) 配置
 * 
 * v5 的主要变化：
 * 1. 配置文件移到根目录
 * 2. 使用 NextAuth() 函数而不是 NextAuthOptions
 * 3. 支持动态 Provider 配置
 * 4. 更好的 TypeScript 支持
 */

import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import type { NextAuthConfig } from "next-auth"
import { keycloakAdmin } from '@/lib/keycloak/admin-client'

// 环境变量
const keycloakInternalUrl = process.env.KEYCLOAK_INTERNAL_URL || process.env.KEYCLOAK_URL || 'http://keycloak:8080'
const keycloakExternalUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'
const keycloakRealm = process.env.KEYCLOAK_REALM || 'Dreambuilder'

export const authConfig = {
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${keycloakInternalUrl}/realms/${keycloakRealm}`,
      // v5 中可以更灵活地配置授权端点
      authorization: {
        params: {
          scope: 'openid email profile',
          // 取消本地登录页，直接走 Dreambuilder IdP SSO
          kc_idp_hint: 'master-idp',
          // 强制刷新登录页面，避免使用上次本地状态
          prompt: 'login',
        },
        url: `${keycloakExternalUrl}/realms/${keycloakRealm}/protocol/openid-connect/auth`,
      },
      token: `${keycloakInternalUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
      userinfo: `${keycloakInternalUrl}/realms/${keycloakRealm}/protocol/openid-connect/userinfo`,
    }),
  ],
  
  callbacks: {
    async jwt({ token, account, profile, trigger, session }) {
      console.log(`[Auth v5] JWT callback: trigger=${trigger}`)
      
      // v5: 支持动态realm的关键 - 检查是否是realm切换
      if (trigger === 'update' && session?.switchRealm) {
        console.log(`[Auth v5] Realm switch detected: ${session.switchRealm}`)
        
        // 从session中获取新的realm信息
        const newRealmName = session.switchRealm
        const newTokens = session.tokens
        
        if (newTokens && newRealmName) {
          console.log(`[Auth v5] Updating token for realm: ${newRealmName}`)
          
          // 更新token到新的realm
          return {
            ...token,
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            idToken: newTokens.idToken,
            expiresAt: newTokens.expiresAt,
            realmName: newRealmName,
            // 保留其他字段
            name: token.name,
            email: token.email,
            sub: token.sub,
            roles: newTokens.roles || token.roles,
            groups: newTokens.groups || token.groups,
          }
        }
      }
      
      // 初始登录
      if (account && profile) {
        console.log(`[Auth v5] Initial login`)
        
        token.accessToken = account.access_token
        token.idToken = account.id_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.roles = (account as any).realm_access?.roles || []
        token.groups = (profile as any).groups || []
        
        // 从 idToken 中提取 realm 名称
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
            console.error('[Auth v5] Failed to parse idToken:', error)
            token.realmName = keycloakRealm
          }
        } else {
          token.realmName = keycloakRealm
        }
        
        console.log(`[Auth v5] Logged in to realm: ${token.realmName}`)
        return token
      }
      
      // Token 未过期，直接返回
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }
      
      // Token 已过期，尝试刷新
      if (token.refreshToken) {
        try {
          const currentRealm = (token.realmName as string) || keycloakRealm
          console.log(`[Auth v5] Refreshing token for realm: ${currentRealm}`)
          
          // 动态获取client secret
          let clientSecret = process.env.KEYCLOAK_CLIENT_SECRET!
          
          if (currentRealm !== keycloakRealm) {
            const dynamicSecret = await keycloakAdmin.getClientSecret(currentRealm)
            if (dynamicSecret) {
              clientSecret = dynamicSecret
              console.log(`[Auth v5] Using dynamic client secret for realm: ${currentRealm}`)
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
          
          console.log(`[Auth v5] Token refreshed successfully for realm: ${currentRealm}`)
          
          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            idToken: refreshedTokens.id_token,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
            realmName: currentRealm,
          }
        } catch (error) {
          console.error('[Auth v5] Error refreshing token:', error)
          return { ...token, error: 'RefreshAccessTokenError' }
        }
      }
      
      return token
    },
    
    async session({ session, token }) {
      // v5: session callback 更简洁
      session.accessToken = token.accessToken as string
      session.idToken = token.idToken as string
      session.realmName = token.realmName as string
      session.roles = token.roles as string[]
      
      if (token.error) {
        session.error = token.error as string
      }
      
      // 添加用户角色
      if (session.user) {
        session.user.roles = token.roles as string[]
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
  
  // v5: 使用 AUTH_SECRET 而不是 NEXTAUTH_SECRET
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  
  // v5: 信任主机配置
  trustHost: true,
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut, update } = NextAuth(authConfig)

// 导出类型定义
export type { Session } from "next-auth"

