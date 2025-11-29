'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus, Star, StarOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateConfigModal } from './CreateConfigModal'
import { EditConfigModal } from './EditConfigModal'
import { useToast } from '@/components/ui/use-toast'

interface CrawlConfig {
  id: string
  name: string
  description?: string
  browserConfig: {
    viewport: { width: number; height: number }
    headless: boolean
    timeout: number
  }
  crawlerConfig: {
    maxDepth: number
    excludePatterns: string[]
    includePatterns: string[]
  }
  llmProvider?: string
  llmModel?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export function ConfigPanel() {
  const [configs, setConfigs] = useState<CrawlConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState<CrawlConfig | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { toast } = useToast()

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/crawl/config')
      if (!response.ok) throw new Error('Failed to fetch configurations')
      const data = await response.json()
      setConfigs(data.configs || [])
    } catch (error) {
      console.error('Error fetching configs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load configurations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return

    try {
      const response = await fetch(`/api/crawl/config/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }

      toast({
        title: 'Success',
        description: 'Configuration deleted successfully',
      })
      fetchConfigs()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/crawl/config/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (!response.ok) throw new Error('Failed to set default')

      toast({
        title: 'Success',
        description: 'Default configuration updated',
      })
      fetchConfigs()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set default configuration',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Crawl Configurations</h2>
          <p className="text-sm text-muted-foreground">
            Manage your crawling behavior presets
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Configuration
        </Button>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No configurations yet. Create your first one!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{config.name}</CardTitle>
                      {config.isDefault && (
                        <Badge variant="default">
                          <Star className="mr-1 h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {config.description && (
                      <CardDescription className="mt-1">
                        {config.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!config.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetDefault(config.id)}
                        title="Set as default"
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingConfig(config)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Browser</p>
                    <p>
                      {config.browserConfig.viewport.width}x
                      {config.browserConfig.viewport.height},{' '}
                      {config.browserConfig.headless ? 'Headless' : 'Visible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Crawler</p>
                    <p>Max Depth: {config.crawlerConfig.maxDepth}</p>
                  </div>
                  {config.llmProvider && (
                    <div>
                      <p className="text-muted-foreground">LLM</p>
                      <p>
                        {config.llmProvider}/{config.llmModel}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateConfigModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchConfigs}
      />

      {editingConfig && (
        <EditConfigModal
          config={editingConfig}
          open={!!editingConfig}
          onClose={() => setEditingConfig(null)}
          onSuccess={fetchConfigs}
        />
      )}
    </div>
  )
}
