'use client'

import { useState, useEffect, useCallback } from 'react'
import { Application } from '@/types'

export interface OpenWindow {
  id: string
  app: Application
  position: { x: number; y: number }
  size: { width: number; height: number }
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
}

export function useDesktop() {
  const [windows, setWindows] = useState<OpenWindow[]>([])
  const [nextZIndex, setNextZIndex] = useState(100)
  const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(false)

  // 聚焦窗口
  const focusWindow = useCallback((windowId: string) => {
    setWindows(prevWindows => prevWindows.map(w =>
      w.id === windowId ? { ...w, zIndex: nextZIndex } : w
    ))
    setNextZIndex(prev => prev + 1)
  }, [nextZIndex])

  // 恢复窗口
  const restoreWindow = useCallback((windowId: string) => {
    setWindows(prevWindows => prevWindows.map(w =>
      w.id === windowId ? { ...w, isMinimized: false, zIndex: nextZIndex } : w
    ))
    setNextZIndex(prev => prev + 1)
  }, [nextZIndex])

  // 打开应用
  const openApp = useCallback((app: Application) => {
    // 检查窗口是否已打开
    const existingWindow = windows.find(w => w.app.id === app.id)
    
    if (existingWindow) {
      // 如果窗口被最小化，恢复它
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id)
      } else {
        // 否则只聚焦
        focusWindow(existingWindow.id)
      }
      return
    }

    // 创建新窗口
    const newWindow: OpenWindow = {
      id: `window-${app.id}-${Date.now()}`,
      app,
      position: {
        x: 50 + windows.length * 30,
        y: 80 + windows.length * 30
      },
      size: { width: 900, height: 600 },
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex
    }

    setWindows([...windows, newWindow])
    setNextZIndex(nextZIndex + 1)
  }, [windows, nextZIndex, restoreWindow, focusWindow])

  // 关闭窗口
  const closeWindow = useCallback((windowId: string) => {
    setWindows(windows.filter(w => w.id !== windowId))
  }, [windows])

  // 最小化窗口
  const minimizeWindow = useCallback((windowId: string) => {
    setWindows(windows.map(w =>
      w.id === windowId ? { ...w, isMinimized: true } : w
    ))
  }, [windows])

  // 最大化/还原窗口
  const toggleMaximize = useCallback((windowId: string) => {
    setWindows(windows.map(w =>
      w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w
    ))
  }, [windows])

  // 切换 Launchpad
  const toggleLaunchpad = useCallback(() => {
    setIsLaunchpadOpen(!isLaunchpadOpen)
  }, [isLaunchpadOpen])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F4 或 Cmd/Ctrl+L 打开 Launchpad
      if (e.key === 'F4' || ((e.metaKey || e.ctrlKey) && e.key === 'l')) {
        e.preventDefault()
        toggleLaunchpad()
      }

      // Cmd/Ctrl+W 关闭当前窗口
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        const topWindow = [...windows]
          .sort((a, b) => b.zIndex - a.zIndex)
          .find(w => !w.isMinimized)
        if (topWindow) {
          closeWindow(topWindow.id)
        }
      }

      // Escape 关闭 Launchpad
      if (e.key === 'Escape' && isLaunchpadOpen) {
        setIsLaunchpadOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [windows, isLaunchpadOpen, closeWindow, toggleLaunchpad])

  return {
    windows,
    openApp,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    focusWindow,
    isLaunchpadOpen,
    toggleLaunchpad,
    setIsLaunchpadOpen
  }
}

