/**
 * Dock Component (Optimized) - 优化的 Dock 组件
 * 
 * 优化点：
 * 1. 使用 memo 避免不必要的重渲染
 * 2. 使用 useMemo 缓存计算结果
 * 3. 拆分子组件减小渲染范围
 * 4. 使用 Set 优化查找性能
 */
'use client'

import { memo, useMemo, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Grid3x3, Plus } from 'lucide-react'
import { Application } from '@/types'
import { useDesktopStore } from '@/stores/desktop-store'

interface DockProps {
  applications: Application[]
  maxItems?: number
}

/**
 * 单个 Dock 图标组件
 */
interface DockItemProps {
  app: Application
  isActive: boolean
  onClick: () => void
}

const DockItem = memo(function DockItem({ app, isActive, onClick }: DockItemProps) {
  const mouseX = useMotionValue(0)
  const distance = useTransform(mouseX, [-150, 0, 150], [50, 80, 50])
  const width = useSpring(distance, { mass: 0.1, stiffness: 150, damping: 12 })
  
  return (
    <motion.button
      className="group relative flex flex-col items-center justify-center"
      style={{ width }}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`打开 ${app.name}`}
      title={app.name}
    >
      {/* 应用图标 */}
      <div className="text-4xl mb-1 transition-transform group-hover:scale-110">
        {app.icon}
      </div>
      
      {/* 应用名称（hover 显示） */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="px-3 py-1 bg-gray-900/90 dark:bg-gray-100/90 text-white dark:text-black text-xs rounded-md whitespace-nowrap">
          {app.name}
        </div>
      </div>
      
      {/* 活动指示器 */}
      {isActive && (
        <motion.div
          className="absolute -bottom-1 h-1 w-1 rounded-full bg-white dark:bg-gray-800"
          layoutId={`active-${app.id}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        />
      )}
    </motion.button>
  )
})

/**
 * Launchpad 按钮组件
 */
const LaunchpadButton = memo(function LaunchpadButton({ 
  onClick 
}: { 
  onClick: () => void 
}) {
  return (
    <motion.button
      className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-gray-800/30 dark:hover:bg-gray-700/40 backdrop-blur-sm transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="打开启动台"
      title="启动台"
    >
      <Grid3x3 className="h-6 w-6 text-white" />
    </motion.button>
  )
})

/**
 * 分隔线组件
 */
const DockDivider = memo(function DockDivider() {
  return (
    <div className="w-px h-12 bg-white/20 dark:bg-gray-600/40 mx-2" 
         aria-hidden="true" 
    />
  )
})

/**
 * Dock 主组件（优化版）
 */
export const Dock = memo(function Dock({ 
  applications, 
  maxItems = 8 
}: DockProps) {
  const { getActiveApps, openApp, toggleLaunchpad } = useDesktopStore()
  const activeApps = getActiveApps()
  
  // 使用 useMemo 缓存过滤和排序的应用列表
  const dockApps = useMemo(() => 
    applications
      .filter(app => app.status === 'active')
      .sort((a, b) => a.order - b.order)
      .slice(0, maxItems),
    [applications, maxItems]
  )
  
  // 使用 Set 优化活动应用查找性能
  const activeAppSet = useMemo(() => 
    new Set(activeApps), 
    [activeApps]
  )
  
  // 使用 useCallback 缓存事件处理器
  const handleAppClick = useCallback((app: Application) => {
    openApp(app)
  }, [openApp])
  
  const handleLaunchpadClick = useCallback(() => {
    toggleLaunchpad()
  }, [toggleLaunchpad])
  
  return (
    <nav
      role="navigation"
      aria-label="应用程序 Dock"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
    >
      <motion.div
        className="flex items-end gap-2 px-4 py-3 rounded-2xl bg-white/10 dark:bg-gray-900/20 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* 应用图标列表 */}
        {dockApps.map((app) => (
          <DockItem
            key={app.id}
            app={app}
            isActive={activeAppSet.has(app.id)}
            onClick={() => handleAppClick(app)}
          />
        ))}
        
        {/* 分隔线 */}
        {dockApps.length > 0 && <DockDivider />}
        
        {/* Launchpad 按钮 */}
        <LaunchpadButton onClick={handleLaunchpadClick} />
      </motion.div>
    </nav>
  )
})

