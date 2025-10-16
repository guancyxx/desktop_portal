import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggleCard } from '@/components/settings/theme-toggle-card'

export const metadata = {
  title: 'Settings',
  description: 'Configure your preferences and system settings',
}

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl space-y-6 py-8 pb-32">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/60">Manage your preferences and application settings</p>
      </div>

      {/* Appearance */}
      <ThemeToggleCard />

      {/* Notifications */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Notifications</CardTitle>
          <CardDescription className="text-white/60">Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <h4 className="font-medium text-white">Email Notifications</h4>
              <p className="text-sm text-white/60">
                Receive updates via email
              </p>
            </div>
            <div className="text-sm text-white/40">Coming soon</div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <h4 className="font-medium text-white">Push Notifications</h4>
              <p className="text-sm text-white/60">
                Receive browser notifications
              </p>
            </div>
            <div className="text-sm text-white/40">Coming soon</div>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Language & Region</CardTitle>
          <CardDescription className="text-white/60">Set your preferred language and region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="font-medium text-white">Language</h4>
            <p className="mt-1 text-sm text-white/60">English (US)</p>
            <p className="mt-2 text-xs text-white/40">
              Multi-language support coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

