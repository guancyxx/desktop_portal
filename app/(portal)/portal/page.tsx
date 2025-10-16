import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { applications } from '@/config/apps'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { AppGrid } from '@/components/dashboard/app-grid'

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

      <div>
        <h2 className="mb-6 text-2xl font-bold">My Applications</h2>
        <AppGrid apps={userApps} />
      </div>
    </div>
  )
}

