'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Application } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AppCardProps {
  app: Application
  index: number
}

export function AppCard({ app, index }: AppCardProps) {
  const isExternal = app.url.startsWith('http')
  const isComingSoon = app.status === 'coming-soon'
  const isDisabled = app.status === 'disabled'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        className={`group h-full transition-all duration-300 hover:shadow-xl ${
          isDisabled ? 'opacity-50' : ''
        }`}
        style={{
          borderTop: `3px solid ${app.color}`,
        }}
      >
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl shadow-sm transition-transform group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${app.color}20, ${app.color}40)`,
              }}
            >
              {app.icon}
            </div>
            {isComingSoon && <Badge variant="warning">Coming Soon</Badge>}
            {app.status === 'active' && <Badge variant="success">Active</Badge>}
          </div>

          <div>
            <CardTitle className="text-xl">{app.name}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">{app.description}</CardDescription>
          </div>

          <div className="flex flex-wrap gap-1">
            {app.roles.map(role => (
              <Badge key={role} variant="outline" className="text-xs">
                {role}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardFooter>
          {isComingSoon || isDisabled ? (
            <Button className="w-full" disabled>
              {isComingSoon ? 'Coming Soon' : 'Disabled'}
            </Button>
          ) : (
            <Button
              className="w-full transition-all duration-300"
              style={{
                backgroundColor: app.color,
              }}
              asChild
            >
              <Link href={app.url} target={isExternal ? '_blank' : undefined}>
                Open Application
                {isExternal && <span className="ml-2">↗</span>}
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}

