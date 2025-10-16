# 优化功能快速使用指南

本指南介绍如何使用 Desktop Portal 中新增的优化功能。

---

## 📦 状态管理 (Zustand)

### 基本用法

```typescript
import { useDesktopStore } from '@/stores/desktop-store'

function MyComponent() {
  // 只订阅需要的状态（避免不必要的重渲染）
  const windows = useDesktopStore(state => state.windows)
  const openApp = useDesktopStore(state => state.openApp)
  
  // 使用方法
  const handleClick = () => {
    openApp(myApp)
  }
  
  return <button onClick={handleClick}>打开应用</button>
}
```

### 可用的状态和方法

```typescript
// 状态
windows: OpenWindow[]           // 打开的窗口列表
nextZIndex: number              // 下一个窗口的 z-index
isLaunchpadOpen: boolean        // 启动台是否打开

// 方法
openApp(app)                    // 打开应用
closeWindow(windowId)           // 关闭窗口
minimizeWindow(windowId)        // 最小化窗口
restoreWindow(windowId)         // 恢复窗口
toggleMaximize(windowId)        // 切换最大化
focusWindow(windowId)           // 聚焦窗口
toggleLaunchpad()               // 切换启动台
getActiveApps()                 // 获取活动应用列表
```

---

## 🔄 数据获取 (React Query)

### 获取应用列表

```typescript
import { useApplications } from '@/hooks/use-applications'

function MyComponent() {
  const { data, isLoading, error } = useApplications()
  
  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败: {error.message}</div>
  
  return (
    <div>
      {data?.applications.map(app => (
        <div key={app.id}>{app.name}</div>
      ))}
    </div>
  )
}
```

### 获取单个应用

```typescript
import { useApplication } from '@/hooks/use-applications'

function AppDetail({ appId }: { appId: string }) {
  const { data: app, isLoading } = useApplication(appId)
  
  if (isLoading) return <div>加载中...</div>
  if (!app) return <div>应用不存在</div>
  
  return <div>{app.name}</div>
}
```

### 更新应用状态

```typescript
import { useUpdateApplicationStatus } from '@/hooks/use-applications'

function AdminPanel() {
  const mutation = useUpdateApplicationStatus()
  
  const handleToggle = (appId: string) => {
    mutation.mutate({ 
      id: appId, 
      status: 'inactive' 
    })
  }
  
  return <button onClick={() => handleToggle('app-1')}>禁用应用</button>
}
```

---

## ⌨️ 键盘快捷键

### 内置快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + Space` | 打开/关闭启动台 |
| `Cmd/Ctrl + W` | 关闭当前窗口 |
| `Cmd/Ctrl + M` | 最小化当前窗口 |
| `Escape` | 关闭启动台 |

### 自定义快捷键

```typescript
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

function MyComponent() {
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      handler: () => {
        console.log('保存')
      },
      description: '保存文档'
    }
  ])
  
  return <div>我的组件</div>
}
```

---

## 📊 性能监控

### 监控组件渲染

```typescript
import { performanceMonitor } from '@/lib/monitoring/performance'

function MyComponent() {
  performanceMonitor.measureComponentRender('MyComponent', () => {
    // 组件渲染逻辑
  })
  
  return <div>我的组件</div>
}
```

### 监控 API 调用

```typescript
import { performanceMonitor } from '@/lib/monitoring/performance'

async function fetchData() {
  return await performanceMonitor.measureAPICall(
    '/api/applications',
    () => fetch('/api/applications').then(r => r.json())
  )
}
```

### 查看性能报告

```typescript
import { performanceMonitor } from '@/lib/monitoring/performance'

// 在浏览器控制台中运行
console.log(performanceMonitor.exportReport())

// 获取特定指标统计
const stats = performanceMonitor.getStats('component_render')
console.log('Average render time:', stats.average, 'ms')
```

---

## 🔒 安全功能

### HTML 内容净化

```typescript
import { sanitizeHTML, sanitizeText } from '@/lib/security/sanitize'

// 净化 HTML（保留安全标签）
const cleanHTML = sanitizeHTML(userInput)

// 净化为纯文本（移除所有标签）
const cleanText = sanitizeText(userInput)
```

### URL 验证

```typescript
import { sanitizeURL, validateApplicationURL } from '@/lib/security/sanitize'

// 净化 URL
const safeURL = sanitizeURL(userProvidedURL)

// 验证应用 URL
const validation = validateApplicationURL(app.url)
if (validation.isValid) {
  window.open(validation.sanitized)
}
```

---

## 🎯 DDD 架构使用

### 使用领域模型

```typescript
import { ApplicationModel } from '@/domain/models/Application'
import type { Application } from '@/types'

// 从 DTO 创建领域模型
const model = ApplicationModel.fromDTO(applicationDTO)

// 使用领域逻辑
if (model.canAccessBy(['user'])) {
  console.log('用户有权限访问')
}

if (model.isActive()) {
  console.log('应用可用')
}
```

### 使用应用服务

```typescript
import { ApplicationService } from '@/domain/services/ApplicationService'
import { applicationRepository } from '@/infrastructure/repositories/ApplicationRepository'

const service = new ApplicationService(applicationRepository)

// 获取用户可访问的应用
const apps = await service.getAccessibleApplications(['user', 'admin'])

// 验证访问权限
const validation = await service.validateApplicationAccess('app-1', ['user'])
if (validation.canAccess) {
  console.log('可以访问')
} else {
  console.log('拒绝访问:', validation.reason)
}
```

### 使用用例

```typescript
import { OpenApplicationUseCase } from '@/application/use-cases/OpenApplication'
import { applicationService } from '@/application/container'

const useCase = new OpenApplicationUseCase(applicationService)

const result = await useCase.execute({
  appId: 'my-app',
  userRoles: ['user']
})

if (result.success) {
  window.open(result.url)
}
```

---

## 🎨 组件优化最佳实践

### 使用记忆化

```typescript
import { memo, useMemo, useCallback } from 'react'

// 记忆化组件
const MyComponent = memo(({ data, onUpdate }: Props) => {
  // 缓存计算结果
  const processedData = useMemo(() => {
    return data.map(item => expensiveProcessing(item))
  }, [data])
  
  // 缓存回调函数
  const handleClick = useCallback(() => {
    onUpdate(processedData)
  }, [onUpdate, processedData])
  
  return <div onClick={handleClick}>...</div>
})

MyComponent.displayName = 'MyComponent'
```

### 使用延迟值

```typescript
import { useState, useDeferredValue } from 'react'

function SearchableList({ items }: Props) {
  const [query, setQuery] = useState('')
  
  // 延迟搜索结果更新，避免输入卡顿
  const deferredQuery = useDeferredValue(query)
  
  const filtered = useMemo(() => 
    items.filter(item => item.name.includes(deferredQuery)),
    [items, deferredQuery]
  )
  
  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <List items={filtered} />
    </>
  )
}
```

---

## 🐛 错误处理

### 使用 ErrorBoundary

```typescript
import { ErrorBoundary } from '@/components/error-boundary'

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('捕获到错误:', error, errorInfo)
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### 自定义错误

```typescript
import { AppError, UnauthorizedError, NotFoundError } from '@/lib/errors/app-error'

// 抛出自定义错误
throw new UnauthorizedError('您没有权限访问此资源')

// 或
throw new NotFoundError('应用')

// 或通用错误
throw new AppError('操作失败', 'OPERATION_FAILED', 500)
```

---

## 🚀 懒加载组件

### 使用动态导入

```typescript
import dynamic from 'next/dynamic'

// 懒加载组件
const HeavyComponent = dynamic(
  () => import('./HeavyComponent').then(mod => ({ default: mod.HeavyComponent })),
  {
    loading: () => <div>加载中...</div>,
    ssr: false
  }
)

function MyPage() {
  return (
    <div>
      <HeavyComponent />
    </div>
  )
}
```

---

## 📝 TypeScript 类型

### 使用严格类型

```typescript
// 推荐：显式类型注解
function processApp(app: Application): void {
  console.log(app.name)
}

// 推荐：使用类型守卫
function isApplication(obj: unknown): obj is Application {
  return typeof obj === 'object' && obj !== null && 'id' in obj
}

// 避免：使用 any
function badFunction(data: any) { // ❌
  return data.someProp
}

// 推荐：使用 unknown
function goodFunction(data: unknown) { // ✅
  if (isApplication(data)) {
    return data.name
  }
  throw new Error('Invalid data')
}
```

---

## 🔧 开发工具

### React Query DevTools

在开发环境中，React Query DevTools 会自动显示：

```typescript
// 已在 app/providers.tsx 中配置
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

访问页面后，点击浮动的 React Query 图标查看查询状态。

### Zustand DevTools

在浏览器中安装 Redux DevTools 扩展后，可以查看 Zustand 状态变化。

---

## 💡 提示和技巧

### 1. 避免过度优化
- 先测量性能问题再优化
- 不是所有组件都需要 memo
- 只在计算开销大时使用 useMemo

### 2. 正确使用依赖数组
```typescript
// ❌ 错误：缺少依赖
useEffect(() => {
  doSomething(value)
}, []) // 缺少 value

// ✅ 正确：包含所有依赖
useEffect(() => {
  doSomething(value)
}, [value])
```

### 3. 使用 React Query 替代 useEffect
```typescript
// ❌ 不推荐
useEffect(() => {
  fetch('/api/data').then(setData)
}, [])

// ✅ 推荐
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: () => fetch('/api/data').then(r => r.json())
})
```

---

## 📚 更多资源

- [代码优化计划](./CODE_OPTIMIZATION_PLAN.md)
- [DDD 架构指南](./DDD_ARCHITECTURE_GUIDE.md)
- [优化完成报告](./OPTIMIZATION_COMPLETION_REPORT.md)
- [React Query 文档](https://tanstack.com/query/latest)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)

---

**更新日期**: 2025-10-16  
**维护者**: DreamBuilder Team

