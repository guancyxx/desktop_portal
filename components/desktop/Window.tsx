'use client'

import { useState, useRef } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { X, Minimize2, Maximize2, Minus } from 'lucide-react'

interface WindowProps {
  id: string
  title: string
  children: React.ReactNode
  icon?: string
  onClose: () => void
  onMinimize?: () => void
  initialPosition?: { x: number; y: number }
  initialSize?: { width: number; height: number }
}

export function Window({
  id,
  title,
  children,
  icon = '📱',
  onClose,
  onMinimize,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 800, height: 600 }
}: WindowProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [size, setSize] = useState(initialSize)
  const dragControls = useDragControls()
  const constraintsRef = useRef(null)

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  return (
    <motion.div
      drag={!isMaximized}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={constraintsRef}
      initial={initialPosition}
      animate={
        isMaximized
          ? { x: 0, y: 0, width: '100vw', height: 'calc(100vh - 2rem)' }
          : { width: size.width, height: size.height }
      }
      className="absolute rounded-xl shadow-2xl overflow-hidden bg-white dark:bg-gray-900"
      style={{ top: initialPosition.y, left: initialPosition.x }}
    >
      {/* 标题栏 */}
      <motion.div
        onPointerDown={(e) => {
          if (!isMaximized) {
            dragControls.start(e)
          }
        }}
        className="flex h-12 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl px-4 cursor-move"
      >
        {/* 左侧 - 窗口控制按钮（macOS 风格） */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="group h-3 w-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
          >
            <X size={10} className="opacity-0 group-hover:opacity-100 text-red-900" />
          </button>
          <button
            onClick={onMinimize}
            className="group h-3 w-3 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center"
          >
            <Minus size={10} className="opacity-0 group-hover:opacity-100 text-yellow-900" />
          </button>
          <button
            onClick={handleMaximize}
            className="group h-3 w-3 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center"
          >
            <Maximize2 size={8} className="opacity-0 group-hover:opacity-100 text-green-900" />
          </button>
        </div>

        {/* 中间 - 标题 */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {title}
          </span>
        </div>

        {/* 右侧 - 预留空间 */}
        <div className="w-16" />
      </motion.div>

      {/* 窗口内容 */}
      <div className="h-[calc(100%-3rem)] overflow-auto bg-white dark:bg-gray-900">
        {children}
      </div>

      {/* 调整大小手柄（右下角） */}
      {!isMaximized && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          onDrag={(e, info) => {
            setSize({
              width: Math.max(400, size.width + info.delta.x),
              height: Math.max(300, size.height + info.delta.y)
            })
          }}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        />
      )}
    </motion.div>
  )
}

