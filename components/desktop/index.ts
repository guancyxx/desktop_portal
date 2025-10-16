/**
 * Desktop Components - 桌面组件索引
 * 
 * 使用动态导入实现代码分割和懒加载
 */
import dynamic from 'next/dynamic'

// 主桌面组件（不懒加载，因为是核心组件）
export { Desktop } from './Desktop'

// 懒加载非关键组件
export const Launchpad = dynamic(
  () => import('./Launchpad').then(mod => ({ default: mod.Launchpad })),
  {
    loading: () => (
      <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-3xl flex items-center justify-center">
        <div className="text-white text-lg">加载中...</div>
      </div>
    ),
    ssr: false // Launchpad 不需要 SSR
  }
)

export const Window = dynamic(
  () => import('./Window').then(mod => ({ default: mod.Window })),
  {
    loading: () => (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    ),
    ssr: false
  }
)

// 导出其他不需要懒加载的组件
export { Dock } from './Dock'
export { MenuBar } from './MenuBar'
export { Wallpaper } from './Wallpaper'
