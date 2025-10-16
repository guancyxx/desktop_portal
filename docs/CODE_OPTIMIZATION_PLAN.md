# DreamBuilder Desktop Portal - 代码优化计划

**制定日期**: 2025-10-16  
**目标版本**: v2.0.0  
**预计周期**: 4-6 周

---

## 📋 执行概要

本优化计划基于 **Ark Desktop 数据控制界面设计理念**，结合网络最佳实践，针对 DreamBuilder Desktop Portal 进行全面的架构、性能和代码质量提升。

### 核心设计理念

1. **数据控制界面统一化** - 集中管理应用数据流、权限控制和状态同步
2. **领域驱动设计 (DDD)** - 业务逻辑与基础设施层解耦
3. **模块化架构** - 提升代码可维护性和可扩展性
4. **性能优先** - 优化渲染性能和数据处理能力
5. **安全可访问** - 增强系统安全性和用户体验

---

## 一、架构优化（核心改进）

### 1.1 状态管理重构 ⭐⭐⭐

**优先级**: 高  
**预计时间**: 1 周

#### 当前问题

- `useDesktop` Hook 中存在多个 `useState` 和 `useEffect`
- 状态更新导致不必要的组件重渲染
- 缺少持久化和跨标签页同步机制
- 窗口状态管理复杂，容易出现 bug

#### 优化方案

**方案 A: 引入 Zustand（推荐）**

```typescript
// stores/desktop-store.ts
import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { Application } from '@/types'

interface OpenWindow {
  id: string
  app: Application
  position: { x: number; y: number }
  size: { width: number; height: number }
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
}

interface DesktopState {
  // State
  windows: OpenWindow[]
  nextZIndex: number
  isLaunchpadOpen: boolean
  
  // Actions
  openApp: (app: Application) => void
  closeWindow: (windowId: string) => void
  minimizeWindow: (windowId: string) => void
  restoreWindow: (windowId: string) => void
  toggleMaximize: (windowId: string) => void
  focusWindow: (windowId: string) => void
  toggleLaunchpad: () => void
  
  // Computed
  getActiveApps: () => string[]
  getWindowByAppId: (appId: string) => OpenWindow | undefined
}

export const useDesktopStore = create<DesktopState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        windows: [],
        nextZIndex: 100,
        isLaunchpadOpen: false,
        
        // Actions
        openApp: (app) => {
          const state = get()
          const existingWindow = state.windows.find(w => w.app.id === app.id)
          
          if (existingWindow) {
            if (existingWindow.isMinimized) {
              set((draft) => {
                const window = draft.windows.find(w => w.id === existingWindow.id)
                if (window) {
                  window.isMinimized = false
                  window.zIndex = draft.nextZIndex
                  draft.nextZIndex++
                }
              })
            } else {
              set((draft) => {
                const window = draft.windows.find(w => w.id === existingWindow.id)
                if (window) {
                  window.zIndex = draft.nextZIndex
                  draft.nextZIndex++
                }
              })
            }
            return
          }
          
          set((draft) => {
            const newWindow: OpenWindow = {
              id: `window-${app.id}-${Date.now()}`,
              app,
              position: {
                x: 50 + draft.windows.length * 30,
                y: 80 + draft.windows.length * 30
              },
              size: { width: 900, height: 600 },
              isMinimized: false,
              isMaximized: false,
              zIndex: draft.nextZIndex
            }
            draft.windows.push(newWindow)
            draft.nextZIndex++
          })
        },
        
        closeWindow: (windowId) => {
          set((draft) => {
            draft.windows = draft.windows.filter(w => w.id !== windowId)
          })
        },
        
        minimizeWindow: (windowId) => {
          set((draft) => {
            const window = draft.windows.find(w => w.id === windowId)
            if (window) {
              window.isMinimized = true
            }
          })
        },
        
        restoreWindow: (windowId) => {
          set((draft) => {
            const window = draft.windows.find(w => w.id === windowId)
            if (window) {
              window.isMinimized = false
              window.zIndex = draft.nextZIndex
              draft.nextZIndex++
            }
          })
        },
        
        toggleMaximize: (windowId) => {
          set((draft) => {
            const window = draft.windows.find(w => w.id === windowId)
            if (window) {
              window.isMaximized = !window.isMaximized
            }
          })
        },
        
        focusWindow: (windowId) => {
          set((draft) => {
            const window = draft.windows.find(w => w.id === windowId)
            if (window) {
              window.zIndex = draft.nextZIndex
              draft.nextZIndex++
            }
          })
        },
        
        toggleLaunchpad: () => {
          set((draft) => {
            draft.isLaunchpadOpen = !draft.isLaunchpadOpen
          })
        },
        
        // Computed
        getActiveApps: () => {
          return get().windows.map(w => w.app.id)
        },
        
        getWindowByAppId: (appId) => {
          return get().windows.find(w => w.app.id === appId)
        }
      })),
      {
        name: 'desktop-storage',
        partialize: (state) => ({
          windows: state.windows,
          nextZIndex: state.nextZIndex
        })
      }
    ),
    { name: 'DesktopStore' }
  )
)
```

**收益**：
- ✅ 减少不必要的重渲染（通过 selector）
- ✅ 状态持久化（刷新后保留窗口状态）
- ✅ DevTools 支持（便于调试）
- ✅ 类型安全的状态管理
- ✅ 支持中间件扩展（如日志、分析）

---

### 1.2 数据层架构重构 ⭐⭐⭐

**优先级**: 高  
**预计时间**: 1.5 周

#### 设计理念：数据控制界面 (Data Control Interface)

数据控制界面是一个统一的数据访问层，负责：
1. **数据获取和缓存** - 统一管理应用列表、用户信息、权限数据
2. **权限控制** - 基于角色过滤可见应用
3. **数据同步** - 实时更新应用状态和用户会话
4. **错误处理** - 统一的错误处理和重试机制

#### 实现方案：引入 TanStack Query (React Query)

```typescript
// lib/api/applications.ts
import { Application } from '@/types'

export interface ApplicationsResponse {
  applications: Application[]
  categories: string[]
  total: number
}

export class ApplicationsAPI {
  private baseURL: string
  
  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }
  
  async getApplications(roles?: string[]): Promise<ApplicationsResponse> {
    const params = new URLSearchParams()
    if (roles) {
      params.set('roles', roles.join(','))
    }
    
    const response = await fetch(`${this.baseURL}/applications?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 } // 5分钟缓存
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async getApplicationById(id: string): Promise<Application> {
    const response = await fetch(`${this.baseURL}/applications/${id}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch application: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async updateApplicationStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
    const response = await fetch(`${this.baseURL}/applications/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update application status: ${response.statusText}`)
    }
  }
}

export const applicationsAPI = new ApplicationsAPI()
```

```typescript
// hooks/use-applications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsAPI } from '@/lib/api/applications'
import { useSession } from 'next-auth/react'

export function useApplications() {
  const { data: session } = useSession()
  const roles = session?.user?.roles || []
  
  return useQuery({
    queryKey: ['applications', roles],
    queryFn: () => applicationsAPI.getApplications(roles),
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
    enabled: !!session,
  })
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsAPI.getApplicationById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      applicationsAPI.updateApplicationStatus(id, status),
    onSuccess: () => {
      // 更新成功后刷新应用列表
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
```

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  }))
  
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

**收益**：
- ✅ 自动缓存和重新验证
- ✅ 后台数据更新
- ✅ 乐观更新支持
- ✅ 请求重试和错误处理
- ✅ 开发工具支持
- ✅ TypeScript 类型推断

---

### 1.3 模块化重构 - DDD 分层架构 ⭐⭐

**优先级**: 中高  
**预计时间**: 1 周

#### 目标结构

```
applications/desktop-portal/
├── app/                          # Next.js App Router
├── components/                   # Presentation Layer（表现层）
│   ├── desktop/                 # 桌面组件
│   ├── ui/                      # 基础UI组件
│   └── features/                # 功能组件
├── domain/                      # Domain Layer（领域层）🆕
│   ├── models/                  # 领域模型
│   │   ├── Application.ts
│   │   ├── Window.ts
│   │   └── User.ts
│   ├── services/                # 领域服务
│   │   ├── ApplicationService.ts
│   │   ├── WindowManager.ts
│   │   └── PermissionService.ts
│   └── repositories/            # 仓储接口
│       └── IApplicationRepository.ts
├── infrastructure/              # Infrastructure Layer（基础设施层）🆕
│   ├── api/                     # API客户端
│   │   ├── ApplicationsAPI.ts
│   │   └── AuthAPI.ts
│   ├── repositories/            # 仓储实现
│   │   └── ApplicationRepository.ts
│   └── cache/                   # 缓存实现
│       └── ApplicationCache.ts
├── application/                 # Application Layer（应用层）🆕
│   ├── use-cases/              # 用例
│   │   ├── OpenApplication.ts
│   │   ├── CloseWindow.ts
│   │   └── FilterApplications.ts
│   └── dtos/                   # 数据传输对象
│       └── ApplicationDTO.ts
├── lib/                        # 共享工具库
├── hooks/                      # React Hooks
└── types/                      # 类型定义
```

#### 示例：应用领域服务

```typescript
// domain/models/Application.ts
export class ApplicationModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly icon: string,
    public readonly url: string,
    public readonly category: string,
    public readonly roles: string[],
    public readonly status: 'active' | 'coming-soon',
    public readonly color: string,
    public readonly order: number,
    public readonly windowMode: 'window' | 'tab'
  ) {}
  
  canAccessBy(userRoles: string[]): boolean {
    return this.roles.some(role => userRoles.includes(role))
  }
  
  isActive(): boolean {
    return this.status === 'active'
  }
  
  isInternal(): boolean {
    return this.url.startsWith('/')
  }
  
  isExternal(): boolean {
    return this.url.startsWith('http://') || this.url.startsWith('https://')
  }
}
```

```typescript
// domain/services/ApplicationService.ts
import { ApplicationModel } from '../models/Application'

export interface IApplicationRepository {
  findAll(): Promise<ApplicationModel[]>
  findById(id: string): Promise<ApplicationModel | null>
  findByCategory(category: string): Promise<ApplicationModel[]>
}

export class ApplicationService {
  constructor(private repository: IApplicationRepository) {}
  
  async getAccessibleApplications(userRoles: string[]): Promise<ApplicationModel[]> {
    const allApps = await this.repository.findAll()
    return allApps
      .filter(app => app.canAccessBy(userRoles))
      .filter(app => app.isActive())
      .sort((a, b) => a.order - b.order)
  }
  
  async getApplicationsByCategory(
    category: string,
    userRoles: string[]
  ): Promise<ApplicationModel[]> {
    const apps = await this.repository.findByCategory(category)
    return apps
      .filter(app => app.canAccessBy(userRoles))
      .filter(app => app.isActive())
  }
  
  async validateApplicationAccess(
    appId: string,
    userRoles: string[]
  ): Promise<boolean> {
    const app = await this.repository.findById(appId)
    if (!app) return false
    return app.canAccessBy(userRoles) && app.isActive()
  }
}
```

```typescript
// application/use-cases/OpenApplication.ts
import { ApplicationService } from '@/domain/services/ApplicationService'
import { useDesktopStore } from '@/stores/desktop-store'

export class OpenApplicationUseCase {
  constructor(
    private applicationService: ApplicationService
  ) {}
  
  async execute(appId: string, userRoles: string[]): Promise<void> {
    // 1. 验证权限
    const hasAccess = await this.applicationService.validateApplicationAccess(
      appId,
      userRoles
    )
    
    if (!hasAccess) {
      throw new Error('Access denied: You do not have permission to access this application')
    }
    
    // 2. 获取应用信息
    const app = await this.applicationService.getApplicationById(appId)
    if (!app) {
      throw new Error('Application not found')
    }
    
    // 3. 打开应用
    const desktopStore = useDesktopStore.getState()
    desktopStore.openApp(app)
  }
}
```

**收益**：
- ✅ 业务逻辑与UI解耦
- ✅ 易于测试和维护
- ✅ 清晰的依赖关系
- ✅ 可扩展性强

---

## 二、性能优化

### 2.1 组件渲染优化 ⭐⭐⭐

**优先级**: 高  
**预计时间**: 3-5 天

#### 问题分析

1. **Dock 组件** - 每次鼠标移动都触发重渲染
2. **Desktop 组件** - 窗口数组变化导致全量渲染
3. **Launchpad** - 搜索时重新渲染所有应用图标

#### 优化方案

```typescript
// components/desktop/Dock.tsx（优化版）
import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

interface DockItemProps {
  app: Application
  isActive: boolean
  onAppClick: (app: Application) => void
}

// 1. 将单个 Dock 项抽离为独立组件并记忆化
const DockItem = memo(({ app, isActive, onAppClick }: DockItemProps) => {
  const mousePosition = useMotionValue(0)
  const distance = useTransform(mousePosition, [-150, 0, 150], [50, 80, 50])
  const width = useSpring(distance, { mass: 0.1, stiffness: 150, damping: 12 })
  
  return (
    <motion.button
      className="relative flex flex-col items-center"
      style={{ width }}
      onClick={() => onAppClick(app)}
    >
      <div className="text-4xl">{app.icon}</div>
      {isActive && (
        <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-white" />
      )}
    </motion.button>
  )
})

DockItem.displayName = 'DockItem'

export const Dock = memo(({ applications, onAppClick, activeApps }: DockProps) => {
  // 2. 使用 useMemo 缓存计算结果
  const sortedApps = useMemo(() => 
    applications
      .filter(app => app.status === 'active')
      .sort((a, b) => a.order - b.order)
      .slice(0, 8),
    [applications]
  )
  
  // 3. 使用 Set 优化查找性能
  const activeAppSet = useMemo(() => new Set(activeApps), [activeApps])
  
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-end gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-2xl">
        {sortedApps.map((app) => (
          <DockItem
            key={app.id}
            app={app}
            isActive={activeAppSet.has(app.id)}
            onAppClick={onAppClick}
          />
        ))}
      </div>
    </div>
  )
})

Dock.displayName = 'Dock'
```

```typescript
// components/desktop/Launchpad.tsx（优化版）
import { memo, useMemo, useDeferredValue } from 'react'

const AppIcon = memo(({ app, onClick }: { app: Application; onClick: () => void }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, y: -8 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="text-6xl">{app.icon}</div>
      <span className="text-sm text-white">{app.name}</span>
    </motion.button>
  )
})

AppIcon.displayName = 'AppIcon'

export const Launchpad = memo(({ applications, isOpen, onClose, onAppClick }: LaunchpadProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  
  // 使用 useDeferredValue 延迟搜索结果更新，避免阻塞输入
  const deferredSearchQuery = useDeferredValue(searchQuery)
  
  const filteredApps = useMemo(() => {
    if (!deferredSearchQuery) return applications
    
    const query = deferredSearchQuery.toLowerCase()
    return applications.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query)
    )
  }, [applications, deferredSearchQuery])
  
  if (!isOpen) return null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xl"
    >
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search applications..."
        className="mt-20 mx-auto block w-96 px-6 py-3 rounded-lg"
      />
      
      <div className="grid grid-cols-7 gap-8 px-20 py-12">
        {filteredApps.map((app, index) => (
          <AppIcon
            key={app.id}
            app={app}
            onClick={() => onAppClick(app)}
          />
        ))}
      </div>
    </motion.div>
  )
})

Launchpad.displayName = 'Launchpad'
```

**收益**：
- ✅ 减少 50%+ 的不必要渲染
- ✅ 提升鼠标交互流畅度
- ✅ 搜索输入不卡顿

---

### 2.2 代码分割和懒加载 ⭐⭐

**优先级**: 中  
**预计时间**: 2-3 天

```typescript
// components/desktop/index.ts
export { Desktop } from './Desktop'

// 懒加载非关键组件
export const Launchpad = dynamic(() => import('./Launchpad').then(mod => ({ default: mod.Launchpad })), {
  loading: () => <div className="fixed inset-0 bg-black/50 backdrop-blur-xl" />,
  ssr: false
})

export const Window = dynamic(() => import('./Window').then(mod => ({ default: mod.Window })), {
  ssr: false
})
```

```typescript
// app/(portal)/desktop/page.tsx
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const Desktop = dynamic(() => import('@/components/desktop/Desktop').then(m => ({ default: m.Desktop })), {
  loading: () => <DesktopSkeleton />,
  ssr: false
})

export default function DesktopPage() {
  return (
    <Suspense fallback={<DesktopSkeleton />}>
      <Desktop applications={applications} />
    </Suspense>
  )
}
```

---

### 2.3 虚拟化和分页 ⭐

**优先级**: 低  
**预计时间**: 2 天

当应用数量超过 100 个时，使用虚拟列表优化 Launchpad：

```typescript
// 使用 react-virtual
import { useVirtualizer } from '@tanstack/react-virtual'

export function Launchpad({ applications }: LaunchpadProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(applications.length / 7),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 2
  })
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const startIndex = virtualRow.index * 7
          const rowApps = applications.slice(startIndex, startIndex + 7)
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
              className="grid grid-cols-7 gap-8"
            >
              {rowApps.map(app => <AppIcon key={app.id} app={app} />)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## 三、代码质量提升

### 3.1 TypeScript 严格模式和类型优化 ⭐⭐

**优先级**: 中高  
**预计时间**: 2-3 天

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

```typescript
// types/index.ts（改进版）
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

export type ApplicationCategory = 'productivity' | 'ai' | 'analytics' | 'admin' | 'tools'
export type ApplicationStatus = 'active' | 'coming-soon' | 'maintenance'
export type WindowMode = 'window' | 'tab'
export type Role = 'user' | 'admin' | 'developer'

// 使用品牌类型确保类型安全
export type ApplicationId = string & { readonly __brand: 'ApplicationId' }
export type WindowId = string & { readonly __brand: 'WindowId' }

// 类型守卫
export function isApplication(obj: unknown): obj is Application {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'url' in obj
  )
}
```

---

### 3.2 错误处理和边界 ⭐⭐⭐

**优先级**: 高  
**预计时间**: 2-3 天

```typescript
// components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">出错了</h1>
            <p className="text-gray-600 mt-2">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              重试
            </button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

```typescript
// lib/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export function handleApiError(error: unknown): never {
  if (error instanceof AppError) {
    throw error
  }
  
  if (error instanceof Error) {
    throw new AppError(error.message, 'INTERNAL_ERROR', 500)
  }
  
  throw new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500)
}
```

---

### 3.3 测试覆盖 ⭐⭐

**优先级**: 中  
**预计时间**: 1 周

```typescript
// __tests__/components/desktop/Dock.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Dock } from '@/components/desktop/Dock'
import { mockApplications } from '@/test/fixtures/applications'

describe('Dock Component', () => {
  it('renders all active applications', () => {
    render(
      <Dock
        applications={mockApplications}
        onAppClick={jest.fn()}
        activeApps={[]}
        onLaunchpadClick={jest.fn()}
      />
    )
    
    expect(screen.getByText('Task Manager')).toBeInTheDocument()
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
  })
  
  it('shows active indicator for running apps', () => {
    const { container } = render(
      <Dock
        applications={mockApplications}
        onAppClick={jest.fn()}
        activeApps={['task-manager']}
        onLaunchpadClick={jest.fn()}
      />
    )
    
    const activeIndicators = container.querySelectorAll('.bg-white')
    expect(activeIndicators).toHaveLength(1)
  })
  
  it('calls onAppClick when app is clicked', () => {
    const handleAppClick = jest.fn()
    
    render(
      <Dock
        applications={mockApplications}
        onAppClick={handleAppClick}
        activeApps={[]}
        onLaunchpadClick={jest.fn()}
      />
    )
    
    fireEvent.click(screen.getByText('Task Manager'))
    expect(handleAppClick).toHaveBeenCalledWith(mockApplications[0])
  })
})
```

```typescript
// __tests__/domain/services/ApplicationService.test.ts
import { ApplicationService } from '@/domain/services/ApplicationService'
import { MockApplicationRepository } from '@/test/mocks/ApplicationRepository'
import { mockApplications } from '@/test/fixtures/applications'

describe('ApplicationService', () => {
  let service: ApplicationService
  let repository: MockApplicationRepository
  
  beforeEach(() => {
    repository = new MockApplicationRepository(mockApplications)
    service = new ApplicationService(repository)
  })
  
  describe('getAccessibleApplications', () => {
    it('returns only apps accessible by user roles', async () => {
      const apps = await service.getAccessibleApplications(['user'])
      
      expect(apps).toHaveLength(5)
      expect(apps.every(app => app.roles.includes('user'))).toBe(true)
    })
    
    it('filters out inactive apps', async () => {
      const apps = await service.getAccessibleApplications(['admin'])
      
      expect(apps.every(app => app.status === 'active')).toBe(true)
    })
    
    it('sorts apps by order', async () => {
      const apps = await service.getAccessibleApplications(['admin'])
      
      for (let i = 1; i < apps.length; i++) {
        expect(apps[i].order).toBeGreaterThanOrEqual(apps[i - 1].order)
      }
    })
  })
  
  describe('validateApplicationAccess', () => {
    it('returns true for accessible active apps', async () => {
      const hasAccess = await service.validateApplicationAccess(
        'task-manager',
        ['user']
      )
      
      expect(hasAccess).toBe(true)
    })
    
    it('returns false for apps without permission', async () => {
      const hasAccess = await service.validateApplicationAccess(
        'admin-panel',
        ['user']
      )
      
      expect(hasAccess).toBe(false)
    })
    
    it('returns false for non-existent apps', async () => {
      const hasAccess = await service.validateApplicationAccess(
        'non-existent',
        ['admin']
      )
      
      expect(hasAccess).toBe(false)
    })
  })
})
```

---

## 四、安全性增强

### 4.1 权限验证中间件 ⭐⭐⭐

**优先级**: 高  
**预计时间**: 2 天

```typescript
// middleware.ts（改进版）
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicPaths = ['/login', '/error', '/about']
const adminPaths = ['/admin', '/settings/users']

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl
  
  // 公开路径，直接放行
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // 未登录，重定向到登录页
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 管理员路径权限检查
  if (adminPaths.some(path => pathname.startsWith(path))) {
    const roles = (token.roles as string[]) || []
    
    if (!roles.includes('admin')) {
      return NextResponse.redirect(new URL('/error?code=403', request.url))
    }
  }
  
  // 添加安全头
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  )
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

### 4.2 XSS 和 CSRF 防护 ⭐⭐

**优先级**: 中高  
**预计时间**: 1-2 天

```typescript
// lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url)
    // 只允许 http 和 https 协议
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol')
    }
    return parsed.toString()
  } catch {
    return '#'
  }
}
```

```typescript
// components/desktop/Window.tsx（安全版）
export function Window({ url, title }: WindowProps) {
  const sanitizedUrl = useMemo(() => sanitizeURL(url), [url])
  
  return (
    <div className="window">
      <iframe
        src={sanitizedUrl}
        title={title}
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
```

---

## 五、可访问性 (A11y) 提升

### 5.1 键盘导航优化 ⭐⭐

**优先级**: 中  
**预计时间**: 2-3 天

```typescript
// hooks/use-keyboard-navigation.ts
import { useEffect, useRef } from 'react'

export function useKeyboardNavigation<T extends HTMLElement>(
  items: T[],
  onSelect: (item: T) => void
) {
  const currentIndexRef = useRef(0)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          currentIndexRef.current = (currentIndexRef.current + 1) % items.length
          items[currentIndexRef.current]?.focus()
          break
          
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          currentIndexRef.current = (currentIndexRef.current - 1 + items.length) % items.length
          items[currentIndexRef.current]?.focus()
          break
          
        case 'Enter':
        case ' ':
          e.preventDefault()
          onSelect(items[currentIndexRef.current])
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, onSelect])
}
```

---

### 5.2 ARIA 属性和语义化 ⭐⭐

**优先级**: 中  
**预计时间**: 2 天

```typescript
// components/desktop/Dock.tsx（无障碍版）
export function Dock({ applications, onAppClick }: DockProps) {
  return (
    <nav
      role="navigation"
      aria-label="Application Dock"
      className="dock"
    >
      <ul role="list" className="dock-list">
        {applications.map((app) => (
          <li key={app.id} role="listitem">
            <button
              onClick={() => onAppClick(app)}
              aria-label={`Open ${app.name}`}
              aria-describedby={`desc-${app.id}`}
              className="dock-item"
            >
              <span aria-hidden="true">{app.icon}</span>
              <span className="sr-only">{app.name}</span>
            </button>
            <div id={`desc-${app.id}`} className="sr-only">
              {app.description}
            </div>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

---

## 六、监控和日志

### 6.1 性能监控 ⭐⭐

**优先级**: 中  
**预计时间**: 2-3 天

```typescript
// lib/monitoring/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  
  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor()
    }
    return this.instance
  }
  
  measureComponentRender(componentName: string, callback: () => void) {
    const startTime = performance.now()
    callback()
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (duration > 16) { // 超过一帧时间
      console.warn(`Slow render: ${componentName} took ${duration.toFixed(2)}ms`)
    }
    
    // 发送到分析服务
    this.sendMetric('component_render', {
      component: componentName,
      duration,
    })
  }
  
  measureAPICall(endpoint: string, callback: () => Promise<any>) {
    const startTime = performance.now()
    
    return callback()
      .then(result => {
        const duration = performance.now() - startTime
        this.sendMetric('api_call', {
          endpoint,
          duration,
          status: 'success'
        })
        return result
      })
      .catch(error => {
        const duration = performance.now() - startTime
        this.sendMetric('api_call', {
          endpoint,
          duration,
          status: 'error',
          error: error.message
        })
        throw error
      })
  }
  
  private sendMetric(name: string, data: Record<string, any>) {
    // 发送到 Google Analytics, Sentry, 或自定义服务
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, data)
    }
  }
}
```

---

### 6.2 错误追踪 ⭐⭐

**优先级**: 中  
**预计时间**: 1-2 天

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    beforeSend(event, hint) {
      // 过滤敏感信息
      if (event.request) {
        delete event.request.cookies
        delete event.request.headers
      }
      return event
    },
  })
}

export function logError(error: Error, context?: Record<string, any>) {
  console.error(error)
  
  Sentry.captureException(error, {
    contexts: {
      custom: context
    }
  })
}
```

---

## 七、文档和开发体验

### 7.1 组件文档 (Storybook) ⭐

**优先级**: 低  
**预计时间**: 3-4 天

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
}

export default config
```

```typescript
// components/desktop/Dock.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Dock } from './Dock'
import { mockApplications } from '@/test/fixtures/applications'

const meta: Meta<typeof Dock> = {
  title: 'Desktop/Dock',
  component: Dock,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Dock>

export const Default: Story = {
  args: {
    applications: mockApplications,
    activeApps: [],
    onAppClick: (app) => console.log('Clicked:', app.name),
    onLaunchpadClick: () => console.log('Launchpad clicked'),
  },
}

export const WithActiveApps: Story = {
  args: {
    ...Default.args,
    activeApps: ['task-manager', 'ai-assistant'],
  },
}
```

---

### 7.2 API 文档 ⭐

**优先级**: 低  
**预计时间**: 2 天

使用 OpenAPI/Swagger 生成 API 文档：

```typescript
// app/api/swagger/route.ts
import { NextResponse } from 'next/server'
import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DreamBuilder Portal API',
      version: '1.0.0',
      description: 'Desktop Portal API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./app/api/**/*.ts'],
}

const swaggerSpec = swaggerJsdoc(options)

export async function GET() {
  return NextResponse.json(swaggerSpec)
}
```

---

## 八、实施计划

### 阶段 1: 基础重构（第 1-2 周）

- [ ] 引入 Zustand 状态管理
- [ ] 实现数据层架构（React Query）
- [ ] TypeScript 严格模式
- [ ] 错误边界和处理

### 阶段 2: 性能优化（第 3 周）

- [ ] 组件记忆化和优化
- [ ] 代码分割和懒加载
- [ ] 性能监控集成

### 阶段 3: DDD 重构（第 4 周）

- [ ] 领域模型设计
- [ ] 应用层和领域服务
- [ ] 仓储模式实现

### 阶段 4: 安全和测试（第 5 周）

- [ ] 权限验证中间件
- [ ] 安全头和 XSS 防护
- [ ] 单元测试和集成测试

### 阶段 5: 可访问性和文档（第 6 周）

- [ ] 键盘导航和 ARIA
- [ ] Storybook 组件文档
- [ ] API 文档生成

---

## 九、成功指标

### 性能指标

- ✅ 首屏加载时间 < 2s
- ✅ 组件渲染时间 < 16ms (60fps)
- ✅ Lighthouse 性能得分 > 90
- ✅ TTI (Time to Interactive) < 3s

### 代码质量指标

- ✅ TypeScript 覆盖率 100%
- ✅ 测试覆盖率 > 80%
- ✅ ESLint 零错误
- ✅ 代码重复率 < 5%

### 用户体验指标

- ✅ WCAG 2.1 AA 级别合规
- ✅ 键盘导航完全支持
- ✅ 屏幕阅读器兼容

---

## 十、依赖包更新

```bash
# 状态管理
pnpm add zustand immer

# 数据获取
pnpm add @tanstack/react-query @tanstack/react-query-devtools

# 安全
pnpm add isomorphic-dompurify

# 测试
pnpm add -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

# 监控
pnpm add @sentry/nextjs

# 文档
pnpm add -D @storybook/react @storybook/addon-essentials @storybook/addon-a11y

# 虚拟化（可选）
pnpm add @tanstack/react-virtual
```

---

## 十一、风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 大规模重构导致功能回退 | 高 | 中 | 分阶段实施，保留旧代码，充分测试 |
| 性能优化引入新bug | 中 | 中 | 性能监控，A/B测试，渐进式部署 |
| 依赖包版本冲突 | 低 | 低 | 使用 pnpm，锁定版本 |
| 团队学习曲线 | 中 | 高 | 提供培训，编写文档，代码审查 |

---

## 十二、后续迭代建议

### v2.1 规划

- [ ] 应用商店功能
- [ ] 窗口标签页支持
- [ ] 多显示器支持
- [ ] 窗口分屏和贴靠

### v3.0 规划

- [ ] 实时协作功能
- [ ] AI 助手集成
- [ ] 插件系统
- [ ] 移动端适配

---

## 附录

### A. 参考资料

- [Next.js 性能优化](https://nextjs.org/docs/advanced-features/measuring-performance)
- [React 性能优化](https://react.dev/learn/render-and-commit)
- [DDD 领域驱动设计](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [Ark Desktop 源码](https://github.com/longguikeji/ark-desktop)

### B. 工具和资源

- **性能分析**: Lighthouse, React DevTools Profiler
- **状态管理**: Zustand Devtools
- **数据获取**: React Query Devtools
- **测试**: Jest, React Testing Library
- **文档**: Storybook, Swagger
- **监控**: Sentry, Google Analytics

---

**文档版本**: v1.0  
**最后更新**: 2025-10-16  
**维护者**: DreamBuilder Team

