'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { 
  Wifi, 
  Battery, 
  Volume2, 
  Search,
  Moon,
  Sun,
  User,
  LogOut,
  Settings
} from 'lucide-react'
import { useTheme } from 'next-themes'

export function MenuBar() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric' 
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
          <button className="hover:text-white transition-colors">文件</button>
          <button className="hover:text-white transition-colors">编辑</button>
          <button className="hover:text-white transition-colors">查看</button>
          <a href="/help" className="hover:text-white transition-colors">帮助</a>
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
        >
          {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* 音量 */}
        <button className="hover:text-white transition-colors">
          <Volume2 size={14} />
        </button>

        {/* WiFi */}
        <button className="hover:text-white transition-colors">
          <Wifi size={14} />
        </button>

        {/* 电池 */}
        <button className="hover:text-white transition-colors">
          <Battery size={14} />
        </button>

        {/* 分隔线 */}
        <div className="h-4 w-px bg-white/20" />

        {/* 用户菜单 */}
        <div className="relative">
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
              
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10">
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
            </motion.div>
          )}
        </div>

        {/* 时间和日期 */}
        <div className="flex flex-col items-end text-xs">
          <span className="font-medium text-white">{formatDate(currentTime)}</span>
          <span className="text-white/60">{formatTime(currentTime)}</span>
        </div>
      </div>
    </motion.div>
  )
}

