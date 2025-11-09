/**
 * 创建组织页面
 * 允许用户创建新的组织（Realm）
 */

'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function CreateOrganizationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    displayName: '',
    slug: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 自动生成 slug
  const handleDisplayNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, displayName: value }))
    
    // 自动生成 slug（如果用户还没有手动修改）
    if (!formData.slug || formData.slug === generateSlug(formData.displayName)) {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }))
    }
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-')          // 空格转连字符
      .replace(/-+/g, '-')           // 多个连字符合并
      .slice(0, 20)                  // 最多 20 个字符
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建组织失败')
      }

      setSuccess(true)
      
      // 提示用户组织创建成功，并说明如何访问
      setTimeout(() => {
        // 回到桌面页面，用户可以在组织列表中看到新创建的组织
        router.push('/desktop')
      }, 2000)
    } catch (err) {
      console.error('Failed to create organization:', err)
      setError(err instanceof Error ? err.message : '创建组织失败')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">请先登录</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 text-blue-600 hover:underline"
          >
            前往登录
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900 mt-4">
            组织创建成功！
          </h2>
          <p className="text-gray-600 mt-2">
            您的新组织已成功创建。即将返回桌面...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            💡 您可以在用户菜单中的"选择组织"列表里找到新创建的组织
          </p>
          <div className="mt-4">
            <Loader2 className="w-5 h-5 mx-auto animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </button>

        {/* 主表单卡片 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">创建新组织</h1>
                <p className="text-blue-100 text-sm mt-1">
                  创建您的组织空间，开始协作
                </p>
              </div>
            </div>
          </div>

          {/* 表单内容 */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">创建失败</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* 当前用户信息 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-lg">👤</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {session.user?.email || session.user?.username || session.user?.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    您将成为组织的管理员，通过统一登录访问
                  </p>
                </div>
              </div>
            </div>

            {/* 组织名称 */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                组织名称 <span className="text-red-500">*</span>
              </label>
              <input
                id="displayName"
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={formData.displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                placeholder="例如：ACME 公司"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                2-50 个字符，这将在界面上显示
              </p>
            </div>

            {/* 组织标识 */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                组织标识 <span className="text-red-500">*</span>
              </label>
              <input
                id="slug"
                type="text"
                required
                pattern="[a-z0-9-]+"
                minLength={3}
                maxLength={20}
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="例如：acme-corp"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                3-20 个字符，只能包含小写字母、数字和连字符
              </p>
              {formData.slug && (
                <p className="text-xs text-gray-600 mt-2 font-mono bg-gray-50 px-2 py-1 rounded">
                  完整标识将类似：<span className="font-semibold">xxxx-{formData.slug}</span>
                </p>
              )}
            </div>


            {/* 提交按钮 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>创建中...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>创建组织</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 提示信息 */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <p className="text-xs text-gray-600">
                💡 <strong>提示</strong>：创建组织后，您将成为该组织的管理员，可以邀请其他成员加入。
              </p>
              <p className="text-xs text-gray-600">
                🔐 <strong>统一登录</strong>：使用您当前的登录凭据即可访问新组织，无需单独设置密码。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

