/**
 * 租户信息横幅组件
 * 在 Desktop 界面顶部显示当前租户信息
 */

'use client'

import { useSession } from 'next-auth/react'
import { Building2, ShieldCheck, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function TenantBanner() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center px-4 py-2 bg-gray-50 border-b">
        <div className="text-sm text-gray-500">加载租户信息...</div>
      </div>
    )
  }
  
  if (!session?.tenant) {
    return null
  }
  
  const { tenantId, tenantName, isAdmin, isDefault } = session.tenant
  
  return (
    <div
      className={`
        flex items-center justify-between px-4 py-2 border-b transition-colors
        ${
          isDefault
            ? 'bg-gray-50 text-gray-700 border-gray-200'
            : 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200'
        }
      `}
    >
      {/* 左侧：租户信息 */}
      <div className="flex items-center gap-3">
        <Building2 className="w-4 h-4" />
        <span className="font-medium">{tenantName}</span>
        
        {/* 默认租户标签 */}
        {isDefault && (
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
            默认租户
          </span>
        )}
        
        {/* 管理员标签 */}
        {isAdmin && (
          <span className="flex items-center gap-1 text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3" />
            管理员
          </span>
        )}
      </div>
      
      {/* 右侧：租户 ID */}
      <div className="text-xs text-gray-500">
        租户 ID: <code className="bg-white/50 px-1 rounded">{tenantId}</code>
      </div>
    </div>
  )
}

/**
 * 默认租户提示组件
 * 当用户使用默认租户时显示提示信息
 */
export function DefaultTenantNotice() {
  const { data: session } = useSession()
  
  if (!session?.tenant?.isDefault) {
    return null
  }
  
  return (
    <Alert className="m-4 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-700" />
      <AlertDescription className="text-blue-700">
        <strong>提示：</strong>您正在使用默认租户。
        如需加入特定组织，请联系系统管理员将您添加到相应的租户组。
      </AlertDescription>
    </Alert>
  )
}

/**
 * 租户切换提示（未来功能）
 */
export function TenantSwitcher() {
  const { data: session } = useSession()
  
  // 如果用户只属于一个租户，不显示切换器
  if (!session?.tenant || session.tenant.groups.length <= 1) {
    return null
  }
  
  return (
    <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-sm">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4" />
        <span>您属于多个组织。租户切换功能即将推出。</span>
      </div>
    </div>
  )
}


