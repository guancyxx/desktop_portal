/**
 * GET /api/crawl/health - Service Health Check
 * 
 * Checks connectivity to Crawl4AI and Ollama services.
 * Does not require authentication (public health check).
 */

import { NextResponse } from 'next/server'
import { container } from '@/application/container'
import { HealthCheckResponse } from '@/types/crawl'

export async function GET(): Promise<NextResponse> {
  try {
    const crawl4aiClient = container.crawl4aiClient
    const ollamaClient = container.ollamaClient

    // Check Crawl4AI
    let crawl4aiStatus: HealthCheckResponse['crawl4ai']
    try {
      const health = await crawl4aiClient.healthCheck()
      crawl4aiStatus = {
        available: true,
        version: health.version,
      }
    } catch (error) {
      crawl4aiStatus = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Check Ollama
    let ollamaStatus: HealthCheckResponse['ollama']
    try {
      const health = await ollamaClient.healthCheck()
      ollamaStatus = {
        available: health.available,
        models: health.models?.map((m: any) => ({
          name: m.name,
          size: m.size,
        })),
        error: health.error,
      }
    } catch (error) {
      ollamaStatus = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    const response: HealthCheckResponse = {
      crawl4ai: crawl4aiStatus,
      ollama: ollamaStatus,
    }

    const statusCode = crawl4aiStatus.available && ollamaStatus.available ? 200 : 503

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    console.error('GET /api/crawl/health error:', error)
    return NextResponse.json(
      {
        crawl4ai: { available: false, error: 'Health check failed' },
        ollama: { available: false, error: 'Health check failed' },
      },
      { status: 500 }
    )
  }
}
