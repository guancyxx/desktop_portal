'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Stat {
  title: string
  value: string | number
  icon: string
  change?: string
}

const stats: Stat[] = [
  {
    title: 'Active Applications',
    value: 6,
    icon: '📱',
    change: '+2 this week',
  },
  {
    title: 'Active Sessions',
    value: 1,
    icon: '🔐',
  },
  {
    title: 'Tasks Pending',
    value: 12,
    icon: '📋',
    change: '4 due today',
  },
  {
    title: 'AI Requests',
    value: 28,
    icon: '🤖',
    change: '+12 today',
  },
]

export function StatsOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <span className="text-2xl">{stat.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change && <p className="text-xs text-muted-foreground">{stat.change}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

