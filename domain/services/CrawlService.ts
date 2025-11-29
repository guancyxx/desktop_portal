/**
 * CrawlService - Domain Service
 * 
 * Contains domain logic that doesn't naturally fit within a single entity.
 * Provides utilities for URL validation, cache key generation, and business rules.
 */

import { CrawlStatus } from '../models/CrawlTask'
import crypto from 'crypto'

/**
 * CrawlService - Domain Service
 * 
 * Provides domain logic and business rules for crawl operations.
 * Contains utilities for URL validation, cache management, and content processing.
 * All methods are static as this is a stateless service.
 * 
 * @class CrawlService
 */
export class CrawlService {
  /**
   * Validate URL format and check for SSRF vulnerabilities
   * 
   * Security checks:
   * - Protocol must be HTTP/HTTPS
   * - Blocks localhost and loopback addresses (127.x, ::1)
   * - Blocks private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x)
   * - Blocks cloud metadata endpoints (169.254.169.254, etc.)
   * - Enforces 2048 character length limit
   * 
   * @param url - URL string to validate
   * 
   * @returns Validation result with error message if invalid
   * @returns {valid: true} - If URL passes all security checks
   * @returns {valid: false, error: string} - If URL fails validation with reason
   * 
   * @example
   * ```typescript
   * const result = CrawlService.validateUrl('https://example.com');
   * if (!result.valid) {
   *   throw new Error(result.error);
   * }
   * ```
   */
  static validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url)

      // Protocol validation
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' }
      }

      // SSRF prevention - block private IP ranges
      const hostname = parsedUrl.hostname.toLowerCase()

      // Block localhost and loopback
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('0.')
      ) {
        return { valid: false, error: 'Cannot crawl localhost or loopback addresses' }
      }

      // Block private IP ranges (RFC 1918)
      const ipv4Patterns = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^169\.254\./, // Link-local
      ]

      if (ipv4Patterns.some((pattern) => pattern.test(hostname))) {
        return { valid: false, error: 'Cannot crawl private IP addresses' }
      }

      // Block cloud metadata endpoints
      const blockedHosts = [
        '169.254.169.254', // AWS/Azure/GCP metadata
        'metadata.google.internal',
        'instance-data',
      ]

      if (blockedHosts.some((blocked) => hostname.includes(blocked))) {
        return { valid: false, error: 'Cannot crawl cloud metadata endpoints' }
      }

      // Length validation
      if (url.length > 2048) {
        return { valid: false, error: 'URL exceeds maximum length of 2048 characters' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' }
    }
  }

  /**
   * Generate cache key from URL (SHA-256 hash)
   * 
   * Uses normalized URL to ensure consistent caching:
   * - Removes tracking parameters (utm_*, fbclid, etc.)
   * - Sorts remaining query parameters alphabetically
   * - Normalizes trailing slashes
   * 
   * @param url - URL to generate cache key for
   * @returns SHA-256 hash (64 hex characters)
   * 
   * @example
   * ```typescript
   * const key1 = CrawlService.generateCacheKey('https://example.com?utm_source=facebook');
   * const key2 = CrawlService.generateCacheKey('https://example.com');
   * // key1 === key2 (tracking params removed)
   * ```
   */
  static generateCacheKey(url: string): string {
    const normalizedUrl = this.normalizeUrl(url)
    return crypto.createHash('sha256').update(normalizedUrl).digest('hex')
  }

  /**
   * Normalize URL for cache consistency
   * 
   * Transformations:
   * - Removes common tracking parameters (utm_*, fbclid, gclid, etc.)
   * - Sorts remaining query parameters alphabetically
   * - Removes trailing slash for root path only
   * 
   * @param url - URL to normalize
   * @returns Normalized URL string (or original if parsing fails)
   * 
   * @example
   * ```typescript
   * const normalized = CrawlService.normalizeUrl('https://example.com?b=2&a=1&utm_source=fb');
   * // Returns: 'https://example.com?a=1&b=2'
   * ```
   */
  static normalizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url)

      // Remove common tracking parameters
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',
        'gclid',
        'msclkid',
        '_ga',
        'mc_cid',
        'mc_eid',
      ]

      trackingParams.forEach((param) => parsedUrl.searchParams.delete(param))

      // Sort remaining query parameters for consistency
      const sortedParams = Array.from(parsedUrl.searchParams.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
      )

      parsedUrl.search = new URLSearchParams(sortedParams).toString()

      // Remove trailing slash for consistency
      let normalizedUrl = parsedUrl.toString()
      if (normalizedUrl.endsWith('/') && parsedUrl.pathname === '/') {
        normalizedUrl = normalizedUrl.slice(0, -1)
      }

      return normalizedUrl
    } catch {
      return url // Fallback to original URL if parsing fails
    }
  }

  /**
   * Check if status transition is valid
   * 
   * Valid transitions:
   * - PENDING → IN_PROGRESS, FAILED
   * - IN_PROGRESS → COMPLETED, FAILED
   * - COMPLETED → (no transitions)
   * - FAILED → PENDING (retry)
   * 
   * @param currentStatus - Current task status
   * @param newStatus - Desired new status
   * @returns true if transition is allowed, false otherwise
   * 
   * @example
   * ```typescript
   * CrawlService.canTransitionTo(CrawlStatus.PENDING, CrawlStatus.IN_PROGRESS); // true
   * CrawlService.canTransitionTo(CrawlStatus.COMPLETED, CrawlStatus.PENDING); // false
   * ```
   */
  static canTransitionTo(currentStatus: CrawlStatus, newStatus: CrawlStatus): boolean {
    const transitions: Record<CrawlStatus, CrawlStatus[]> = {
      [CrawlStatus.PENDING]: [CrawlStatus.IN_PROGRESS, CrawlStatus.FAILED],
      [CrawlStatus.IN_PROGRESS]: [CrawlStatus.COMPLETED, CrawlStatus.FAILED],
      [CrawlStatus.COMPLETED]: [],
      [CrawlStatus.FAILED]: [CrawlStatus.PENDING],
    }

    return transitions[currentStatus].includes(newStatus)
  }

  /**
   * Calculate cache expiration timestamp
   * 
   * @param ttlSeconds - Time-to-live in seconds (default: 3600 = 1 hour)
   * @returns Date object representing expiration time
   * 
   * @example
   * ```typescript
   * const expiry = CrawlService.calculateCacheExpiry(86400); // 24 hours from now
   * ```
   */
  static calculateCacheExpiry(ttlSeconds: number): Date {
    const now = new Date()
    return new Date(now.getTime() + ttlSeconds * 1000)
  }

  /**
   * Check if cached result is still valid
   * 
   * @param expiresAt - Cache expiration timestamp
   * @returns true if cache has not expired, false if expired
   * 
   * @example
   * ```typescript
   * const isValid = CrawlService.isCacheValid(cachedTask.expiresAt);
   * if (!isValid) {
   *   // Re-crawl required
   * }
   * ```
   */
  static isCacheValid(expiresAt: Date): boolean {
    return new Date() < expiresAt
  }

  /**
   * Sanitize markdown content
   * 
   * Transformations:
   * - Normalizes line endings to \n (Unix-style)
   * - Replaces 3+ consecutive newlines with double newline
   * - Trims leading/trailing whitespace
   * 
   * @param content - Raw markdown content from crawler
   * @returns Sanitized markdown string
   * 
   * @example
   * ```typescript
   * const clean = CrawlService.sanitizeMarkdown('# Title\r\n\r\n\r\n\r\nContent   ');
   * // Returns: '# Title\n\nContent'
   * ```
   */
  static sanitizeMarkdown(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
      .trim()
  }

  /**
   * Estimate token count for LLM processing
   * 
   * Uses rough approximation: 1 token ≈ 4 characters (average for English text).
   * This is conservative; actual token count varies by tokenizer.
   * 
   * @param text - Text content to estimate tokens for
   * @returns Estimated token count (rounded up)
   * 
   * @example
   * ```typescript
   * const tokens = CrawlService.estimateTokenCount('Hello world!');
   * // Returns: 3 (12 chars / 4 ≈ 3 tokens)
   * ```
   */
  static estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters (average for English text)
    return Math.ceil(text.length / 4)
  }

  /**
   * Check if content exceeds LLM token limit
   * 
   * @param text - Text content to check
   * @param maxTokens - Maximum allowed tokens (default: 8000)
   * @returns true if content exceeds limit, false otherwise
   * 
   * @example
   * ```typescript
   * if (CrawlService.exceedsTokenLimit(markdown, 4000)) {
   *   console.warn('Content too large for LLM extraction');
   * }
   * ```
   */
  static exceedsTokenLimit(text: string, maxTokens: number = 8000): boolean {
    return this.estimateTokenCount(text) > maxTokens
  }
}
