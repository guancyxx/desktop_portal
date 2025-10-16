'use client'

/**
 * 任务管理应用页面
 * 
 * 内嵌任务管理系统（运行在 http://localhost:3001）
 * 通过 iframe 方式集成，保持应用独立性
 */
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TasksPage() {
  const { data: session } = useSession()
  const [iframeKey, setIframeKey] = useState(0)
  const taskManagementUrl = process.env.NEXT_PUBLIC_TASK_MANAGEMENT_URL || 'http://localhost:3001'

  useEffect(() => {
    // 当 session 变化时，刷新 iframe 以传递新的认证信息
    if (session) {
      setIframeKey(prev => prev + 1)
    }
  }, [session])

  return (
    <div className="flex h-full w-full flex-col">
      {/* 页面头部 */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任务管理</h1>
          <p className="text-sm text-gray-600">管理您的任务、项目和工作流程</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeKey(prev => prev + 1)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            title="刷新应用"
          >
            🔄 刷新
          </button>
          <a
            href={taskManagementUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            title="在新标签页打开"
          >
            🔗 新窗口打开
          </a>
        </div>
      </div>

      {/* 应用内容区域 */}
      <div className="relative flex-1 overflow-hidden">
        {!session ? (
          <div className="flex h-full items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="mb-4 text-6xl">🔒</div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">需要登录</h2>
              <p className="text-gray-600">请先登录以访问任务管理系统</p>
            </div>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            src={taskManagementUrl}
            className="h-full w-full border-0"
            title="任务管理系统"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            loading="lazy"
          />
        )}
      </div>

      {/* 加载提示 */}
      <div className="absolute inset-0 flex items-center justify-center bg-white opacity-0 transition-opacity duration-300 pointer-events-none">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-gray-600">正在加载任务管理系统...</p>
        </div>
      </div>
    </div>
  )
}

