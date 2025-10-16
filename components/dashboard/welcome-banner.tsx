'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export function WelcomeBanner() {
  const { data: session } = useSession()
  const [greeting, setGreeting] = useState('Hello')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')
  }, [])

  // 避免 hydration 不匹配，在挂载前使用通用问候语
  if (!mounted) {
    return (
      <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold md:text-4xl">
          Hello, {session?.user?.name || 'User'}! 👋
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

  return (
    <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-white shadow-lg">
      <h1 className="text-3xl font-bold md:text-4xl">
        {greeting}, {session?.user?.name || 'User'}! 👋
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

