'use client'

import { useSession } from 'next-auth/react'

export function WelcomeBanner() {
  const { data: session } = useSession()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-white shadow-lg">
      <h1 className="text-3xl font-bold md:text-4xl">
        {getGreeting()}, {session?.user?.name || 'User'}! 👋
      </h1>
      <p className="mt-2 text-lg opacity-90">
        Welcome to your application portal. Select an app to get started.
      </p>
      {session?.roles && session.roles.length > 0 && (
        <p className="mt-4 text-sm opacity-75">
          Your roles: {session.roles.join(', ')}
        </p>
      )}
    </div>
  )
}

