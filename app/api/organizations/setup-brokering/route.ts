/**
 * 为现有 Realm 配置 Identity Brokering
 * 
 * POST /api/organizations/setup-brokering
 * {
 *   "realmName": "realm-name"
 * }
 * 
 * 这是一个管理员工具，用于为已创建但未配置 Identity Brokering 的 realm 补充配置
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { keycloakAdmin } from '@/lib/keycloak/admin-client'

interface SetupBrokeringRequest {
  realmName: string
}

export async function POST(req: NextRequest) {
  try {
    // 获取当前用户 session
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 解析请求体
    const body: SetupBrokeringRequest = await req.json()
    const { realmName } = body

    // 验证输入
    if (!realmName) {
      return NextResponse.json(
        { error: '缺少必要参数：realmName' },
        { status: 400 }
      )
    }

    console.log(`[API] Setting up identity brokering for realm: ${realmName}`)

    // 配置 Identity Brokering
    const success = await keycloakAdmin.setupIdentityBrokering(realmName)

    if (!success) {
      return NextResponse.json(
        { error: 'Identity Brokering 配置失败' },
        { status: 500 }
      )
    }

    console.log(`[API] Identity Brokering configured successfully for: ${realmName}`)

    return NextResponse.json({
      success: true,
      message: `Identity Brokering 已配置完成`,
      realmName,
    })
  } catch (error) {
    console.error('[API] Error setting up identity brokering:', error)
    return NextResponse.json(
      { 
        error: '配置 Identity Brokering 失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

