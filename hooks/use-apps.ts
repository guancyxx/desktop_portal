'use client'

import { useMemo } from 'react'
import { applications } from '@/config/apps'
import { useAuth } from './use-auth'
import { Application, AppCategory } from '@/types'

export function useApps(category?: AppCategory) {
  const { roles } = useAuth()

  const filteredApps = useMemo(() => {
    let apps = applications.filter(app => {
      // Filter by roles
      if (roles.length === 0) return app.roles.includes('user')
      return app.roles.some(role => roles.includes(role))
    })

    // Filter by category
    if (category && category !== 'all') {
      apps = apps.filter(app => app.category === category)
    }

    return apps.sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [roles, category])

  return {
    apps: filteredApps,
    activeApps: filteredApps.filter(app => app.status === 'active'),
    comingSoonApps: filteredApps.filter(app => app.status === 'coming-soon'),
  }
}

