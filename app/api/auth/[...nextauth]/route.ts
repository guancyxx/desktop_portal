/**
 * NextAuth API Route  
 * 支持多租户动态 Realm 选择
 * 
 * 注意：由于 NextAuth + App Router 的限制，
 * 我们暂时使用回退到默认 Realm（Dreambuilder）
 * 多租户完整支持需要升级到 NextAuth v5 (Auth.js)
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

