'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { LayoutGrid, Monitor } from 'lucide-react'

interface ViewSwitcherProps {
  currentView: 'portal' | 'desktop'
}

export function ViewSwitcher({ currentView }: ViewSwitcherProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-20 right-6 z-40"
    >
      <div className="flex gap-2 rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-xl shadow-xl">
        <Link
          href="/portal"
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            currentView === 'portal'
              ? 'bg-white text-gray-900 shadow-md'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <LayoutGrid size={16} />
          <span>传统视图</span>
        </Link>
        
        <Link
          href="/desktop"
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            currentView === 'desktop'
              ? 'bg-white text-gray-900 shadow-md'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <Monitor size={16} />
          <span>桌面模式</span>
        </Link>
      </div>
    </motion.div>
  )
}

