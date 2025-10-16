'use client'

import { useCallback } from 'react'
import { Application } from '@/types'
import { MenuBar } from './MenuBar'
import { Dock } from './Dock'
import { Launchpad } from './Launchpad'
import { Window } from './Window'
import { Wallpaper } from './Wallpaper'
import { TaskSidebar } from './TaskSidebar'
import { useDesktop } from '@/hooks/use-desktop'
import { useDesktopShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useDesktopStore } from '@/stores/desktop-store'

interface DesktopProps {
  applications: Application[]
  wallpaper?: string
}

export function Desktop({ applications, wallpaper }: DesktopProps) {
  const {
    windows,
    openApp,
    closeWindow,
    minimizeWindow,
    focusWindow,
    isLaunchpadOpen,
    toggleLaunchpad,
    setIsLaunchpadOpen
  } = useDesktop()

  // 从 zustand store 获取任务侧边栏状态
  const isTaskSidebarOpen = useDesktopStore(state => state.isTaskSidebarOpen)
  const toggleTaskSidebar = useDesktopStore(state => state.toggleTaskSidebar)
  const setTaskSidebarOpen = useDesktopStore(state => state.setTaskSidebarOpen)

  // 获取顶层窗口（最前面的窗口）
  const getTopWindow = useCallback(() => {
    return windows
      .filter(w => !w.isMinimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0]
  }, [windows])

  // 键盘快捷键处理器
  const handleWindowClose = useCallback(() => {
    const topWindow = getTopWindow()
    if (topWindow) {
      closeWindow(topWindow.id)
    }
  }, [getTopWindow, closeWindow])

  const handleWindowMinimize = useCallback(() => {
    const topWindow = getTopWindow()
    if (topWindow) {
      minimizeWindow(topWindow.id)
    }
  }, [getTopWindow, minimizeWindow])

  // 注册桌面快捷键
  useDesktopShortcuts({
    onLaunchpadToggle: () => {
      if (isLaunchpadOpen) {
        setIsLaunchpadOpen(false)
      } else {
        toggleLaunchpad()
      }
    },
    onWindowClose: handleWindowClose,
    onWindowMinimize: handleWindowMinimize,
  })

  const handleAppClick = (app: Application) => {
    const isExternalUrl = app.url && (app.url.startsWith('http://') || app.url.startsWith('https://'))
    const isInternalRoute = app.url && app.url.startsWith('/')
    
    // 如果明确指定为 tab 模式，在新标签页打开
    if (app.windowMode === 'tab') {
      if (isExternalUrl) {
        window.open(app.url, '_blank', 'noopener,noreferrer')
      } else if (isInternalRoute) {
        window.location.href = app.url
      }
      return
    }

    // 如果指定为 window 模式，或者是外部URL且未指定为tab，在页面内窗口打开
    if (app.windowMode === 'window' || (isExternalUrl && app.windowMode !== 'tab')) {
      openApp(app)
      return
    }

    // 默认行为：内部路由直接导航，外部URL在窗口内打开
    if (isInternalRoute) {
      window.location.href = app.url
    } else {
      openApp(app)
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 桌面壁纸 */}
      <Wallpaper variant="gradient" />

      {/* 顶部菜单栏 */}
      <MenuBar 
        onOpenHelp={() => {
          // 打开帮助应用（与Dock一致）
          const helpApp = applications.find(a => a.id === 'help')
          if (helpApp) handleAppClick(helpApp)
        }} 
        onOpenSystem={() => {
          const sysApp = applications.find(a => a.id === 'system-settings')
          if (sysApp) handleAppClick(sysApp)
        }} 
        onOpenAbout={() => {
          const aboutApp = applications.find(a => a.id === 'about')
          if (aboutApp) handleAppClick(aboutApp)
        }}
        onToggleTaskSidebar={toggleTaskSidebar}
      />

      {/* 桌面区域 */}
      <div className="relative h-full w-full pt-8 pb-24">
        {/* 打开的窗口 */}
        {windows.filter(w => !w.isMinimized).map(win => {
          const isExternalUrl = win.app.url && (win.app.url.startsWith('http://') || win.app.url.startsWith('https://'))
          const isInternalRoute = win.app.url && win.app.url.startsWith('/')
          
          // 如果是内部路由，构建完整URL用于iframe
          let iframeUrl: string | undefined
          if (isExternalUrl) {
            iframeUrl = win.app.url
          } else if (isInternalRoute) {
            // 使用当前域名构建完整URL（typeof window检查确保在浏览器环境）
            iframeUrl = typeof window !== 'undefined' ? `${window.location.origin}${win.app.url}` : win.app.url
          }
          
          return (
            <Window
              key={win.id}
              id={win.id}
              title={win.app.name}
              icon={win.app.icon}
              url={iframeUrl}
              originalUrl={win.app.url}
              initialPosition={win.position}
              zIndex={win.zIndex}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
            >
              {/* 如果没有URL，显示默认内容 */}
              {!iframeUrl && (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
                  <div className="text-6xl">{win.app.icon}</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {win.app.name}
                  </h2>
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    {win.app.description}
                  </p>
                  {win.app.url && (
                    <a
                      href={win.app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 transition-colors"
                    >
                      打开应用
                    </a>
                  )}
                </div>
              )}
            </Window>
          )
        })}
      </div>

      {/* 底部 Dock */}
      <Dock
        applications={applications}
        onAppClick={handleAppClick}
        activeApps={windows.map(w => w.app.id)}
        onLaunchpadClick={toggleLaunchpad}
      />

      {/* Launchpad 启动台 */}
      <Launchpad
        applications={applications}
        isOpen={isLaunchpadOpen}
        onClose={() => setIsLaunchpadOpen(false)}
        onAppClick={handleAppClick}
      />

      {/* 任务侧边栏 */}
      <TaskSidebar
        isOpen={isTaskSidebarOpen}
        onClose={() => setTaskSidebarOpen(false)}
      />
    </div>
  )
}

