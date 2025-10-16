/**
 * Desktop Components - 桌面组件导出
 * 
 * 使用动态导入实现代码分割和懒加载
 */
import dynamic from 'next/dynamic'

// 主 Desktop 组件（立即加载）
export { Desktop } from './Desktop'

// 懒加载 Launchpad（非关键组件）
export const Launchpad = dynamic(
  () => import('./Launchpad').then(mod => ({ default: mod.Launchpad })),
  {
    loading: () => (
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xl flex items-center justify-center">
        <div className="text-white text-lg">加载中...</div>
      </div>
    ),
    ssr: false // Launchpad 不需要服务端渲染
  }
)

// 懒加载 Window 组件
export const Window = dynamic(
  () => import('./Window').then(mod => ({ default: mod.Window })),
  {
    loading: () => (
      <div className="absolute bg-white dark:bg-gray-900 rounded-lg shadow-2xl">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex items-center px-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">加载中...</div>
        </div>
      </div>
    ),
    ssr: false
  }
)

// 立即加载的组件
export { MenuBar } from './MenuBar'
export { Dock } from './Dock'
export { Wallpaper } from './Wallpaper'
