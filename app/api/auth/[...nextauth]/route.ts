/**
 * NextAuth v5 API Route Handler
 * 
 * v5 使用导出的 handlers 而不是直接使用 NextAuth()
 */

import { handlers } from "@/auth"

export const { GET, POST } = handlers
