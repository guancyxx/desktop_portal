import { DefaultSession } from 'next-auth'

// 应用类别类型
export type ApplicationCategory = 'productivity' | 'ai' | 'analytics' | 'admin' | 'tools'

// 应用状态类型
export type ApplicationStatus = 'active' | 'coming-soon' | 'maintenance' | 'disabled'

// 窗口模式类型
export type WindowMode = 'window' | 'tab' | 'auto'

// 用户角色类型
export type Role = 'user' | 'admin' | 'developer' | 'guest'

/**
 * 应用程序接口
 * 使用 readonly 确保不可变性
 */
export interface Application {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly icon: string
  readonly url: string
  readonly category: ApplicationCategory
  readonly roles: readonly Role[]
  readonly status: ApplicationStatus
  readonly color: string
  readonly order: number
  readonly windowMode: WindowMode
}

/**
 * 类型守卫：检查是否为有效的应用对象
 */
export function isApplication(obj: unknown): obj is Application {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'url' in obj &&
    'status' in obj
  )
}

export interface UserProfile {
  id: string
  username: string
  email?: string
  name?: string
  firstName?: string
  lastName?: string
  avatar?: string
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string
    idToken?: string
    roles?: string[]
    user: {
      roles?: string[]
    } & DefaultSession['user']
  }

  interface JWT {
    accessToken?: string
    idToken?: string
    refreshToken?: string
    expiresAt?: number
    roles?: string[]
  }
}

export type AppCategory = 'all' | 'productivity' | 'ai' | 'analytics' | 'admin' | 'tools'

export interface QuickAction {
  id: string
  label: string
  icon: string
  action: () => void
}

