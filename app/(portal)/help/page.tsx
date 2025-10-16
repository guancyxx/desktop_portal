import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Help',
  description: '系统使用与集成的文档总览',
}

export default function HelpPage() {
  return (
    <div className="container max-w-4xl space-y-6 py-8 pb-32">
      <div>
        <h1 className="text-3xl font-bold text-white">帮助文档</h1>
        <p className="text-white/60">系统使用与集成的文档总览</p>
      </div>

      {/* 文档索引 */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">📚 文档索引</CardTitle>
          <CardDescription className="text-white/60">按主题浏览关键文档</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-white/80 text-sm">
          <a href="/docs/user-guide" className="block rounded-lg bg-white/5 hover:bg-white/10 p-3 border border-white/10">
            <div className="font-semibold text-white mb-1">用户指南</div>
            <div className="text-white/60">面向终端用户的使用说明与常见问题</div>
          </a>
          <a href="/docs/setup" className="block rounded-lg bg-white/5 hover:bg-white/10 p-3 border border-white/10">
            <div className="font-semibold text-white mb-1">安装与部署</div>
            <div className="text-white/60">本地/容器部署、环境变量、网络与域名</div>
          </a>
          <a href="/docs/integration" className="block rounded-lg bg-white/5 hover:bg-white/10 p-3 border border-white/10">
            <div className="font-semibold text-white mb-1">系统集成</div>
            <div className="text-white/60">认证登录、单点集成、反向代理与网关</div>
          </a>
          <a href="/docs/admin" className="block rounded-lg bg-white/5 hover:bg-white/10 p-3 border border-white/10">
            <div className="font-semibold text-white mb-1">运维与管理</div>
            <div className="text-white/60">日志、监控、备份恢复、升级策略</div>
          </a>
        </CardContent>
      </Card>

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

      {/* 帮助与支持 */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">🧩 帮助与支持</CardTitle>
          <CardDescription className="text-white/60">获取更多帮助</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-white/80 text-sm">
          <a href="/docs" className="block hover:underline">完整文档目录</a>
          <a href="/docs/faq" className="block hover:underline">常见问题</a>
          <a href="/docs/changelog" className="block hover:underline">更新日志</a>
        </CardContent>
      </Card>
    </div>
  )
}

