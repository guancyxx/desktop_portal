'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface CrawlConfig {
  id: string
  name: string
  isDefault: boolean
}

interface ConfigSelectorProps {
  value?: string
  onChange: (configId: string) => void
  label?: string
}

export function ConfigSelector({ value, onChange, label }: ConfigSelectorProps) {
  const [configs, setConfigs] = useState<CrawlConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const response = await fetch('/api/crawl/config')
        if (!response.ok) throw new Error('Failed to fetch configs')
        
        const data = await response.json()
        setConfigs(data.configs || [])
        
        // Auto-select default config if no value is set
        if (!value && data.configs) {
          const defaultConfig = data.configs.find((c: CrawlConfig) => c.isDefault)
          if (defaultConfig) {
            onChange(defaultConfig.id)
          }
        }
      } catch (error) {
        console.error('Error fetching configs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConfigs()
  }, [value, onChange])

  if (loading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading configurations..." />
          </SelectTrigger>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="config-select">{label}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="config-select">
          <SelectValue placeholder="Select a configuration" />
        </SelectTrigger>
        <SelectContent>
          {configs.map((config) => (
            <SelectItem key={config.id} value={config.id}>
              {config.name}
              {config.isDefault && ' (Default)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {configs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No configurations available. Please create one first.
        </p>
      )}
    </div>
  )
}
