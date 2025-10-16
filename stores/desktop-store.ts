/**
 * Desktop Store - 使用 Zustand 管理桌面窗口状态
 * 
 * 特性：
 * - 不可变状态更新（使用 immer）
 * - 状态持久化（localStorage）
 * - DevTools 支持
 */
import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
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

interface DesktopState {
  // 状态
  windows: OpenWindow[]
  nextZIndex: number
  isLaunchpadOpen: boolean
  isTaskSidebarOpen: boolean
  
  // 操作方法
  openApp: (app: Application) => void
  closeWindow: (windowId: string) => void
  minimizeWindow: (windowId: string) => void
  restoreWindow: (windowId: string) => void
  toggleMaximize: (windowId: string) => void
  focusWindow: (windowId: string) => void
  toggleLaunchpad: () => void
  setLaunchpadOpen: (isOpen: boolean) => void
  toggleTaskSidebar: () => void
  setTaskSidebarOpen: (isOpen: boolean) => void
  
  // 计算属性
  getActiveApps: () => string[]
  getWindowByAppId: (appId: string) => OpenWindow | undefined
  getTopWindow: () => OpenWindow | undefined
}

export const useDesktopStore = create<DesktopState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 初始状态
        windows: [],
        nextZIndex: 100,
        isLaunchpadOpen: false,
        isTaskSidebarOpen: false,
        
        // 打开应用
        openApp: (app) => {
          const state = get()
          const existingWindow = state.windows.find(w => w.app.id === app.id)
          
          // 如果窗口已存在
          if (existingWindow) {
            if (existingWindow.isMinimized) {
              // 恢复最小化的窗口
              set((draft) => {
                const window = draft.windows.find(w => w.id === existingWindow.id)
                if (window) {
                  window.isMinimized = false
                  window.zIndex = draft.nextZIndex
                  draft.nextZIndex++
                }
              })
            } else {
              // 聚焦现有窗口
              set((draft) => {
                const window = draft.windows.find(w => w.id === existingWindow.id)
                if (window) {
                  window.zIndex = draft.nextZIndex
                  draft.nextZIndex++
                }
              })
            }
            return
          }
          
          // 创建新窗口
          set((draft) => {
            const newWindow: OpenWindow = {
              id: `window-${app.id}-${Date.now()}`,
              app,
              position: {
                x: 50 + draft.windows.length * 30,
                y: 80 + draft.windows.length * 30
              },
              size: { width: 900, height: 600 },
              isMinimized: false,
              isMaximized: false,
              zIndex: draft.nextZIndex
            }
            draft.windows.push(newWindow)
            draft.nextZIndex++
          })
        },
        
        // 关闭窗口
        closeWindow: (windowId) => {
          set((draft) => {
            draft.windows = draft.windows.filter(w => w.id !== windowId)
          })
        },
        
        // 最小化窗口
        minimizeWindow: (windowId) => {
          set((draft) => {
            const window = draft.windows.find(w => w.id === windowId)
            if (window) {
              window.isMinimized = true
            }
          })
        },
        
        // 恢复窗口
        restoreWindow: (windowId) => {
          set((draft) => {
            const window = draft.windows.find(w => w.id === windowId)
            if (window) {
              window.isMinimized = false
              window.zIndex = draft.nextZIndex
              draft.nextZIndex++
            }
          })
        },
        
        // 切换最大化
        toggleMaximize: (windowId) => {
          set((draft) => {
            const window = draft.windows.find(w => w.id === windowId)
            if (window) {
              window.isMaximized = !window.isMaximized
            }
          })
        },
        
        // 聚焦窗口
        focusWindow: (windowId) => {
          set((draft) => {
            const window = draft.windows.find(w => w.id === windowId)
            if (window) {
              window.zIndex = draft.nextZIndex
              draft.nextZIndex++
            }
          })
        },
        
        // 切换启动台
        toggleLaunchpad: () => {
          set((draft) => {
            draft.isLaunchpadOpen = !draft.isLaunchpadOpen
          })
        },
        
        // 设置启动台状态
        setLaunchpadOpen: (isOpen) => {
          set((draft) => {
            draft.isLaunchpadOpen = isOpen
          })
        },
        
        // 切换任务侧边栏
        toggleTaskSidebar: () => {
          set((draft) => {
            draft.isTaskSidebarOpen = !draft.isTaskSidebarOpen
          })
        },
        
        // 设置任务侧边栏状态
        setTaskSidebarOpen: (isOpen) => {
          set((draft) => {
            draft.isTaskSidebarOpen = isOpen
          })
        },
        
        // 获取活动应用ID列表
        getActiveApps: () => {
          return get().windows.map(w => w.app.id)
        },
        
        // 根据应用ID获取窗口
        getWindowByAppId: (appId) => {
          return get().windows.find(w => w.app.id === appId)
        },
        
        // 获取顶层窗口
        getTopWindow: () => {
          const windows = get().windows
          return [...windows]
            .sort((a, b) => b.zIndex - a.zIndex)
            .find(w => !w.isMinimized)
        }
      })),
      {
        name: 'desktop-storage',
        // 只持久化窗口状态和 zIndex
        partialize: (state) => ({
          windows: state.windows,
          nextZIndex: state.nextZIndex
        })
      }
    ),
    { name: 'DesktopStore' }
  )
)

