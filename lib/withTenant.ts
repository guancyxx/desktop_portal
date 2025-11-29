/**
 * withTenant Middleware
 * 
 * Extracts and validates organizationId from authenticated user session.
 * Ensures tenant isolation for all API requests.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export interface TenantContext {
  organizationId: string
  userId: string
  user: {
    id: string
    email: string
    name?: string
  }
}

export type TenantHandler = (
  req: NextRequest,
  context: TenantContext
) => Promise<NextResponse> | NextResponse

/**
 * Middleware to extract tenant context from authenticated session
 */
export function withTenant(handler: TenantHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Development mode bypass for testing
      if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
        const tenantContext: TenantContext = {
          organizationId: 'dev-org-001',
          userId: 'dev-user-001',
          user: {
            id: 'dev-user-001',
            email: 'dev@test.com',
            name: 'Dev User',
          },
        }
        return handler(req, tenantContext)
      }

      // Get authenticated session from NextAuth v5
      const session = await auth()

      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        )
      }

      // Extract organizationId from session
      // Note: This assumes organizationId is stored in session.user
      // Adjust based on your actual session structure
      const organizationId = (session.user as any).organizationId

      if (!organizationId) {
        return NextResponse.json(
          { error: 'Forbidden - No organization context' },
          { status: 403 }
        )
      }

      // Build tenant context
      const tenantContext: TenantContext = {
        organizationId,
        userId: session.user.id || session.user.email || '',
        user: {
          id: session.user.id || session.user.email || '',
          email: session.user.email || '',
          name: session.user.name || undefined,
        },
      }

      // Call the handler with tenant context
      return await handler(req, tenantContext)
    } catch (error) {
      console.error('withTenant middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}
