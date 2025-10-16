/**
 * Applications Hooks - 使用 TanStack Query 管理应用数据
 * 
 * 特性：
 * - 自动缓存和重新验证
 * - 后台数据更新
 * - 请求重试和错误处理
 */
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { applicationsAPI } from '@/lib/api/applications'
import { Role } from '@/types'

/**
 * 获取应用列表（根据用户角色过滤）
 */
export function useApplications() {
  const { data: session } = useSession()
  const roles = (session?.user?.roles as Role[]) || []
  
  return useQuery({
    queryKey: ['applications', roles],
    queryFn: () => applicationsAPI.getApplications({ roles }),
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟（之前的 cacheTime）
    enabled: !!session, // 只有在登录后才获取
  })
}

/**
 * 根据类别获取应用列表
 */
export function useApplicationsByCategory(category?: string) {
  const { data: session } = useSession()
  const roles = (session?.user?.roles as Role[]) || []
  
  return useQuery({
    queryKey: ['applications', 'category', category, roles],
    queryFn: () => applicationsAPI.getApplications({ category, roles }),
    staleTime: 5 * 60 * 1000,
    enabled: !!session && !!category,
  })
}

/**
 * 获取单个应用详情
 */
export function useApplication(id: string) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsAPI.getApplicationById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

/**
 * 更新应用状态
 */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'maintenance' }) =>
      applicationsAPI.updateApplicationStatus(id, status),
    onSuccess: () => {
      // 更新成功后刷新应用列表
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (error) => {
      console.error('Failed to update application status:', error)
    }
  })
}

