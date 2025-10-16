'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Application } from '@/types'
import { X } from 'lucide-react'

interface LaunchpadProps {
  applications: Application[]
  isOpen: boolean
  onClose: () => void
  onAppClick: (app: Application) => void
}

export function Launchpad({ applications, isOpen, onClose, onAppClick }: LaunchpadProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredApps = applications.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAppClick = (app: Application) => {
    onAppClick(app)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose()
            }
          }}
        >
          <div className="relative h-full w-full max-w-7xl px-8 py-16">
            {/* 关闭按钮 */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={onClose}
              className="absolute top-8 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
            >
              <X size={20} />
            </motion.button>

            {/* 搜索框 */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-12 flex justify-center"
            >
              <input
                type="text"
                placeholder="搜索应用..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-96 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-white placeholder-white/50 backdrop-blur-xl focus:border-white/40 focus:outline-none"
                autoFocus
              />
            </motion.div>

            {/* 应用网格 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-5 gap-8 xl:grid-cols-7"
            >
              {filteredApps.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05 * index, type: 'spring' }}
                  whileHover={{ scale: 1.1, y: -8 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex cursor-pointer flex-col items-center gap-3"
                  onClick={() => handleAppClick(app)}
                >
                  {/* 应用图标 */}
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl shadow-2xl transition-shadow group-hover:shadow-3xl">
                    <span className="text-5xl">{app.icon}</span>
                  </div>

                  {/* 应用名称 */}
                  <div className="w-full text-center">
                    <p className="text-sm font-medium text-white truncate">
                      {app.name}
                    </p>
                    {app.status === 'coming-soon' && (
                      <p className="text-xs text-white/50">即将推出</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* 无结果提示 */}
            {filteredApps.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-4 py-20 text-white/60"
              >
                <p className="text-lg">未找到匹配的应用</p>
                <p className="text-sm">尝试使用不同的搜索词</p>
              </motion.div>
            )}

            {/* 页面指示器 */}
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
              <div className="h-2 w-2 rounded-full bg-white" />
              <div className="h-2 w-2 rounded-full bg-white/30" />
              <div className="h-2 w-2 rounded-full bg-white/30" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

