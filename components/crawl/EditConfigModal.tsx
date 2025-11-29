'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const configSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  viewport_width: z.number().min(320).max(3840),
  viewport_height: z.number().min(240).max(2160),
  headless: z.boolean(),
  timeout: z.number().min(1000).max(120000),
  max_depth: z.number().min(1).max(10),
  exclude_patterns: z.string().optional(),
  include_patterns: z.string().optional(),
  llm_provider: z.string().optional(),
  llm_model: z.string().optional(),
  isDefault: z.boolean(),
})

type ConfigFormData = z.infer<typeof configSchema>

interface EditConfigModalProps {
  config: any
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditConfigModal({
  config,
  open,
  onClose,
  onSuccess,
}: EditConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
  })

  const headless = watch('headless')
  const isDefault = watch('isDefault')

  useEffect(() => {
    if (config) {
      reset({
        name: config.name,
        description: config.description || '',
        viewport_width: config.browserConfig.viewport.width,
        viewport_height: config.browserConfig.viewport.height,
        headless: config.browserConfig.headless,
        timeout: config.browserConfig.timeout,
        max_depth: config.crawlerConfig.maxDepth,
        exclude_patterns: config.crawlerConfig.excludePatterns?.join('\n') || '',
        include_patterns: config.crawlerConfig.includePatterns?.join('\n') || '',
        llm_provider: config.llmProvider || '',
        llm_model: config.llmModel || '',
        isDefault: config.isDefault,
      })
    }
  }, [config, reset])

  const onSubmit = async (data: ConfigFormData) => {
    try {
      setLoading(true)

      const payload = {
        name: data.name,
        description: data.description,
        browserConfig: {
          viewport: {
            width: data.viewport_width,
            height: data.viewport_height,
          },
          headless: data.headless,
          timeout: data.timeout,
        },
        crawlerConfig: {
          maxDepth: data.max_depth,
          excludePatterns: data.exclude_patterns
            ? data.exclude_patterns.split('\n').filter(Boolean)
            : [],
          includePatterns: data.include_patterns
            ? data.include_patterns.split('\n').filter(Boolean)
            : [],
        },
        llmProvider: data.llm_provider || undefined,
        llmModel: data.llm_model || undefined,
        isDefault: data.isDefault,
      }

      const response = await fetch(`/api/crawl/config/${config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update configuration')
      }

      toast({
        title: 'Success',
        description: 'Configuration updated successfully',
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Configuration</DialogTitle>
          <DialogDescription>
            Update crawling behavior settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Configuration Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Default Config"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setValue('isDefault', checked)}
              />
              <Label htmlFor="isDefault">Set as default configuration</Label>
            </div>
          </div>

          {/* Browser Config */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Browser Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="viewport_width">Viewport Width</Label>
                <Input
                  id="viewport_width"
                  type="number"
                  {...register('viewport_width', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="viewport_height">Viewport Height</Label>
                <Input
                  id="viewport_height"
                  type="number"
                  {...register('viewport_height', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                {...register('timeout', { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="headless"
                checked={headless}
                onCheckedChange={(checked) => setValue('headless', checked)}
              />
              <Label htmlFor="headless">Headless mode</Label>
            </div>
          </div>

          {/* Crawler Config */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Crawler Settings</h3>
            
            <div>
              <Label htmlFor="max_depth">Max Crawl Depth</Label>
              <Input
                id="max_depth"
                type="number"
                {...register('max_depth', { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="exclude_patterns">
                Exclude Patterns (one per line)
              </Label>
              <Textarea
                id="exclude_patterns"
                {...register('exclude_patterns')}
                placeholder="e.g., *.jpg&#10;/admin/*"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="include_patterns">
                Include Patterns (one per line)
              </Label>
              <Textarea
                id="include_patterns"
                {...register('include_patterns')}
                placeholder="e.g., /blog/*&#10;/products/*"
                rows={3}
              />
            </div>
          </div>

          {/* LLM Config */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">LLM Settings (Optional)</h3>
            
            <div>
              <Label htmlFor="llm_provider">LLM Provider</Label>
              <Select
                value={watch('llm_provider') || undefined}
                onValueChange={(value) => setValue('llm_provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ollama">Ollama</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="llm_model">LLM Model</Label>
              <Input
                id="llm_model"
                {...register('llm_model')}
                placeholder="e.g., llama2, gpt-4"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Configuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
