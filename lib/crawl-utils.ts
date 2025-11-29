/**
 * Crawl Utilities - Infrastructure Layer
 * 
 * Utility functions for URL normalization and SSRF validation.
 */

import { CrawlService } from '@/domain/services/CrawlService'

/**
 * Normalize URL for consistent caching
 */
export function normalizeUrl(url: string): string {
  return CrawlService.normalizeUrl(url)
}

/**
 * Generate cache key from URL
 */
export function generateCacheKey(url: string): string {
  return CrawlService.generateCacheKey(url)
}

/**
 * Validate URL and check for SSRF vulnerabilities
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  return CrawlService.validateUrl(url)
}

/**
 * Sanitize markdown content
 */
export function sanitizeMarkdown(content: string): string {
  return CrawlService.sanitizeMarkdown(content)
}

/**
 * Estimate token count for LLM processing
 */
export function estimateTokenCount(text: string): number {
  return CrawlService.estimateTokenCount(text)
}

/**
 * Check if content exceeds token limit
 */
export function exceedsTokenLimit(text: string, maxTokens: number = 8000): boolean {
  return CrawlService.exceedsTokenLimit(text, maxTokens)
}

/**
 * Calculate cache expiration date
 */
export function calculateCacheExpiry(ttlSeconds: number): Date {
  return CrawlService.calculateCacheExpiry(ttlSeconds)
}

/**
 * Check if cached result is still valid
 */
export function isCacheValid(expiresAt: Date): boolean {
  return CrawlService.isCacheValid(expiresAt)
}
