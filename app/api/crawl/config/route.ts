/**
 * GET /api/crawl/config - List all crawl configurations for tenant
 * POST /api/crawl/config - Create new crawl configuration
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
})

const crawlerConfigSchema = z.object({
  maxDepth: z.number().min(1).max(10).optional(),
  followLinks: z.boolean().optional(),
  respectRobotsTxt: z.boolean().optional(),
  maxPages: z.number().min(1).max(1000).optional(),
  excludePatterns: z.array(z.string()).optional(),
  includePatterns: z.array(z.string()).optional(),
})

const createConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  browserConfig: browserConfigSchema,
  crawlerConfig: crawlerConfigSchema,
  llmProvider: z.string().max(50).optional(),
  llmModel: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
})

/**
 * GET - List all configurations
 */
async function handleGet() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = (session.user as any).organizationId
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization context is required' },
        { status: 400 }
      )
    }

    const getCrawlConfigs = container.getCrawlConfigs
    const result = await getCrawlConfigs.execute({ organizationId })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Transform to plain objects
    const configs = result.configs?.map(c => c.toPlainObject()) || []

    return NextResponse.json({ configs })
  } catch (error) {
    console.error('[GET /api/crawl/config] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new configuration
 */
async function handlePost(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createConfigSchema.parse(body)

    const organizationId = (session.user as any).organizationId
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization context is required' },
        { status: 400 }
      )
    }

    const createCrawlConfig = container.createCrawlConfig
    const result = await createCrawlConfig.execute({
      organizationId,
      userId: session.user.id,
      ...validatedData,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(
      { config: result.config?.toPlainObject() },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[POST /api/crawl/config] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = handleGet
export const POST = handlePost
