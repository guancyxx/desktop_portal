/**
 * Session Manager for Realm Switching
 * 
 * Handles session management for multi-realm authentication.
 */

import { cookies } from 'next/headers'

export interface RealmTokens {
  accessToken: string
  refreshToken: string
  idToken: string
  expiresAt: number
  realmName: string
  roles?: string[]
  groups?: string[]
}

export interface RealmSession extends RealmTokens {
  userId: string
  email: string
  name?: string
}

const SESSION_COOKIE_PREFIX = 'realm-session'

/**
 * Get session cookie name for a specific realm
 */
export function getSessionCookieName(realmName: string): string {
  return `${SESSION_COOKIE_PREFIX}-${realmName}`
}

/**
 * Get session cookie options
 */
export function getSessionCookieOptions(isProduction: boolean = false) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  }
}

/**
 * Create realm session cookie
 */
export async function createRealmSession(
  realmName: string,
  tokens: RealmTokens,
  isProduction: boolean = false
): Promise<void> {
  const cookieStore = await cookies()
  const cookieName = getSessionCookieName(realmName)
  const cookieValue = JSON.stringify(tokens)
  const options = getSessionCookieOptions(isProduction)

  cookieStore.set(cookieName, cookieValue, options)
}

/**
 * Get realm session from cookie
 */
export async function getRealmSession(realmName: string): Promise<RealmTokens | null> {
  const cookieStore = await cookies()
  const cookieName = getSessionCookieName(realmName)
  const cookie = cookieStore.get(cookieName)

  if (!cookie || !cookie.value) {
    return null
  }

  try {
    return JSON.parse(cookie.value) as RealmTokens
  } catch {
    return null
  }
}

/**
 * Delete realm session cookie
 */
export async function deleteRealmSession(realmName: string): Promise<void> {
  const cookieStore = await cookies()
  const cookieName = getSessionCookieName(realmName)
  cookieStore.delete(cookieName)
}

/**
 * Check if realm session is expired
 */
export function isSessionExpired(tokens: RealmTokens): boolean {
  return Date.now() >= tokens.expiresAt * 1000
}
