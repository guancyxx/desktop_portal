'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { 
  Search,
  Moon,
  Sun,
  User,
  LogOut,
  Settings
} from 'lucide-react'
import { useTheme } from 'next-themes'

interface MenuBarProps {
  onOpenHelp?: () => void
  onOpenSystem?: () => void
  onOpenAbout?: () => void
  onToggleTaskSidebar?: () => void
}

export function MenuBar({ onOpenHelp, onOpenSystem, onOpenAbout, onToggleTaskSidebar }: MenuBarProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 点击外部关闭用户菜单 / Esc 关闭
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

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // 避免 hydration 不匹配
  if (!mounted) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex h-8 items-center justify-between border-b border-white/10 bg-black/30 px-4 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span>🏠</span>
            <span>DreamBuilder</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/80">
          <div className="flex flex-col items-end text-xs">
            <span className="font-medium text-white">...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex h-8 items-center justify-between border-b border-white/10 bg-black/30 px-4 backdrop-blur-2xl"
    >
      {/* 左侧 - 应用菜单 */}
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 text-sm font-semibold text-white">
          <span>🏠</span>
          <span>DreamBuilder</span>
        </button>
        
        <div className="flex items-center gap-3 text-xs text-white/80">
          <button
            onClick={() => onOpenHelp?.()}
            className="hover:text-white transition-colors"
          >
            帮助
          </button>
        </div>
      </div>

      {/* 右侧 - 系统控制 */}
      <div className="flex items-center gap-3 text-white/80">
        {/* 搜索 */}
        <button className="hover:text-white transition-colors">
          <Search size={14} />
        </button>

        {/* 主题切换 */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="hover:text-white transition-colors"
          title="切换主题"
        >
          {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* 任务列表 */}
        <button 
          onClick={() => onToggleTaskSidebar?.()}
          className="hover:text-white transition-colors"
          title="待办任务"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </button>

        {/* 用户菜单 */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
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
              className="absolute right-0 top-8 w-48 rounded-xl border border-white/10 bg-black/90 p-2 backdrop-blur-2xl shadow-2xl"
            >
              <div className="border-b border-white/10 pb-2 mb-2">
                <p className="px-3 py-2 text-xs text-white/60">
                  {session?.user?.email}
                </p>
              </div>
              
              <button onClick={() => onOpenSystem?.()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10">
                <Settings size={14} />
                <span>系统设置</span>
              </button>
              
              <button 
                onClick={() => signOut()}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                <LogOut size={14} />
                <span>退出登录</span>
              </button>

              <div className="border-t border-white/10 mt-2 pt-2" />
              <button
                onClick={() => onOpenAbout?.()}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                <span className="text-base">ℹ️</span>
                <span>关于</span>
              </button>
            </motion.div>
          )}
        </div>

        {/* 时间和日期（一行显示） */}
        <div className="items-center text-xs font-medium text-white hidden sm:flex">
          <span>{formatDateTime(currentTime)}</span>
        </div>
      </div>
    </motion.div>
  )
}

