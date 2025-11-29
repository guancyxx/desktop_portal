/**
 * PUT /api/crawl/config/[id] - Update crawl configuration
 * DELETE /api/crawl/config/[id] - Delete crawl configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { container } from '@/application/container'
import { z } from 'zod'

const browserConfigSchema = z.object({
  headless: z.boolean().optional(),
  viewport: z.object({
    width: z.number().min(320).max(3840),
    height: z.number().min(240).max(2160),
  }).optional(),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle', 'commit']).optional(),
  timeout: z.number().min(1000).max(120000).optional(),
  userAgent: z.string().max(500).optional(),
}).optional()

const crawlerConfigSchema = z.object({
  maxDepth: z.number().min(1).max(10).optional(),
  followLinks: z.boolean().optional(),
  respectRobotsTxt: z.boolean().optional(),
  maxPages: z.number().min(1).max(1000).optional(),
  excludePatterns: z.array(z.string()).optional(),
  includePatterns: z.array(z.string()).optional(),
}).optional()

const updateConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  browserConfig: browserConfigSchema,
  crawlerConfig: crawlerConfigSchema,
  llmProvider: z.string().max(50).optional(),
  llmModel: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
})

/**
 * PUT - Update configuration
 */
async function handlePut(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const configId = params.id

    if (!configId) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

    const organizationId = (session.user as any).organizationId
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization context is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = updateConfigSchema.parse(body)

    const updateCrawlConfig = container.updateCrawlConfig
    const result = await updateCrawlConfig.execute({
      id: configId,
      organizationId,
      ...validatedData,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ message: 'Configuration updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[PUT /api/crawl/config/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete configuration
 */
async function handleDelete(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const configId = params.id

    if (!configId) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

    const organizationId = (session.user as any).organizationId
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization context is required' },
        { status: 400 }
      )
    }

    const deleteCrawlConfig = container.deleteCrawlConfig
    const result = await deleteCrawlConfig.execute({
      id: configId,
      organizationId,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ message: 'Configuration deleted successfully' })
  } catch (error) {
    console.error('[DELETE /api/crawl/config/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export { handlePut as PUT, handleDelete as DELETE }
