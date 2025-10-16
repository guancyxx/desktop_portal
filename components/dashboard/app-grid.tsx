'use client'

import { useState } from 'react'
import { Application, AppCategory } from '@/types'
import { AppCard } from './app-card'
import { categories } from '@/config/apps'
import { Button } from '@/components/ui/button'

interface AppGridProps {
  apps: Application[]
}

export function AppGrid({ apps }: AppGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('all')

  const filteredApps =
    selectedCategory === 'all'
      ? apps
      : apps.filter(app => app.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id as AppCategory)}
            className="transition-all"
          >
            <span className="mr-2">{category.icon}</span>
            {category.label}
          </Button>
        ))}
      </div>

      {/* Apps Grid */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map((app, index) => (
            <AppCard key={app.id} app={app} index={index} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-center">
            <p className="text-xl font-semibold">No applications found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try selecting a different category
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

