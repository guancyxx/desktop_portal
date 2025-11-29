/**
 * Rate Limiting Middleware
 * 
 * Implements token bucket algorithm to limit requests per organization.
 * Constitution compliance: Multi-tenant isolation with organizationId-based limits.
 */

interface RateLimitStore {
  tokens: number
  lastRefill: number
}

export interface RateLimitConfig {
  maxTokens: number // Maximum tokens per organization
  refillRate: number // Tokens added per millisecond
  refillInterval: number // Milliseconds between refills
}

/**
 * In-memory rate limiter using token bucket algorithm.
 * 
 * For production: Replace with Redis-backed implementation for distributed rate limiting.
 */
export class RateLimiter {
  private store: Map<string, RateLimitStore> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * Check if request is allowed for organization.
   * 
   * @param organizationId - Tenant identifier
   * @returns true if request allowed, false if rate limit exceeded
   */
  async checkLimit(organizationId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now()
    let bucket = this.store.get(organizationId)

    if (!bucket) {
      // First request - initialize full bucket
      bucket = {
        tokens: this.config.maxTokens - 1, // Consume 1 token for this request
        lastRefill: now,
      }
      this.store.set(organizationId, bucket)
      return { allowed: true }
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill
    const tokensToAdd = Math.floor(elapsed * this.config.refillRate)

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.config.maxTokens, bucket.tokens + tokensToAdd)
      bucket.lastRefill = now
    }

    // Check if token available
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      return { allowed: true }
    }

    // Rate limit exceeded - calculate retry time
    const tokensNeeded = 1 - bucket.tokens
    const retryAfter = Math.ceil(tokensNeeded / this.config.refillRate)

    return {
      allowed: false,
      retryAfter,
    }
  }

  /**
   * Reset rate limit for organization (admin function).
   */
  async reset(organizationId: string): Promise<void> {
    this.store.delete(organizationId)
  }

  /**
   * Get current token count for organization (monitoring).
   */
  async getTokens(organizationId: string): Promise<number> {
    const bucket = this.store.get(organizationId)
    if (!bucket) return this.config.maxTokens

    // Calculate current tokens with refill
    const now = Date.now()
    const elapsed = now - bucket.lastRefill
    const tokensToAdd = Math.floor(elapsed * this.config.refillRate)

    return Math.min(this.config.maxTokens, bucket.tokens + tokensToAdd)
  }
}

/**
 * Default rate limiter instance: 100 requests per hour per organization.
 * 
 * Calculation:
 * - Max tokens: 100
 * - Refill rate: 100 tokens / (60 * 60 * 1000 ms) = 0.0277 tokens/ms
 * - Refill interval: 1 hour
 */
export const defaultRateLimiter = new RateLimiter({
  maxTokens: 100,
  refillRate: 100 / (60 * 60 * 1000), // 100 requests per hour
  refillInterval: 60 * 60 * 1000, // 1 hour
})

/**
 * Middleware factory for Next.js API routes.
 * 
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const session = await auth()
 *   if (!session?.organizationId) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 * 
 *   const rateLimitResult = await checkRateLimit(session.organizationId)
 *   if (!rateLimitResult.allowed) {
 *     return NextResponse.json(
 *       { error: 'Rate limit exceeded' },
 *       { 
 *         status: 429,
 *         headers: { 'Retry-After': rateLimitResult.retryAfter?.toString() || '3600' }
 *       }
 *     )
 *   }
 * 
 *   // Process request...
 * }
 * ```
 */
export async function checkRateLimit(organizationId: string) {
  return defaultRateLimiter.checkLimit(organizationId)
}
