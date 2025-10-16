/**
 * Keyboard Shortcuts Hook - 键盘快捷键管理
 * 
 * 提供全局键盘快捷键支持
 */
'use client'

import { useEffect } from 'react'
import { useDesktopStore } from '@/stores/desktop-store'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
}

/**
 * 使用键盘快捷键
 */
export function useKeyboardShortcuts() {
  const { toggleLaunchpad, setLaunchpadOpen, getTopWindow, closeWindow } = useDesktopStore()
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F4 或 Cmd/Ctrl+L 打开/关闭 Launchpad
      if (e.key === 'F4' || ((e.metaKey || e.ctrlKey) && e.key === 'l')) {
        e.preventDefault()
        toggleLaunchpad()
        return
      }
      
      // Cmd/Ctrl+W 关闭当前窗口
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        const topWindow = getTopWindow()
        if (topWindow) {
          closeWindow(topWindow.id)
        }
        return
      }
      
      // Escape 关闭 Launchpad
      if (e.key === 'Escape') {
        setLaunchpadOpen(false)
        return
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleLaunchpad, setLaunchpadOpen, getTopWindow, closeWindow])
}

/**
 * 通用键盘快捷键 Hook
 */
export function useKeyboardShortcut(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === e.ctrlKey
        const metaMatch = shortcut.meta === undefined || shortcut.meta === e.metaKey
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === e.shiftKey
        const altMatch = shortcut.alt === undefined || shortcut.alt === e.altKey
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
        
        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault()
          shortcut.handler()
          break
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

