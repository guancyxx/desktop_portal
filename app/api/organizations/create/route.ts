/**
 * 创建新组织（Realm）
 * 
 * POST /api/organizations/create
 * {
 *   "displayName": "My Organization",
 *   "slug": "myorg",
 *   "userPassword": "user-password" // 在新 Realm 中的密码
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { keycloakAdmin } from '@/lib/keycloak/admin-client'

interface CreateOrganizationRequest {
  displayName: string
  slug: string
  userPassword: string
}

export async function POST(req: NextRequest) {
  try {
    // 获取当前用户 session
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 解析请求体
    const body: CreateOrganizationRequest = await req.json()
    const { displayName, slug, userPassword } = body

    // 验证输入
    if (!displayName || !slug || !userPassword) {
      return NextResponse.json(
        { error: '缺少必要参数：displayName、slug 或 userPassword' },
        { status: 400 }
      )
    }

    if (displayName.length < 2 || displayName.length > 50) {
      return NextResponse.json(
        { error: '组织名称长度必须在 2-50 个字符之间' },
        { status: 400 }
      )
    }

    // 创建 Realm
    console.log(`[API] Creating organization for user: ${session.user.email}`)
    console.log(`[API] Organization name: ${displayName}, slug: ${slug}`)

    const result = await keycloakAdmin.createRealm(
      displayName,
      slug,
      session.user.email
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '创建组织失败' },
        { status: 400 }
      )
    }

    // 为用户设置密码
    const passwordSet = await keycloakAdmin.setUserPassword(
      result.realmName,
      result.userId,
      userPassword,
      false // 非临时密码
    )

    if (!passwordSet) {
      console.warn(`[API] Failed to set password for user in realm ${result.realmName}`)
    }

    console.log(`[API] Organization created successfully: ${result.realmName}`)

    // 返回创建结果
    return NextResponse.json({
      success: true,
      organization: {
        realmName: result.realmName,
        displayName: result.displayName,
        clientId: result.clientId,
        // 注意：不要返回 clientSecret 到前端
      },
      message: '组织创建成功！现在可以登录到新组织。',
      nextStep: {
        action: 'login',
        realm: result.realmName,
        username: session.user.email,
      }
    })
  } catch (error) {
    console.error('[API] Error creating organization:', error)
    return NextResponse.json(
      { 
        error: '创建组织失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


