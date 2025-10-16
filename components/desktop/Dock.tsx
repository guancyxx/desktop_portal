'use client'

import { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Application } from '@/types'

interface DockProps {
  applications: Application[]
  onAppClick: (app: Application) => void
  activeApps?: string[]
  onLaunchpadClick?: () => void
}

interface DockItemProps {
  app: Application
  mouseX: any
  onClick: () => void
  isActive?: boolean
}

function DockItem({ app, mouseX, onClick, isActive }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthSync = useTransform(distance, [-150, 0, 150], [50, 80, 50])
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className="relative flex flex-col items-center"
    >
      <motion.button
        onClick={onClick}
        className="relative flex aspect-square w-full items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-lg transition-all hover:shadow-xl"
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 应用图标 */}
        <span className="text-3xl">{app.icon}</span>
        
        {/* 活动指示器 */}
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 h-1 w-1 rounded-full bg-white/80"
          />
        )}

        {/* 悬停工具提示 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute -top-12 whitespace-nowrap rounded-lg bg-black/75 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
        >
          {app.name}
        </motion.div>
      </motion.button>
    </motion.div>
  )
}

export function Dock({ applications, onAppClick, activeApps = [], onLaunchpadClick }: DockProps) {
  const mouseX = useMotionValue(Infinity)

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
    >
      <div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-end gap-2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-2xl shadow-2xl"
      >
        {applications
          .filter(app => app.status === 'active')
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((app) => (
            <DockItem
              key={app.id}
              app={app}
              mouseX={mouseX}
              onClick={() => onAppClick(app)}
              isActive={activeApps.includes(app.id)}
            />
          ))}
        
        {/* 分隔线 */}
        <div className="mx-1 h-12 w-px bg-white/20" />
        
        {/* Launchpad 图标 */}
        <DockItem
          app={{
            id: 'launchpad',
            name: 'Launchpad',
            icon: '🚀',
            description: 'View all applications',
            url: '',
            category: 'system',
            roles: [],
            status: 'active',
            order: 999
          }}
          mouseX={mouseX}
          onClick={() => onLaunchpadClick?.()}
        />
      </div>
    </motion.div>
  )
}

