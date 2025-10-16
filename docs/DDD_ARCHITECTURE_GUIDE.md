# DDD 架构实施指南

本文档说明领域驱动设计（DDD）架构的实施和使用方法。

---

## 📐 架构概览

### 分层架构

```
applications/desktop-portal/
├── domain/                      # 领域层（核心业务逻辑）
│   ├── models/                  # 领域模型
│   │   ├── Application.ts       # 应用程序实体
│   │   └── Window.ts            # 窗口实体
│   └── services/                # 领域服务
│       ├── ApplicationService.ts # 应用业务逻辑
│       └── WindowManager.ts     # 窗口管理逻辑
├── application/                 # 应用层（用例编排）
│   ├── use-cases/              # 用例
│   │   ├── OpenApplication.ts  # 打开应用
│   │   └── GetApplications.ts  # 获取应用列表
│   └── container.ts            # 依赖注入容器
├── infrastructure/             # 基础设施层（数据访问）
│   └── repositories/
│       └── ApplicationRepository.ts # 应用仓储
├── components/                 # 表现层（UI组件）
└── hooks/                     # React Hooks（适配器）
```

---

## 🎯 核心概念

### 1. 领域模型（Domain Models）

领域模型是业务逻辑的核心，包含实体和值对象。

**ApplicationModel** - 应用程序实体
```typescript
import { ApplicationModel } from '@/domain/models/Application'

// 创建实例
const app = ApplicationModel.fromDTO(applicationDTO)

// 业务逻辑方法
const canAccess = app.canAccessBy(['user', 'admin'])
const isActive = app.isActive()
const fullURL = app.getFullURL('https://example.com')
```

**WindowModel** - 窗口实体
```typescript
import { WindowModel } from '@/domain/models/Window'

// 创建窗口
const window = WindowModel.create(app, position, size, zIndex)

// 窗口操作
const minimized = window.minimize()
const maximized = window.maximize()
const restored = window.restore()
const focused = window.focus(newZIndex)
```

### 2. 领域服务（Domain Services）

领域服务包含跨实体的业务逻辑。

**ApplicationService** - 应用业务逻辑
```typescript
import { ApplicationService } from '@/domain/services/ApplicationService'
import { ApplicationRepository } from '@/infrastructure/repositories/ApplicationRepository'

// 创建服务
const repository = new ApplicationRepository(applications)
const service = new ApplicationService(repository)

// 使用服务
const accessibleApps = await service.getAccessibleApplications(['user'])
const validation = await service.validateApplicationAccess('app-id', ['user'])
const searchResults = await service.searchApplications('keyword', ['user'])
```

**WindowManager** - 窗口管理服务
```typescript
import { WindowManager } from '@/domain/services/WindowManager'

// 创建管理器
const manager = new WindowManager({
  defaultWidth: 900,
  defaultHeight: 600,
  maxWindows: 10
})

// 使用管理器
const newWindow = manager.createWindow(app, existingWindows, nextZIndex)
const topWindow = manager.getTopWindow(windows)
const arranged = manager.autoArrangeWindows(windows, screenWidth, screenHeight)
```

### 3. 仓储（Repositories）

仓储负责数据的持久化和获取。

**ApplicationRepository** - 基于配置文件
```typescript
import { ApplicationRepository } from '@/infrastructure/repositories/ApplicationRepository'
import { applications } from '@/config/apps'

const repository = new ApplicationRepository(applications)
const allApps = await repository.findAll()
const app = await repository.findById('app-id')
```

**ApplicationAPIRepository** - 基于 API
```typescript
import { ApplicationAPIRepository } from '@/infrastructure/repositories/ApplicationRepository'

const repository = new ApplicationAPIRepository('/api')
const allApps = await repository.findAll()
const categoryApps = await repository.findByCategory('productivity')
```

### 4. 用例（Use Cases）

用例编排领域服务完成具体的业务流程。

**OpenApplicationUseCase** - 打开应用
```typescript
import { OpenApplicationUseCase } from '@/application/use-cases/OpenApplication'

const useCase = new OpenApplicationUseCase(applicationService)

const result = await useCase.execute({
  appId: 'task-manager',
  userRoles: ['user', 'admin']
})

if (result.success) {
  if (result.openInNewTab) {
    window.open(result.url, '_blank')
  } else {
    // 在窗口中打开
  }
}
```

**GetApplicationsUseCase** - 获取应用列表
```typescript
import { GetApplicationsUseCase } from '@/application/use-cases/GetApplications'

const useCase = new GetApplicationsUseCase(applicationService)

const result = await useCase.execute({
  userRoles: ['user'],
  category: 'productivity',
  searchQuery: 'task'
})

console.log(result.applications)
console.log(result.categories)
console.log(result.total)
```

### 5. 依赖注入容器

容器集中管理所有依赖关系。

```typescript
import { container } from '@/application/container'
import { applications } from '@/config/apps'

// 初始化容器（使用配置文件）
container.initializeWithConfig(applications)

// 或使用 API
container.initializeWithAPI('/api')

// 使用服务
const applicationService = container.applicationService
const windowManager = container.windowManager

// 使用用例
const openApp = container.openApplicationUseCase
const getApps = container.getApplicationsUseCase
```

---

## 🚀 实际使用示例

### 示例 1：在组件中使用用例

```typescript
'use client'

import { useEffect, useState } from 'react'
import { container } from '@/application/container'
import { ApplicationModel } from '@/domain/models/Application'
import { useSession } from 'next-auth/react'

export function ApplicationList() {
  const { data: session } = useSession()
  const [apps, setApps] = useState<ApplicationModel[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadApps() {
      if (!session?.user?.roles) return
      
      try {
        const useCase = container.getApplicationsUseCase
        const result = await useCase.execute({
          userRoles: session.user.roles as any[]
        })
        
        setApps(result.applications)
      } catch (error) {
        console.error('Failed to load apps:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadApps()
  }, [session])
  
  if (loading) return <div>加载中...</div>
  
  return (
    <div>
      {apps.map(app => (
        <div key={app.id}>
          <h3>{app.name}</h3>
          <p>{app.description}</p>
        </div>
      ))}
    </div>
  )
}
```

### 示例 2：打开应用

```typescript
'use client'

import { container } from '@/application/container'
import { ApplicationModel } from '@/domain/models/Application'
import { useSession } from 'next-auth/react'

export function AppLauncher({ app }: { app: ApplicationModel }) {
  const { data: session } = useSession()
  
  const handleClick = async () => {
    if (!session?.user?.roles) return
    
    try {
      const useCase = container.openApplicationUseCase
      const result = await useCase.execute({
        appId: app.id,
        userRoles: session.user.roles as any[]
      })
      
      if (result.success) {
        if (result.openInNewTab) {
          window.open(result.url, '_blank', 'noopener,noreferrer')
        } else {
          // 使用 Desktop store 打开窗口
          // useDesktopStore.getState().openApp(app.toDTO())
        }
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Failed to open app:', error)
    }
  }
  
  return (
    <button onClick={handleClick}>
      {app.icon} {app.name}
    </button>
  )
}
```

### 示例 3：窗口管理

```typescript
'use client'

import { useEffect, useState } from 'react'
import { container } from '@/application/container'
import { WindowModel } from '@/domain/models/Window'
import { useDesktopStore } from '@/stores/desktop-store'

export function WindowManagerControls() {
  const { windows } = useDesktopStore()
  const [windowModels, setWindowModels] = useState<WindowModel[]>([])
  
  useEffect(() => {
    // 将 store 的窗口转换为领域模型
    const models = windows.map(w => 
      WindowModel.create(
        ApplicationModel.fromDTO(w.app),
        w.position,
        w.size,
        w.zIndex
      )
    )
    setWindowModels(models)
  }, [windows])
  
  const handleAutoArrange = () => {
    const manager = container.windowManager
    const arranged = manager.autoArrangeWindows(
      windowModels,
      window.innerWidth,
      window.innerHeight
    )
    
    // 更新 store
    // ...
  }
  
  const handleCascade = () => {
    const manager = container.windowManager
    const cascaded = manager.cascadeWindows(windowModels)
    
    // 更新 store
    // ...
  }
  
  return (
    <div>
      <button onClick={handleAutoArrange}>平铺窗口</button>
      <button onClick={handleCascade}>层叠窗口</button>
    </div>
  )
}
```

---

## 🔧 容器初始化

### 在 Next.js 应用中初始化

**选项 1：使用配置文件**

```typescript
// app/layout.tsx
import { container } from '@/application/container'
import { applications } from '@/config/apps'

// 在应用启动时初始化
if (typeof window !== 'undefined') {
  container.initializeWithConfig(applications)
}
```

**选项 2：使用 API**

```typescript
// app/layout.tsx
import { container } from '@/application/container'

if (typeof window !== 'undefined') {
  container.initializeWithAPI('/api')
}
```

---

## 📊 架构优势

### 1. 业务逻辑独立

- ✅ 领域模型包含核心业务逻辑
- ✅ 不依赖框架和基础设施
- ✅ 易于测试和维护

### 2. 清晰的依赖方向

```
表现层 → 应用层 → 领域层 ← 基础设施层
```

- ✅ 依赖倒置原则
- ✅ 高内聚，低耦合

### 3. 可扩展性

- ✅ 易于添加新用例
- ✅ 易于替换基础设施
- ✅ 支持多种数据源

### 4. 可测试性

```typescript
// 单元测试领域模型
test('应用权限检查', () => {
  const app = new ApplicationModel(/*...*/)
  expect(app.canAccessBy(['user'])).toBe(true)
})

// 单元测试领域服务（使用 Mock Repository）
test('获取可访问应用', async () => {
  const mockRepo = new MockRepository()
  const service = new ApplicationService(mockRepo)
  const apps = await service.getAccessibleApplications(['user'])
  expect(apps.length).toBeGreaterThan(0)
})
```

---

## 🎓 最佳实践

### 1. 领域模型

- ✅ 使用不可变对象（readonly）
- ✅ 包含业务规则验证
- ✅ 提供有意义的业务方法

### 2. 领域服务

- ✅ 专注于业务逻辑
- ✅ 不包含技术细节
- ✅ 通过仓储接口访问数据

### 3. 用例

- ✅ 编排领域服务
- ✅ 处理事务边界
- ✅ 返回 DTO 而非领域模型

### 4. 仓储

- ✅ 实现仓储接口
- ✅ 处理数据转换
- ✅ 管理缓存策略

---

## 🔍 故障排查

### 问题 1：容器未初始化

**错误**:
```
Container not initialized. Call initializeWithConfig() first.
```

**解决方案**:
```typescript
import { container } from '@/application/container'
import { applications } from '@/config/apps'

container.initializeWithConfig(applications)
```

### 问题 2：类型错误

**错误**:
```
Type 'Application' is not assignable to type 'ApplicationModel'
```

**解决方案**:
```typescript
// 使用 fromDTO 转换
const model = ApplicationModel.fromDTO(dto)

// 或使用 toDTO 转换
const dto = model.toDTO()
```

---

## 📚 延伸阅读

- [领域驱动设计 - Eric Evans](https://domainlanguage.com/ddd/)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [依赖注入模式](https://martinfowler.com/articles/injection.html)

---

**文档版本**: v1.0  
**最后更新**: 2025-10-16  
**相关文档**: 
- [优化实施指南](./OPTIMIZATION_IMPLEMENTATION.md)
- [优化执行总结](./OPTIMIZATION_SUMMARY.md)
- [Docker 优化指南](./DOCKER_OPTIMIZATION_GUIDE.md)

