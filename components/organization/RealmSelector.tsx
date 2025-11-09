/**
 * Realm 选择器组件
 * 显示用户可以访问的所有组织（Realm），并支持切换
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Building2, ChevronDown, Plus, Loader2 } from 'lucide-react'

interface RealmInfo {
  realmName: string
  displayName: string
  enabled: boolean
}

export function RealmSelector() {
  const { data: session } = useSession()
  const [realms, setRealms] = useState<RealmInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchUserRealms()
    }
  }, [session])

  const fetchUserRealms = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/realms')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '获取组织列表失败')
      }

      setRealms(data.realms || [])
    } catch (err) {
      console.error('Failed to fetch realms:', err)
      setError(err instanceof Error ? err.message : '获取组织列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchRealm = async (realmName: string) => {
    try {
      console.log(`[RealmSelector] Switching to realm: ${realmName}`)
      
      // 先关闭下拉菜单
      setIsOpen(false)
      
      // 如果是当前 realm，不需要切换
      if (realmName === currentRealmName) {
        return
      }
      
      // 1. 先清除当前 session（可选，但建议清除以确保获取新 token）
      await signOut({ redirect: false })
      
      // 2. 构建 state 参数，包含目标 realm 和回调 URL
      const stateData = {
        realm: realmName,
        callbackUrl: '/desktop'
      }
      const state = Buffer.from(JSON.stringify(stateData)).toString('base64')
      
      // 3. 使用 Identity Brokering 进行 SSO 切换
      // 跳转到目标 realm 的认证端点，使用 kc_idp_hint 触发 SSO
      const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'
      const authUrl = new URL(`${keycloakUrl}/realms/${realmName}/protocol/openid-connect/auth`)
      
      authUrl.searchParams.set('client_id', 'desktop-portal')
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'openid email profile')
      // 使用 v5 的专用回调与前端 update() 流程
      const callbackUrl = `${window.location.origin}/api/auth/callback/realm-switch`
      authUrl.searchParams.set('redirect_uri', callbackUrl)
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('kc_idp_hint', 'master-idp') // 自动使用 Master IDP 进行 SSO
      authUrl.searchParams.set('prompt', 'login')
      
      // 由于用户已经在 Dreambuilder realm 登录，Keycloak 会自动完成 SSO 认证
      console.log('[RealmSelector] Redirecting to SSO auth for realm:', realmName)
      window.location.href = authUrl.toString()
      
    } catch (err) {
      console.error('[RealmSelector] Failed to switch realm:', err)
      alert('切换组织失败，请重试')
    }
  }

  const handleCreateOrganization = () => {
    window.location.href = '/organizations/create'
  }

  if (!session) {
    return null
  }

  // 当前 Realm（从 session 中获取）
  const currentRealmName = (session as any).tenant?.tenantRealm || 'Dreambuilder'
  const currentRealm = realms.find(r => r.realmName === currentRealmName) || {
    realmName: currentRealmName,
    displayName: 'Default Organization',
    enabled: true,
  }

  return (
    <div className="relative">
      {/* 组织选择器按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Building2 className="w-4 h-4" />
        <span className="max-w-[150px] truncate">{currentRealm.displayName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* 标题 */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">选择组织</h3>
            {session.user?.email && (
              <p className="text-xs text-gray-500 mt-1">{session.user.email}</p>
            )}
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="px-4 py-8 text-center">
              <Loader2 className="w-5 h-5 mx-auto animate-spin text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">加载中...</p>
            </div>
          )}

          {/* 错误状态 */}
          {error && !loading && (
            <div className="px-4 py-4">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={fetchUserRealms}
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                重试
              </button>
            </div>
          )}

          {/* Realm 列表 */}
          {!loading && !error && (
            <>
              <div className="max-h-64 overflow-y-auto">
                {realms.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <Building2 className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-sm text-gray-500 mt-2">还没有组织</p>
                    <p className="text-xs text-gray-400 mt-1">创建您的第一个组织开始使用</p>
                  </div>
                ) : (
                  realms.map((realm) => (
                    <button
                      key={realm.realmName}
                      onClick={() => handleSwitchRealm(realm.realmName)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        realm.realmName === currentRealmName
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {realm.displayName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {realm.realmName}
                          </p>
                        </div>
                        {realm.realmName === currentRealmName && (
                          <span className="text-xs font-medium text-blue-600">
                            当前
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* 创建新组织按钮 */}
              <div className="border-t border-gray-200">
                <button
                  onClick={handleCreateOrganization}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>创建新组织</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

