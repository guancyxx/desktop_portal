'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { getInitials } from '@/lib/utils'
import { siteConfig } from '@/config/site'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/portal" className="flex items-center space-x-2">
            <span className="text-2xl">🏠</span>
            <span className="hidden font-bold sm:inline-block">{siteConfig.name}</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {session?.user && (
            <>
              <Link href="/profile">
                <Avatar className="h-9 w-9 cursor-pointer transition-transform hover:scale-110">
                  <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                  <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                </Avatar>
              </Link>
              
              <div className="hidden md:block text-sm">
                <p className="font-medium">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

