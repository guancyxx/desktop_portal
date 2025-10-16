/**
 * Dock Component (Optimized) - 优化版 Dock 组件
 * 
 * 此文件用于演示优化版本，可以通过动态导入按需加载
 */
'use client'

import { memo, useMemo, useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion'
import { Application } from '@/types'

interface DockProps {
  applications: Application[]
  onAppClick: (app: Application) => void
  activeApps?: string[]
  onLaunchpadClick?: () => void
}

interface DockItemProps {
  app: Application
  mouseX: MotionValue<number>
  onClick: () => void
  isActive?: boolean
}

// 记忆化 Dock 项组件，避免不必要的重渲染
const DockItem = memo(({ app, mouseX, onClick, isActive }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null)

  // 使用 transform 计算鼠标距离
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  // 使用 spring 动画使图标缩放更平滑
  const widthSync = useTransform(distance, [-150, 0, 150], [50, 80, 50])
  const width = useSpring(widthSync, { 
    mass: 0.1, 
    stiffness: 150, 
    damping: 12 
  })

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className="relative flex flex-col items-center"
    >
      <motion.button
        onClick={onClick}
        title={app.name}
        aria-label={`打开 ${app.name}`}
        className="group relative flex aspect-square w-full items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-lg transition-all hover:shadow-xl"
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 应用图标 */}
        <span className="text-3xl" aria-hidden="true">{app.icon}</span>
        
        {/* 活动指示器 */}
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 h-1 w-1 rounded-full bg-white/80"
            aria-label="应用正在运行"
          />
        )}

        {/* 悬停工具提示 */}
        <div className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="relative">
            <div className="whitespace-nowrap rounded-md bg-gray-900/95 px-3 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-sm">
              {app.name}
            </div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900/95 rotate-45" />
          </div>
        </div>
      </motion.button>
    </motion.div>
  )
})

DockItem.displayName = 'DockItem'

// 记忆化 Dock 组件
export const Dock = memo(({ applications, onAppClick, activeApps = [], onLaunchpadClick }: DockProps) => {
  const mouseX = useMotionValue(Infinity)

  // 使用 useMemo 缓存过滤和排序后的应用
  const sortedApps = useMemo(() => 
    applications
      .filter(app => app.status === 'active')
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [applications]
  )

  // 使用 Set 优化活动应用查找性能
  const activeAppSet = useMemo(() => new Set(activeApps), [activeApps])

  // 使用 useCallback 优化事件处理器
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseX.set(e.pageX)
  }, [mouseX])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(Infinity)
  }, [mouseX])

  const handleAppClick = useCallback((app: Application) => {
    onAppClick(app)
  }, [onAppClick])

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto"
      >
        <nav
          role="navigation"
          aria-label="应用程序 Dock"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="flex items-end gap-2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-2xl shadow-2xl"
        >
          {sortedApps.map((app) => (
            <DockItem
              key={app.id}
              app={app}
              mouseX={mouseX}
              onClick={() => handleAppClick(app)}
              isActive={activeAppSet.has(app.id)}
            />
          ))}
        
          {/* 分隔线 */}
          <div className="mx-1 h-12 w-px bg-white/20" role="separator" />
        
          {/* Launchpad 图标 */}
          <DockItem
            app={{
              id: 'launchpad',
              name: 'Launchpad',
              icon: '🚀',
              description: '查看所有应用',
              url: '',
              category: 'system',
              roles: [],
              status: 'active',
              order: 999
            }}
            mouseX={mouseX}
            onClick={() => onLaunchpadClick?.()}
          />
        </nav>
      </motion.div>
    </div>
  )
})

Dock.displayName = 'Dock'
