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

interface Realm {
  realmName: string
  displayName: string
}

interface UserMenuProps {
  onOpenSystem?: () => void
  onOpenAbout?: () => void
}

export function UserMenu({ onOpenSystem, onOpenAbout }: UserMenuProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [realms, setRealms] = useState<Realm[]>([])
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

  // 获取用户可访问的组织列表
  const fetchRealms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/realms')
      if (response.ok) {
        const data = await response.json()
        console.log('[UserMenu] API response:', data.realms)
        setRealms(data.realms || [])
      }
    } catch (error) {
      console.error('Failed to fetch realms:', error)
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

  // 切换组织
  const handleSwitchRealm = async (realmName: string) => {
    try {
      console.log(`[UserMenu] Switching to realm: ${realmName}`)
      console.log(`[UserMenu] Realm name type:`, typeof realmName)
      console.log(`[UserMenu] Realm name value:`, realmName)
      
      // 关闭菜单
      setShowUserMenu(false)
      
      // 退出当前登录
      await signOut({ redirect: false })
      
      // 清除本地存储
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
        localStorage.clear()
      }
      
      // 延迟一下再跳转，确保退出完成
      setTimeout(() => {
        // 直接跳转到指定 realm 的 Keycloak 登录页面
        window.location.href = `/api/auth/signin-keycloak?realm=${realmName}&callbackUrl=/desktop`
      }, 100)
    } catch (err) {
      console.error('Failed to switch realm:', err)
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
