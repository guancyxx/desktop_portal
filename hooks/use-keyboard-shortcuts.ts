/**
 * Keyboard Shortcuts Hook - 键盘快捷键
 * 
 * 提供全局键盘快捷键支持
 */
'use client'

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: (event: KeyboardEvent) => void
  description?: string
}

/**
 * 注册键盘快捷键
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    for (const shortcut of shortcuts) {
      // 检查修饰键
      const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === event.ctrlKey
      const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey
      const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey
      const metaMatch = shortcut.meta === undefined || shortcut.meta === event.metaKey
      
      // 检查按键
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
      
      // 如果所有条件都匹配
      if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.handler(event)
        break
      }
    }
  }, [shortcuts, enabled])
  
  useEffect(() => {
    if (!enabled) return
    
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * 桌面快捷键预设
 */
export function useDesktopShortcuts(handlers: {
  onLaunchpadToggle?: () => void
  onWindowClose?: () => void
  onWindowMinimize?: () => void
  onWindowMaximize?: () => void
  onSearchFocus?: () => void
}) {
  const shortcuts: KeyboardShortcut[] = [
    // Cmd/Ctrl + Space: 打开/关闭启动台
    {
      key: ' ',
      meta: true,
      handler: () => handlers.onLaunchpadToggle?.(),
      description: '打开/关闭启动台'
    },
    // Cmd/Ctrl + W: 关闭当前窗口
    {
      key: 'w',
      meta: true,
      handler: () => handlers.onWindowClose?.(),
      description: '关闭当前窗口'
    },
    // Cmd/Ctrl + M: 最小化窗口
    {
      key: 'm',
      meta: true,
      handler: () => handlers.onWindowMinimize?.(),
      description: '最小化窗口'
    },
    // Cmd/Ctrl + Shift + F: 全屏/退出全屏
    {
      key: 'f',
      meta: true,
      shift: true,
      handler: () => handlers.onWindowMaximize?.(),
      description: '切换全屏'
    },
    // Cmd/Ctrl + K: 聚焦搜索
    {
      key: 'k',
      meta: true,
      handler: () => handlers.onSearchFocus?.(),
      description: '聚焦搜索'
    },
    // Escape: 关闭启动台或窗口
    {
      key: 'Escape',
      handler: () => {
        handlers.onLaunchpadToggle?.()
      },
      description: '关闭启动台'
    }
  ]
  
  useKeyboardShortcuts(shortcuts, true)
  
  return shortcuts
}

/**
 * 导航快捷键（方向键）
 */
export function useNavigationShortcuts(
  items: HTMLElement[],
  onSelect?: (item: HTMLElement) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || items.length === 0) return
    
    let currentIndex = 0
    
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          currentIndex = (currentIndex + 1) % items.length
          items[currentIndex]?.focus()
          break
          
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          currentIndex = (currentIndex - 1 + items.length) % items.length
          items[currentIndex]?.focus()
          break
          
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (items[currentIndex] && onSelect) {
            onSelect(items[currentIndex])
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [items, onSelect, enabled])
}

/**
 * 快捷键帮助文本
 */
export function getShortcutText(shortcut: KeyboardShortcut): string {
  const keys: string[] = []
  
  if (shortcut.ctrl) keys.push('Ctrl')
  if (shortcut.shift) keys.push('Shift')
  if (shortcut.alt) keys.push('Alt')
  if (shortcut.meta) keys.push('⌘')
  
  keys.push(shortcut.key.toUpperCase())
  
  return keys.join(' + ')
}
