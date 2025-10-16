'use client'

import { Application } from '@/types'
import { MenuBar } from './MenuBar'
import { Dock } from './Dock'
import { Launchpad } from './Launchpad'
import { Window } from './Window'
import { Wallpaper } from './Wallpaper'
import { useDesktop } from '@/hooks/use-desktop'

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

  const handleAppClick = (app: Application) => {
    // 如果是外部 URL，在新窗口打开
    if (app.url && (app.url.startsWith('http://') || app.url.startsWith('https://'))) {
      window.open(app.url, '_blank')
      return
    }

    // 如果是内部路由，导航到该路由
    if (app.url && app.url.startsWith('/')) {
      window.location.href = app.url
      return
    }

    // 打开应用窗口
    openApp(app)
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 桌面壁纸 */}
      <Wallpaper variant="gradient" />

      {/* 顶部菜单栏 */}
      <MenuBar />

      {/* 桌面区域 */}
      <div className="relative h-full w-full pt-8 pb-24">
        {/* 打开的窗口 */}
        {windows.filter(w => !w.isMinimized).map(window => (
          <Window
            key={window.id}
            id={window.id}
            title={window.app.name}
            icon={window.app.icon}
            initialPosition={window.position}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => minimizeWindow(window.id)}
          >
            {/* 窗口内容 */}
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
              <div className="text-6xl">{window.app.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {window.app.name}
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400">
                {window.app.description}
              </p>
              {window.app.url && (
                <a
                  href={window.app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 transition-colors"
                >
                  打开应用
                </a>
              )}
            </div>
          </Window>
        ))}
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
    </div>
  )
}

