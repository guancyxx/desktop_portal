/**
 * CrawlSubmitForm Component
 * 
 * Form for submitting new crawl tasks with URL validation and optional LLM extraction.
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCrawlTask } from '@/hooks/useCrawlTask'
import { CrawlTaskResponse } from '@/types/crawl'
import { Loader2 } from 'lucide-react'
import { SchemaEditor } from './SchemaEditor'

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' }),
  asyncMode: z.boolean().default(false),
  enableLLM: z.boolean().default(false),
  llmProvider: z.string().optional(),
  llmModel: z.string().optional(),
  llmSchema: z.string().optional(),
  llmInstruction: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

interface CrawlSubmitFormProps {
  onSuccess?: (task: CrawlTaskResponse) => void
  onAsyncSubmit?: (taskId: string) => void
}

export function CrawlSubmitForm({ onSuccess, onAsyncSubmit }: CrawlSubmitFormProps) {
  const { submitCrawl, isSubmitting } = useCrawlTask()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      asyncMode: false,
      enableLLM: false,
      llmProvider: 'ollama',
      llmModel: 'qwen3-coder:30b',
      llmSchema: '',
      llmInstruction: '',
      webhookUrl: '',
    },
  })

  const enableLLM = form.watch('enableLLM')
  const asyncMode = form.watch('asyncMode')

  async function onSubmit(values: FormValues) {
    const request: any = {
      url: values.url,
    }
    
    if (values.enableLLM) {
      request.llmProvider = values.llmProvider
      request.llmModel = values.llmModel
      request.llmInstruction = values.llmInstruction
      
      // Parse and include schema if provided
      if (values.llmSchema?.trim()) {
        try {
          request.llmSchema = JSON.parse(values.llmSchema)
        } catch (error) {
          form.setError('llmSchema', {
            message: 'Invalid JSON schema format',
          })
          return
        }
      }
    }

    // Async mode - submit to job endpoint
    if (values.asyncMode) {
      if (values.webhookUrl?.trim()) {
        request.webhookUrl = values.webhookUrl
      }
      
      try {
        const response = await fetch('/api/crawl/job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to submit async job')
        }

        const data = await response.json()
        form.reset()
        
        if (onAsyncSubmit) {
          onAsyncSubmit(data.taskId)
        }
      } catch (error) {
        form.setError('url', {
          message: error instanceof Error ? error.message : 'Async submission failed',
        })
      }
      return
    }

    // Sync mode - use existing submitCrawl
    const result = await submitCrawl(request)
    if (result) {
      form.reset()
      onSuccess?.(result)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Enter the URL of the web page you want to crawl
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="asyncMode"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Async Mode</FormLabel>
                <FormDescription>
                  Submit job and poll for status (non-blocking)
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {asyncMode && (
          <FormField
            control={form.control}
            name="webhookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook URL (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/webhook"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Receive POST notification when crawl completes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="enableLLM"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">LLM Extraction</FormLabel>
                <FormDescription>
                  Use local Ollama to extract structured data
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {enableLLM && (
          <div className="space-y-4 rounded-lg border p-4">
            <FormField
              control={form.control}
              name="llmProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ollama">Ollama (Local)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    LLM provider for content extraction
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="llmModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="qwen3-coder:30b">Qwen3 Coder 30B</SelectItem>
                      <SelectItem value="deepseek-r1:8b">DeepSeek R1 8B</SelectItem>
                      <SelectItem value="qwen2.5-coder:14b">Qwen2.5 Coder 14B</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose the LLM model to use</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="llmSchema"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SchemaEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      instruction={form.watch('llmInstruction') || ''}
                      onInstructionChange={(value) =>
                        form.setValue('llmInstruction', value)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Crawling...
            </>
          ) : (
            'Submit Crawl'
          )}
        </Button>
      </form>
    </Form>
  )
}
