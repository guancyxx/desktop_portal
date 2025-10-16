'use client'

import { useState, useRef } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { X, Minimize2, Maximize2, Minus, ExternalLink } from 'lucide-react'

interface WindowProps {
  id: string
  title: string
  children?: React.ReactNode
  icon?: string
  url?: string
  originalUrl?: string // 原始URL，用于"在新标签页打开"功能
  onClose: () => void
  onMinimize?: () => void
  initialPosition?: { x: number; y: number }
  initialSize?: { width: number; height: number }
  zIndex?: number
}

export function Window({
  id,
  title,
  children,
  icon = '📱',
  url,
  originalUrl,
  onClose,
  onMinimize,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 800, height: 600 },
  zIndex
}: WindowProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [size, setSize] = useState(initialSize)
  const dragControls = useDragControls()

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  const handleOpenInNewTab = () => {
    // 优先使用originalUrl，这样内部路由可以在同一窗口打开
    const targetUrl = originalUrl || url
    if (targetUrl) {
      if (targetUrl.startsWith('/')) {
        // 内部路由在当前窗口打开
        window.open(targetUrl, '_blank')
      } else {
        // 外部URL在新标签页打开
        window.open(targetUrl, '_blank', 'noopener,noreferrer')
      }
    }
  }

  return (
    <motion.div
      drag={!isMaximized}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      initial={{ 
        x: initialPosition.x, 
        y: initialPosition.y,
        width: initialSize.width,
        height: initialSize.height
      }}
      animate={
        isMaximized
          ? { 
              x: 0, // 清除x偏移
              y: 0, // 清除y偏移
              top: 32, // 紧贴菜单栏下方
              left: 0, // 紧贴左边
              width: '100vw', 
              height: 'calc(100vh - 2rem)', // 全屏高度减去菜单栏
              borderRadius: 0
            }
          : { 
              x: initialPosition.x,
              y: initialPosition.y,
              width: size.width, 
              height: size.height,
              borderRadius: 12
            }
      }
      className={`${isMaximized ? 'fixed' : 'absolute'} shadow-2xl overflow-hidden bg-white dark:bg-gray-900`}
      style={zIndex ? { zIndex } : undefined}
    >
      {/* 标题栏 */}
      <div className="flex h-12 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl px-4">
        {/* 左侧 - 窗口控制按钮（macOS 风格） */}
        <div className="flex items-center gap-2 z-10">
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

        {/* 中间 - 标题（可拖拽区域） */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 cursor-move px-8"
          onPointerDown={(e) => {
            if (!isMaximized) {
              dragControls.start(e)
            }
          }}
        >
          <span className="text-lg pointer-events-none">{icon}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 pointer-events-none">
            {title}
          </span>
        </div>

        {/* 右侧 - 在新标签页打开按钮 */}
        <div className="flex items-center gap-2 z-10">
          {(url || originalUrl) && (
            <button
              onClick={handleOpenInNewTab}
              className="group flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="在新标签页打开"
            >
              <ExternalLink size={14} className="text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* 窗口内容 */}
      <div className="h-[calc(100%-3rem)] overflow-hidden bg-white dark:bg-gray-900">
        {url ? (
          <iframe
            src={url}
            className="h-full w-full border-0"
            title={title}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-top-navigation"
            allow="camera; microphone; geolocation; clipboard-read; clipboard-write"
          />
        ) : (
          <div className="h-full overflow-auto">
            {children}
          </div>
        )}
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

