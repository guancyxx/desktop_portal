import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { applications } from '@/config/apps'
import { Desktop } from '@/components/desktop/Desktop'

export const metadata = {
  title: 'Desktop',
  description: 'macOS-style desktop environment',
}

export default async function DesktopPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Filter apps based on user roles
  const userApps = applications.filter(app => {
    if (!session?.roles || session.roles.length === 0) {
      return app.roles.includes('user')
    }
    return app.roles.some(role => session.roles.includes(role))
  })

  return <Desktop applications={userApps} />
}

