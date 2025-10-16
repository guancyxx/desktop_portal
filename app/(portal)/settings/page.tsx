import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggleCard } from '@/components/settings/theme-toggle-card'

export const metadata = {
  title: 'Settings',
  description: 'Configure your preferences and system settings',
}

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and application settings</p>
      </div>

      {/* Appearance */}
      <ThemeToggleCard />

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receive updates via email
              </p>
            </div>
            <div className="text-sm text-muted-foreground">Coming soon</div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h4 className="font-medium">Push Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receive browser notifications
              </p>
            </div>
            <div className="text-sm text-muted-foreground">Coming soon</div>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
          <CardDescription>Set your preferred language and region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4">
            <h4 className="font-medium">Language</h4>
            <p className="mt-1 text-sm text-muted-foreground">English (US)</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Multi-language support coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

