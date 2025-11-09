'use client'

import { useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // 如果已认证，重定向到目标页面
    if (status === 'authenticated') {
      const callbackUrl = searchParams.get('callbackUrl') || '/desktop'
      router.push(callbackUrl)
      return
    }

    // 如果未认证，自动触发 Keycloak 登录
    if (status === 'unauthenticated') {
      const callbackUrl = searchParams.get('callbackUrl') || '/desktop'
      // v5：通过 authorizationParams 明确传递到授权请求
      signIn('keycloak', {
        callbackUrl,
        authorizationParams: {
          kc_idp_hint: 'master-idp',
          prompt: 'login',
        } as any,
      } as any)
    }
  }, [status, router, searchParams])

  // 显示加载状态
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="text-center">
        <div className="mb-4 text-6xl animate-pulse">🏠</div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          DreamBuilder Portal
        </h2>
        <p className="text-white/80">正在跳转到登录页面...</p>
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  )
}

