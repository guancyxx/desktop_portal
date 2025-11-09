import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { keycloakAdmin } from '@/lib/keycloak/admin-client'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const body: { realmName: string } = await req.json()
    const { realmName } = body

    if (!realmName) {
      return NextResponse.json(
        { error: '缺少 realmName 参数' },
        { status: 400 }
      )
    }

    console.log(`[API] Disabling review profile for realm: ${realmName}`)
    const success = await keycloakAdmin.disableReviewProfile(realmName)

    if (!success) {
      return NextResponse.json(
        { error: '禁用 Review Profile 失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Review Profile 已禁用',
      realmName,
    })
  } catch (error) {
    console.error('[API] Error disabling review profile:', error)
    return NextResponse.json(
      {
        error: '禁用 Review Profile 失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

