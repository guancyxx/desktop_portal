# 代码优化实施指南

本文档说明已实施的代码优化内容和使用方法。

## 📦 新增依赖

已在 `package.json` 中添加以下依赖：

```json
{
  "immer": "^10.0.3",
  "@tanstack/react-query": "^5.17.0",
  "@tanstack/react-query-devtools": "^5.17.0",
  "isomorphic-dompurify": "^2.9.0"
}
```

## 🔧 安装依赖

在容器中安装新依赖：

```bash
# 重启 desktop-portal 容器以安装新依赖
docker-compose restart desktop-portal

# 或者进入容器手动安装
docker-compose exec desktop-portal pnpm install
```

## ✅ 已实施的优化

### 阶段 1：基础重构

#### 1. Zustand 状态管理

**文件**: `stores/desktop-store.ts`

**特性**:
- 使用 Immer 实现不可变状态更新
- 状态持久化到 localStorage
- DevTools 支持（开发环境）
- 类型安全的状态管理

**使用示例**:

```typescript
import { useDesktopStore } from '@/stores/desktop-store'

function MyComponent() {
  const { windows, openApp, closeWindow } = useDesktopStore()
  
  return (
    <button onClick={() => openApp(someApp)}>
      打开应用
    </button>
  )
}
```

#### 2. TanStack Query 数据层

**文件**: 
- `lib/api/applications.ts` - API 客户端
- `hooks/use-applications.ts` - React Query hooks
- `app/providers.tsx` - Provider 配置

**特性**:
- 自动缓存和重新验证
- 后台数据更新
- 请求重试和错误处理
- DevTools 支持

**使用示例**:

```typescript
import { useApplications } from '@/hooks/use-applications'

function AppList() {
  const { data, isLoading, error } = useApplications()
  
  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>
  
  return (
    <div>
      {data?.applications.map(app => (
        <div key={app.id}>{app.name}</div>
      ))}
    </div>
  )
}
```

#### 3. TypeScript 严格模式

**文件**: `tsconfig.json`

**启用的选项**:
- `noImplicitAny`
- `strictNullChecks`
- `noUnusedLocals`
- `noUnusedParameters`
- `noImplicitReturns`
- `noUncheckedIndexedAccess`

**类型优化**: `types/index.ts`
- 使用 `readonly` 确保不可变性
- 添加类型守卫函数
- 使用联合类型替代字符串字面量

#### 4. 错误处理系统

**文件**:
- `lib/errors/app-error.ts` - 自定义错误类
- `components/error-boundary.tsx` - React 错误边界

**错误类型**:
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ValidationError` (400)
- `NetworkError`
- `ServerError` (500)

**使用示例**:

```typescript
import { ErrorBoundary } from '@/components/error-boundary'
import { NotFoundError } from '@/lib/errors/app-error'

function App() {
  return (
    <ErrorBoundary onError={(error) => console.error(error)}>
      <YourComponent />
    </ErrorBoundary>
  )
}

// 在 API 中抛出错误
if (!data) {
  throw new NotFoundError('应用')
}
```

### 阶段 2：性能优化

#### 5. 组件性能优化

**文件**: `components/desktop/Dock.optimized.tsx`

**优化技术**:
- 使用 `memo` 避免不必要的重渲染
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存事件处理器
- 拆分子组件减小渲染范围
- 使用 Set 优化查找性能

**应用到其他组件**:

```typescript
import { memo, useMemo, useCallback } from 'react'

export const MyComponent = memo(function MyComponent({ data }) {
  // 缓存复杂计算
  const processedData = useMemo(() => {
    return data.map(item => /* 复杂处理 */)
  }, [data])
  
  // 缓存回调函数
  const handleClick = useCallback(() => {
    // 处理点击
  }, [/* 依赖项 */])
  
  return <div onClick={handleClick}>{/* UI */}</div>
})
```

#### 6. 性能监控

**文件**: `lib/monitoring/performance.ts`

**功能**:
- 测量组件渲染时间
- 测量 API 调用时间
- 测量异步操作时间
- 性能统计和报告

**使用示例**:

```typescript
import { performanceMonitor } from '@/lib/monitoring/performance'

// 测量 API 调用
const data = await performanceMonitor.measureAPICall(
  '/api/applications',
  () => fetch('/api/applications').then(r => r.json())
)

// 查看性能报告
console.log(performanceMonitor.exportReport())
```

### 阶段 3：安全性增强

#### 7. XSS 防护

**文件**: `lib/security/sanitize.ts`

**功能**:
- HTML 内容净化
- URL 验证和净化
- 内外部链接检测

**使用示例**:

```typescript
import { sanitizeHTML, sanitizeURL, validateApplicationURL } from '@/lib/security/sanitize'

// 净化 HTML
const clean = sanitizeHTML(userInput)

// 验证 URL
const { isValid, sanitized, isExternal } = validateApplicationURL(app.url)
```

#### 8. 增强的中间件

**文件**: `middleware.ts`

**功能**:
- 基于角色的权限控制
- 安全响应头
- Content Security Policy
- XSS 防护头

**安全头**:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`

#### 9. 键盘快捷键

**文件**: `hooks/use-keyboard-shortcuts.ts`

**快捷键**:
- `F4` 或 `Cmd/Ctrl+L`: 打开/关闭启动台
- `Cmd/Ctrl+W`: 关闭当前窗口
- `Escape`: 关闭启动台

**使用示例**:

```typescript
import { useKeyboardShortcuts, useKeyboardShortcut } from '@/hooks/use-keyboard-shortcuts'

function Desktop() {
  // 使用全局快捷键
  useKeyboardShortcuts()
  
  // 或自定义快捷键
  useKeyboardShortcut([
    {
      key: 's',
      ctrl: true,
      handler: () => console.log('Ctrl+S pressed')
    }
  ])
  
  return <div>...</div>
}
```

## 🔄 迁移指南

### 从旧的 useDesktop Hook 迁移到 Zustand

**之前**:
```typescript
import { useDesktop } from '@/hooks/use-desktop'

function Component() {
  const { windows, openApp } = useDesktop()
}
```

**之后**:
```typescript
import { useDesktopStore } from '@/stores/desktop-store'

function Component() {
  const { windows, openApp } = useDesktopStore()
}
```

### 使用新的数据获取方式

**之前**:
```typescript
const [apps, setApps] = useState([])

useEffect(() => {
  fetch('/api/applications')
    .then(r => r.json())
    .then(setApps)
}, [])
```

**之后**:
```typescript
import { useApplications } from '@/hooks/use-applications'

function Component() {
  const { data, isLoading } = useApplications()
  const apps = data?.applications || []
}
```

## 📊 性能指标

### 预期改进

- ✅ 组件渲染时间减少 50%+
- ✅ 不必要的重渲染减少 60%+
- ✅ API 请求自动缓存，减少网络调用
- ✅ 键盘交互响应时间 < 16ms (60fps)

### 监控方式

1. **React Query DevTools**: 开发环境右下角自动显示
2. **Zustand DevTools**: 浏览器 Redux DevTools 扩展
3. **性能监控**: 在控制台查看性能警告
4. **性能报告**: 
   ```javascript
   performanceMonitor.exportReport()
   ```

## 🐛 调试

### React Query 调试

```typescript
// 查看查询状态
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()
console.log(queryClient.getQueryData(['applications']))
```

### Zustand 调试

```typescript
// 在组件外访问 store
import { useDesktopStore } from '@/stores/desktop-store'

console.log(useDesktopStore.getState())
```

### 性能调试

```typescript
// 查看性能统计
performanceMonitor.getStats('component_render')
performanceMonitor.getStats('api_call')
```

## 🚀 下一步计划

### 待实施的优化

- [ ] 领域驱动设计 (DDD) 重构
- [ ] 代码分割和懒加载
- [ ] 虚拟化列表（应用数量 > 100）
- [ ] Storybook 组件文档
- [ ] 单元测试和集成测试

### 建议的使用流程

1. **立即应用**: 使用新的 Zustand store 和 React Query hooks
2. **逐步迁移**: 将现有组件迁移到优化版本
3. **监控性能**: 使用性能监控工具跟踪改进
4. **测试验证**: 确保功能正常且性能提升

## 📝 注意事项

1. **容器重启**: 修改 `package.json` 后需要重启容器
2. **类型检查**: 启用严格模式后可能出现类型错误，需要逐步修复
3. **性能监控**: 开发环境启用，生产环境可选择性启用
4. **错误边界**: 在关键组件树位置添加错误边界

## 🔗 相关文档

- [Zustand 文档](https://docs.pmnd.rs/zustand)
- [TanStack Query 文档](https://tanstack.com/query/latest)
- [TypeScript 严格模式](https://www.typescriptlang.org/tsconfig#strict)
- [React 性能优化](https://react.dev/learn/render-and-commit)

---

**最后更新**: 2025-10-16  
**版本**: v1.0  
**作者**: DreamBuilder Team

