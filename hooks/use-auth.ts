'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    session,
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    roles: session?.roles || [],
    hasRole: (role: string) => session?.roles?.includes(role) || false,
    hasAnyRole: (roles: string[]) => roles.some(role => session?.roles?.includes(role)) || false,
  }
}

