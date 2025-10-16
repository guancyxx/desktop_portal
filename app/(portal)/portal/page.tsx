import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { applications } from '@/config/apps'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { AppGrid } from '@/components/dashboard/app-grid'
import Link from 'next/link'

export const metadata = {
  title: 'Portal Dashboard',
  description: 'Your application workspace',
}

export default async function PortalPage() {
  const session = await getServerSession(authOptions)

  // Filter apps based on user roles
  const userApps = applications
    .filter(app => {
      if (!session?.roles || session.roles.length === 0) return app.roles.includes('user')
      return app.roles.some(role => session.roles.includes(role))
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className="container space-y-8 py-8">
      <WelcomeBanner />
      
      <StatsOverview />

      {/* 视图切换按钮 */}
      <div className="flex justify-center">
        <Link
          href="/desktop"
          className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-8 py-4 text-white shadow-2xl transition-all hover:shadow-3xl hover:scale-105"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative text-2xl">🖥️</span>
          <div className="relative">
            <p className="text-lg font-bold">切换到 macOS 桌面模式</p>
            <p className="text-xs opacity-90">体验流畅的桌面操作系统</p>
          </div>
        </Link>
      </div>

      <StatsOverview />

      <div>
        <h2 className="mb-6 text-2xl font-bold">My Applications</h2>
        <AppGrid apps={userApps} />
      </div>
    </div>
  )
}

