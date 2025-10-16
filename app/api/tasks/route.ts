import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const TASK_API_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://task-backend:8000'

export async function GET(request: NextRequest) {
  try {
    // 获取当前用户的 session
    const session = await getServerSession(authOptions)
    
    console.log('🔐 API Route - 用户认证检查:', {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      user: session?.user?.email,
      userName: session?.user?.name,
    })
    
    if (!session || !session.accessToken) {
      console.warn('⚠️ API Route - 未认证请求')
      return NextResponse.json(
        { error: '未认证', message: '请先登录' },
        { status: 401 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    const page_size = searchParams.get('page_size') || '20'
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
    }
    
    const apiUrl = `${TASK_API_URL}/api/v1/tasks?page_size=${page_size}`
    console.log('📡 API Route - 请求后端 API:', {
      url: apiUrl,
      user: session.user?.email,
    })
    
    const response = await fetch(apiUrl, {
      headers,
      credentials: 'include',
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ API Route - 后端 API 错误:', {
        status: response.status,
        error: errorData,
      })
      return NextResponse.json(
        { error: '获取任务失败', status: response.status, details: errorData },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('✅ API Route - 成功获取任务:', {
      total: data.total,
      tasksCount: data.tasks?.length,
      user: session.user?.email,
    })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API 代理错误:', error)
    return NextResponse.json(
      { error: '服务器错误', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

