import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { GradientBackground } from '@/components/gradient-background'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <GradientBackground />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

