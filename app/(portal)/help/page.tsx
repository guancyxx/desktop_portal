import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Help',
  description: 'Help and information about DreamBuilder Portal',
}

export default function HelpPage() {
  return (
    <div className="container max-w-4xl space-y-6 py-8 pb-32">
      <div>
        <h1 className="text-3xl font-bold text-white">帮助中心</h1>
        <p className="text-white/60">了解如何使用 DreamBuilder Portal</p>
      </div>

      {/* 快速开始 */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">🚀 快速开始</CardTitle>
          <CardDescription className="text-white/60">开始使用 DreamBuilder Desktop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-white/80">
          <div>
            <h3 className="font-semibold text-white mb-2">基本操作</h3>
            <ul className="space-y-2 text-sm">
              <li>• 点击 Dock 中的应用图标打开应用</li>
              <li>• 点击 🚀 Launchpad 查看所有应用</li>
              <li>• 拖拽窗口标题栏移动窗口</li>
              <li>• 点击窗口三色按钮控制窗口</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 键盘快捷键 */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">⌨️ 键盘快捷键</CardTitle>
          <CardDescription className="text-white/60">提高使用效率</CardDescription>
        </CardHeader>
        <CardContent className="text-white/80">
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span>打开/关闭 Launchpad</span>
              <code className="bg-white/10 px-2 py-1 rounded">F4</code>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span>打开/关闭 Launchpad</span>
              <code className="bg-white/10 px-2 py-1 rounded">Cmd/Ctrl + L</code>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span>关闭 Launchpad</span>
              <code className="bg-white/10 px-2 py-1 rounded">ESC</code>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>关闭当前窗口</span>
              <code className="bg-white/10 px-2 py-1 rounded">Cmd/Ctrl + W</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 窗口控制 */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">🪟 窗口控制</CardTitle>
          <CardDescription className="text-white/60">管理应用窗口</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-white/80">
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-full bg-red-500" />
              </div>
              <span>关闭窗口</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
              </div>
              <span>最小化窗口</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span>最大化/还原窗口</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 系统信息 */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">ℹ️ 系统信息</CardTitle>
          <CardDescription className="text-white/60">关于 DreamBuilder Portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-white/80 text-sm">
          <div>
            <h3 className="font-semibold text-white mb-2">版本信息</h3>
            <ul className="space-y-1">
              <li>• 版本: v1.0.0</li>
              <li>• 构建日期: 2025-10-16</li>
              <li>• 设计风格: macOS Big Sur / Monterey</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">技术栈</h3>
            <ul className="space-y-1">
              <li>• 框架: <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Next.js 14</a></li>
              <li>• 认证: <a href="https://www.keycloak.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Keycloak</a></li>
              <li>• 动画: Framer Motion</li>
              <li>• 样式: Tailwind CSS</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-center text-xs text-white/60">
              © 2025 DreamBuilder Portal. Built with Next.js 14. Powered by Keycloak.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

