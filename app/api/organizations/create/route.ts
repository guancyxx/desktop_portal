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
  userPassword?: string // 可选：在统一 SSO 架构下不需要密码
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

    // 获取用户标识：优先使用 email，如果没有则使用 username 或 name
    const userIdentifier = session.user.email || session.user.username || session.user.name
    
    if (!userIdentifier) {
      return NextResponse.json(
        { error: '无法获取用户标识：缺少 email、username 或 name' },
        { status: 401 }
      )
    }

    // 解析请求体
    const body: CreateOrganizationRequest = await req.json()
    const { displayName, slug, userPassword } = body

    // 验证输入
    if (!displayName || !slug) {
      return NextResponse.json(
        { error: '缺少必要参数：displayName 或 slug' },
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
    console.log(`[API] Creating organization for user: ${userIdentifier}`)
    console.log(`[API] Organization name: ${displayName}, slug: ${slug}`)

    const result = await keycloakAdmin.createRealm(
      displayName,
      slug,
      userIdentifier
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '创建组织失败' },
        { status: 400 }
      )
    }

    // 如果提供了密码，为用户设置密码
    // 在统一 SSO 架构下，用户通过 master realm 认证，不需要在新 realm 中单独设置密码
    if (userPassword) {
      const passwordSet = await keycloakAdmin.setUserPassword(
        result.realmName,
        result.userId,
        userPassword,
        false // 非临时密码
      )

      if (!passwordSet) {
        console.warn(`[API] Failed to set password for user in realm ${result.realmName}`)
      }
    } else {
      console.log(`[API] No password provided, user will authenticate through master realm SSO`)
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
        username: userIdentifier,
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


