'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

/**
 * Realm 切换处理页面 (NextAuth v5)
 * 
 * 利用 v5 的 update() 功能实现无缝realm切换
 */
export default function RealmSwitchingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status, update } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const code = searchParams.get('code')
  const realm = searchParams.get('realm')
  const redirectUri = searchParams.get('redirectUri')

  useEffect(() => {
    const switchRealm = async () => {
      if (isProcessing || !code || !realm || !redirectUri) {
        return
      }

      setIsProcessing(true)
      console.log('[RealmSwitching] Processing realm switch to:', realm)
      
      try {
        // 1. 调用后端API交换tokens
        console.log('[RealmSwitching] Calling switch-realm API...')
        const response = await fetch('/api/auth/switch-realm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            realm,
            redirectUri,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Realm切换失败')
        }

        const data = await response.json()
        console.log('[RealmSwitching] Tokens received, updating session...')

        // 2. 使用 v5 的 update() 功能更新session
        // 这是 v5 的关键特性！
        await update({
          switchRealm: data.realm,
          tokens: data.tokens,
        })

        console.log('[RealmSwitching] Session updated successfully!')

        // 3. 清理 localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('switching-to-realm')
          localStorage.removeItem('switching-to-realm-name')
        }

        // 4. 短暂延迟后跳转到桌面
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('[RealmSwitching] Redirecting to desktop...')
        router.push('/desktop')

      } catch (err) {
        console.error('[RealmSwitching] Error:', err)
        setError(err instanceof Error ? err.message : '切换realm时发生错误')
        
        // 3秒后重定向到桌面
        setTimeout(() => {
          router.push('/desktop')
        }, 3000)
      }
    }

    switchRealm()
  }, [code, realm, redirectUri, isProcessing, update, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        {error ? (
          <div>
            <div className="mb-4 text-red-500">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-400 text-lg mb-2">切换失败</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <p className="text-gray-500 text-xs">3秒后自动返回...</p>
          </div>
        ) : (
          <div>
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-white text-lg mb-2">正在切换组织...</p>
            <p className="text-gray-400 text-sm">请稍候，马上完成</p>
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4 text-left">
              <div className="flex items-center text-green-400 text-sm mb-2">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>SSO认证完成</span>
              </div>
              <div className="flex items-center text-blue-400 text-sm mb-2">
                <div className="w-4 h-4 mr-2 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span>更新会话中...</span>
              </div>
              <div className="flex items-center text-gray-500 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                </svg>
                <span>即将完成</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}





