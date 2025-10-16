import { DefaultSession } from 'next-auth'

export interface Application {
  id: string
  name: string
  description: string
  icon: string
  url: string
  category: string
  roles: string[]
  status: 'active' | 'coming-soon' | 'disabled'
  color: string
  order?: number
  // 窗口模式：'window' - 页面内窗口, 'tab' - 新标签页, 'auto' - 自动判断（默认）
  windowMode?: 'window' | 'tab' | 'auto'
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

