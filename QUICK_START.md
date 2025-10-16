# 🚀 快速开始 - 代码优化应用指南

本指南帮助您快速应用已完成的代码优化。

---

## 📦 第一步：安装依赖

### 方式 1：重启容器（推荐）

```bash
# 停止并重新启动 desktop-portal 容器
docker-compose restart desktop-portal

# 查看日志确认依赖安装
docker-compose logs -f desktop-portal
```

### 方式 2：手动安装

```bash
# 进入容器
docker-compose exec desktop-portal sh

# 安装依赖
pnpm install

# 退出
exit
```

---

## 🔧 第二步：使用新的状态管理

### 替换 useDesktop Hook

**之前**:
```typescript
import { useDesktop } from '@/hooks/use-desktop'

function Component() {
  const { windows, openApp, closeWindow } = useDesktop()
  // ...
}
```

**之后**:
```typescript
import { useDesktopStore } from '@/stores/desktop-store'

function Component() {
  const { windows, openApp, closeWindow } = useDesktopStore()
  // ...
}
```

### 使用选择器优化性能

```typescript
// 只订阅需要的状态
const windows = useDesktopStore(state => state.windows)
const openApp = useDesktopStore(state => state.openApp)
```

---

## 📡 第三步：使用数据获取 Hooks

### 替换手动数据获取

**之前**:
```typescript
const [apps, setApps] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch('/api/applications')
    .then(r => r.json())
    .then(data => {
      setApps(data.applications)
      setLoading(false)
    })
}, [])
```

**之后**:
```typescript
import { useApplications } from '@/hooks/use-applications'

const { data, isLoading, error } = useApplications()
const apps = data?.applications || []
```

### 好处

- ✅ 自动缓存（5分钟）
- ✅ 自动重试（失败后）
- ✅ 后台更新
- ✅ DevTools 支持

---

## ⚡ 第四步：优化组件性能

### 使用 memo

```typescript
import { memo } from 'react'

export const MyComponent = memo(function MyComponent({ data }) {
  return <div>{data.name}</div>
})
```

### 使用 useMemo

```typescript
import { useMemo } from 'react'

function Component({ items }) {
  const filteredItems = useMemo(
    () => items.filter(item => item.active),
    [items]
  )
  
  return <div>{filteredItems.map(...)}</div>
}
```

### 使用 useCallback

```typescript
import { useCallback } from 'react'

function Component() {
  const handleClick = useCallback(() => {
    console.log('clicked')
  }, [])
  
  return <button onClick={handleClick}>Click</button>
}
```

---

## 🏗️ 第五步：使用 DDD 架构（可选）

### 初始化容器

```typescript
// app/layout.tsx 或 app/providers.tsx
import { container } from '@/application/container'
import { applications } from '@/config/apps'

// 在客户端初始化
if (typeof window !== 'undefined') {
  container.initializeWithConfig(applications)
}
```

### 使用用例

```typescript
import { container } from '@/application/container'

async function openApplication(appId: string, userRoles: string[]) {
  const useCase = container.openApplicationUseCase
  
  const result = await useCase.execute({
    appId,
    userRoles
  })
  
  if (result.success) {
    // 处理成功
  } else {
    // 处理错误
    alert(result.error)
  }
}
```

---

## 🔒 第六步：添加错误边界

```typescript
// app/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

---

## ⌨️ 第七步：启用键盘快捷键

```typescript
// 在 Desktop 组件中
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

export function Desktop() {
  useKeyboardShortcuts() // 自动启用全局快捷键
  
  return <div>...</div>
}
```

### 可用快捷键

- `F4` 或 `Cmd/Ctrl+L`: 打开/关闭启动台
- `Cmd/Ctrl+W`: 关闭当前窗口
- `Escape`: 关闭启动台

---

## 🛠️ 调试工具

### 1. React Query DevTools

自动显示在开发环境右下角

### 2. Zustand DevTools

安装 Redux DevTools 浏览器扩展即可查看

### 3. 性能监控

```typescript
import { performanceMonitor } from '@/lib/monitoring/performance'

// 查看性能报告
console.log(performanceMonitor.exportReport())

// 查看组件渲染统计
console.log(performanceMonitor.getStats('component_render'))

// 查看 API 调用统计
console.log(performanceMonitor.getStats('api_call'))
```

---

## 📊 验证优化效果

### 1. 检查依赖安装

```bash
docker-compose exec desktop-portal pnpm list | grep -E "(zustand|@tanstack|immer|dompurify)"
```

应该看到：
- zustand@4.4.7
- @tanstack/react-query@5.90.3
- immer@10.1.3
- isomorphic-dompurify@2.29.0

### 2. 检查热重载

修改任意文件，浏览器应该自动刷新

### 3. 检查 DevTools

- 打开 React Query DevTools（右下角）
- 打开 Redux DevTools（查看 Zustand 状态）
- 打开浏览器控制台（查看性能日志）

### 4. 测试功能

- [ ] 打开应用
- [ ] 关闭应用
- [ ] 最小化窗口
- [ ] 使用键盘快捷键
- [ ] 检查数据缓存

---

## 🐛 常见问题

### 问题 1：依赖安装失败

```bash
# 删除 node_modules 卷并重建
docker-compose down -v
docker volume rm dreambuilder_desktop-portal-node-modules
docker-compose up -d --build desktop-portal
```

### 问题 2：热重载不工作

```bash
# 重启容器
docker-compose restart desktop-portal
```

### 问题 3：TypeScript 错误

```bash
# 运行类型检查查看详细错误
docker-compose exec desktop-portal pnpm type-check
```

### 问题 4：容器未初始化错误

```typescript
// 确保在客户端初始化容器
if (typeof window !== 'undefined') {
  container.initializeWithConfig(applications)
}
```

---

## 📚 详细文档

需要更多信息？查看以下文档：

- **[实施指南](./docs/OPTIMIZATION_IMPLEMENTATION.md)** - 详细使用说明
- **[DDD 架构指南](./docs/DDD_ARCHITECTURE_GUIDE.md)** - DDD 架构详解
- **[Docker 指南](./docs/DOCKER_OPTIMIZATION_GUIDE.md)** - Docker 使用技巧
- **[完成报告](./docs/OPTIMIZATION_COMPLETE_REPORT.md)** - 优化内容总结

---

## ✅ 检查清单

完成以下步骤即可开始使用优化后的代码：

- [ ] 重启 Docker 容器安装依赖
- [ ] 验证依赖已安装
- [ ] 初始化 DI 容器（如果使用 DDD）
- [ ] 替换 useDesktop 为 useDesktopStore
- [ ] 使用 useApplications Hook
- [ ] 添加 ErrorBoundary
- [ ] 启用键盘快捷键
- [ ] 测试功能正常
- [ ] 检查 DevTools 工作
- [ ] 查看性能监控数据

---

## 🎉 完成！

恭喜！您已经成功应用了所有代码优化。

**下一步**:
- 应用优化模式到更多组件
- 添加单元测试
- 监控性能指标
- 完善业务逻辑

**需要帮助**？查看详细文档或检查控制台错误信息。

---

**版本**: v1.0  
**最后更新**: 2025-10-16

