/**
 * Security Sanitization - 安全净化工具
 * 
 * 提供 XSS 防护和 URL 验证
 */
import DOMPurify from 'isomorphic-dompurify'

/**
 * 净化 HTML 内容，防止 XSS 攻击
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
  })
}

/**
 * 严格的 HTML 净化（只保留文本）
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

/**
 * 验证和净化 URL
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin)
    
    // 只允许 http 和 https 协议
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.warn(`Invalid protocol detected: ${parsed.protocol}`)
      return '#'
    }
    
    // 检查是否为内部链接
    if (url.startsWith('/')) {
      return url
    }
    
    return parsed.toString()
  } catch (error) {
    console.error('Invalid URL:', url, error)
    return '#'
  }
}

/**
 * 检查 URL 是否为内部链接
 */
export function isInternalURL(url: string): boolean {
  return url.startsWith('/') || url.startsWith(window.location.origin)
}

/**
 * 检查 URL 是否为外部链接
 */
export function isExternalURL(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * 验证应用 URL 的安全性
 */
export function validateApplicationURL(url: string): {
  isValid: boolean
  sanitized: string
  isExternal: boolean
} {
  const sanitized = sanitizeURL(url)
  const isValid = sanitized !== '#'
  const isExternal = isExternalURL(url)
  
  return {
    isValid,
    sanitized,
    isExternal
  }
}

