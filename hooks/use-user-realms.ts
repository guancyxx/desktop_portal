/**
 * 使用用户 token 获取可访问的 realm 列表
 * 
 * 优势：
 * 1. 前端直接调用 Keycloak API
 * 2. 使用用户 token 鉴权，无需 admin 凭据
 * 3. 自动处理错误和 fallback
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRealms, RealmInfo } from '@/lib/api/keycloak-client'

export function useUserRealms() {
  const { data: session } = useSession()
  const [realms, setRealms] = useState<RealmInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRealms = async () => {
    if (!session?.accessToken) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 直接使用用户 token 调用 Keycloak API
      const userRealms = await getUserRealms(session.accessToken as string)
      
      setRealms(userRealms)
      console.log(`[useUserRealms] Fetched ${userRealms.length} realms`)
    } catch (err) {
      console.error('[useUserRealms] Error fetching realms:', err)
      setError(err instanceof Error ? err.message : '获取组织列表失败')
      
      // 如果前端调用失败，尝试使用后端 API 作为备用
      try {
        const response = await fetch('/api/user/realms')
        if (response.ok) {
          const data = await response.json()
          setRealms(data.realms || [])
          setError(null) // 清除错误，因为备用方案成功了
        }
      } catch (fallbackErr) {
        console.error('[useUserRealms] Fallback also failed:', fallbackErr)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchRealms()
    }
  }, [session])

  return {
    realms,
    loading,
    error,
    refetch: fetchRealms,
  }
}


