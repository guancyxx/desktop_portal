'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { 
  User,
  LogOut,
  Settings,
  Building2,
  Plus,
  ChevronRight,
  Check
} from 'lucide-react'
import { getUserRealms, type RealmInfo } from '@/lib/api/keycloak-client'

interface UserMenuProps {
  onOpenSystem?: () => void
  onOpenAbout?: () => void
}

export function UserMenu({ onOpenSystem, onOpenAbout }: UserMenuProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [realms, setRealms] = useState<RealmInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [currentRealm, setCurrentRealm] = useState<string>('')
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 获取当前 realm 信息
  useEffect(() => {
    if (session?.user?.email) {
      // 从 session 中获取当前 realm，优先使用 realmName
      let sessionRealm = session.realmName
      
      // 如果没有 realmName，尝试从 tenant 信息中获取
      if (!sessionRealm && session.tenant) {
        sessionRealm = session.tenant.tenantId
      }
      
      // 默认使用 Dreambuilder
      sessionRealm = sessionRealm || 'Dreambuilder'
      
      console.log('[UserMenu] Current realm detected:', sessionRealm)
      setCurrentRealm(sessionRealm)
    }
  }, [session])

  // 获取用户可访问的组织列表（使用前端直接调用）
  const fetchRealms = async () => {
    if (!session?.accessToken) {
      console.log('[UserMenu] No access token, skipping realm fetch')
      return
    }

    try {
      setLoading(true)
      
      // 直接调用 Keycloak API
      console.log('[UserMenu] Fetching realms with user token...')
      const userRealms = await getUserRealms(session.accessToken as string)
      
      console.log('[UserMenu] Fetched realms:', userRealms)
      setRealms(userRealms)
    } catch (error) {
      console.error('[UserMenu] Error fetching realms:', error)
      
      // 如果前端调用失败，fallback 到后端 API
      console.log('[UserMenu] Falling back to backend API...')
      try {
        const response = await fetch('/api/user/realms')
        if (response.ok) {
          const data = await response.json()
          setRealms(data.realms || [])
        }
      } catch (fallbackError) {
        console.error('[UserMenu] Fallback also failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showUserMenu])

  // 切换组织 (NextAuth v5 版本)
  const handleSwitchRealm = async (realmName: string) => {
    try {
      console.log(`[UserMenu v5] Switching to realm: ${realmName}`)
      
      // 关闭菜单
      setShowUserMenu(false)
      
      // 如果是当前 realm，不需要切换
      if (realmName === currentRealm) {
        return
      }
      
      const targetOrg = realms.find(r => r.realmName === realmName)
      console.log(`[UserMenu v5] Target organization: ${targetOrg?.displayName}`)
      
      // 1. 保存切换意图到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('switching-to-realm', realmName)
        localStorage.setItem('switching-to-realm-name', targetOrg?.displayName || realmName)
      }
      
      // 2. 构建OAuth callback URL（使用新的switch-realm endpoint）
      const callbackUrl = `${window.location.origin}/api/auth/callback/realm-switch`
      
      // 3. 构建 state 参数
      const stateData = {
        realm: realmName,
        redirectUri: callbackUrl
      }
      const state = btoa(JSON.stringify(stateData))
      
      // 4. 构建SSO认证URL
      const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'
      const authUrl = new URL(`${keycloakUrl}/realms/${realmName}/protocol/openid-connect/auth`)
      
      authUrl.searchParams.set('client_id', 'desktop-portal')
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'openid email profile')
      authUrl.searchParams.set('redirect_uri', callbackUrl)
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('kc_idp_hint', 'master-idp') // 自动使用 Master IDP 进行 SSO
      authUrl.searchParams.set('prompt', 'login') // 强制刷新登录页，避免本地状态干扰
      
      console.log(`[UserMenu v5] Redirecting to SSO for realm: ${realmName}`)
      
      // 5. 跳转到SSO认证
      window.location.href = authUrl.toString()
      
    } catch (err) {
      console.error('[UserMenu v5] Failed to switch realm:', err)
      
      // 清理localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('switching-to-realm')
        localStorage.removeItem('switching-to-realm-name')
      }
      
      alert('切换组织失败，请重试')
    }
  }

  // 创建新组织
  const handleCreateOrganization = () => {
    setShowUserMenu(false)
    window.location.href = '/organizations/create'
  }

  // 打开菜单时获取组织列表
  const handleToggleMenu = () => {
    if (!showUserMenu) {
      fetchRealms()
    }
    setShowUserMenu(!showUserMenu)
  }

  return (
    <div className="relative" ref={userMenuRef}>
      <button
        onClick={handleToggleMenu}
        className="flex items-center gap-2 hover:text-white transition-colors"
      >
        <User size={14} />
        <span className="text-xs">{session?.user?.name || 'User'}</span>
      </button>

      {showUserMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute right-0 top-8 w-64 rounded-xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
        >
          {/* 用户信息头部 */}
          <div className="border-b border-white/10 pb-3 pt-4 px-4">
            <p className="text-xs text-white/60 truncate">
              {session?.user?.email}
            </p>
            {currentRealm && (
              <div className="flex items-center gap-2 mt-2">
                <Building2 size={12} className="text-white/40" />
                <span className="text-xs text-white/50">
                  当前组织: {realms.find(r => r.realmName === currentRealm)?.displayName || currentRealm}
                </span>
              </div>
            )}
          </div>

          {/* 组织选择部分 */}
          <div className="border-b border-white/10 py-2">
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                <Building2 size={12} />
                <span>选择组织</span>
              </div>
              
              {loading ? (
                <div className="px-3 py-2 text-xs text-white/40">
                  加载中...
                </div>
              ) : realms.length > 0 ? (
                <div className="space-y-1">
                  {realms.map((realm) => (
                    <button
                      key={realm.realmName}
                      onClick={() => handleSwitchRealm(realm.realmName)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Building2 size={14} className="text-white/60 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{realm.displayName}</div>
                          <div className="text-xs text-white/50 truncate">{realm.realmName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {realm.realmName === currentRealm && (
                          <>
                            <span className="text-xs text-blue-400 font-medium">当前</span>
                            <Check size={14} className="text-blue-400" />
                          </>
                        )}
                        <ChevronRight size={12} className="text-white/40 group-hover:text-white/60 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 text-xs text-white/40">
                  暂无组织
                </div>
              )}

              {/* 创建新组织按钮 */}
              <button
                onClick={handleCreateOrganization}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-400 hover:bg-blue-400/10 transition-colors mt-2"
              >
                <Plus size={14} />
                <span>创建新组织</span>
              </button>
            </div>
          </div>

          {/* 用户操作菜单 */}
          <div className="py-2">
            <button 
              onClick={() => {
                setShowUserMenu(false)
                onOpenSystem?.()
              }} 
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
            >
              <Settings size={14} />
              <span>系统设置</span>
            </button>
            
            <button 
              onClick={async () => {
                try {
                  console.log('[UserMenu] Starting logout process...')
                  
                  // 1. 调用后端 API 清除 Keycloak 会话
                  const response = await fetch('/api/auth/signout-keycloak', { 
                    method: 'POST' 
                  })
                  const data = await response.json()
                  
                  console.log('[UserMenu] Keycloak logout response:', data)
                  
                  // 2. 清除 NextAuth 本地会话并重定向到登录页
                  await signOut({ callbackUrl: '/login' })
                  
                } catch (error) {
                  console.error('[UserMenu] Signout error:', error)
                  // 出错时至少清除本地会话
                  await signOut({ callbackUrl: '/login' })
                }
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
            >
              <LogOut size={14} />
              <span>退出登录</span>
            </button>

            <div className="border-t border-white/10 mt-2 pt-2" />
            <button
              onClick={() => {
                setShowUserMenu(false)
                onOpenAbout?.()
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
            >
              <span className="text-base">ℹ️</span>
              <span>关于</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
