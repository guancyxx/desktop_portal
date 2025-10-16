import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'

export const metadata = {
  title: 'User Profile',
  description: 'Manage your profile and account settings',
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="container max-w-4xl space-y-6 py-8 pb-32">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-white/60">Manage your account information and preferences</p>
      </div>

      {/* Profile Overview */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Personal Information</CardTitle>
          <CardDescription className="text-white/60">Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
              <AvatarFallback className="text-2xl">
                {getInitials(session.user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl font-semibold text-white">{session.user.name}</h3>
              <p className="text-white/60">{session.user.email}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Username</label>
              <p className="text-sm text-white/60">
                {session.user.name || 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email</label>
              <p className="text-sm text-white/60">
                {session.user.email || 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles & Permissions */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Roles & Permissions</CardTitle>
          <CardDescription className="text-white/60">Your assigned roles in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {session.roles && session.roles.length > 0 ? (
              session.roles.map(role => (
                <Badge key={role} variant="secondary" className="px-3 py-1">
                  {role}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-white/60">No roles assigned</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Account Security</CardTitle>
          <CardDescription className="text-white/60">Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <h4 className="font-medium text-white">Password</h4>
              <p className="text-sm text-white/60">
                Last changed: Managed by Keycloak
              </p>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'}/realms/Dreambuilder/account`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-400 hover:underline"
            >
              Manage in Keycloak
            </a>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <h4 className="font-medium text-white">Two-Factor Authentication</h4>
              <p className="text-sm text-white/60">
                Add an extra layer of security
              </p>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'}/realms/Dreambuilder/account`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-400 hover:underline"
            >
              Configure
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

