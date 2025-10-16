# 任务管理系统集成文档

## 概述

任务管理系统已成功集成到 Desktop Portal 中，通过 iframe 方式内嵌，并共享同一个 Keycloak 认证系统。

## 集成架构

```
┌─────────────────────────────────────────────────────────┐
│           Desktop Portal (http://localhost:3000)        │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Keycloak 认证 (共享 Session)              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  任务管理页面 (/tasks)                            │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  iframe: 任务管理应用                        │  │  │
│  │  │  (http://localhost:3001)                    │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │  - 使用 Keycloak Token                │  │  │  │
│  │  │  │  - 独立运行的 Next.js 应用            │  │  │  │
│  │  │  │  - 调用后端 API (localhost:8000)      │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 认证流程

### 统一认证
Desktop Portal 和任务管理系统都使用同一个 Keycloak 实例：

1. **用户登录 Desktop Portal**
   - 用户通过 Desktop Portal 登录 Keycloak
   - 获取 access token 和 session

2. **访问任务管理**
   - 点击"任务管理"应用
   - Desktop Portal 加载 `/tasks` 页面
   - 页面通过 iframe 加载 `http://localhost:3001`

3. **任务管理系统认证**
   - 任务管理系统检测 Keycloak session
   - 如果已登录，直接使用现有 session
   - 如果未登录，重定向到 Keycloak 登录（但由于已在 Portal 登录，通常会自动通过）

4. **单点登录 (SSO)**
   - 两个应用共享 Keycloak session
   - 在一个应用登录后，另一个应用自动认证

## 配置说明

### 1. Desktop Portal 配置

**应用配置** (`config/apps.ts`):
```typescript
{
  id: 'task-manager',
  name: '任务管理',
  description: '管理您的任务、项目和工作流程',
  icon: '📋',
  url: '/tasks',  // 内部路由
  category: 'productivity',
  roles: ['user', 'admin'],
  status: 'active',
  color: '#667eea',
  order: 1,
  windowMode: 'window',
}
```

**环境变量** (`docker-compose.yml`):
```yaml
NEXT_PUBLIC_TASK_MANAGEMENT_URL: http://localhost:3001
KEYCLOAK_URL: http://keycloak:8080
KEYCLOAK_REALM: Dreambuilder
```

### 2. 任务管理系统配置

**环境变量** (`docker-compose.yml`):
```yaml
NEXT_PUBLIC_KEYCLOAK_URL: http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM: Dreambuilder
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: task-management
```

### 3. Keycloak 配置

需要配置两个客户端：

**desktop-portal 客户端**:
- Client ID: `desktop-portal`
- Valid Redirect URIs: `http://localhost:3000/*`
- Web Origins: `+`

**task-management 客户端**:
- Client ID: `task-management`
- Valid Redirect URIs: `http://localhost:3001/*`
- Web Origins: `+`

## 页面组件

### 任务管理页面 (`app/(portal)/tasks/page.tsx`)

主要功能：
- ✅ 检查用户登录状态
- ✅ 通过 iframe 加载任务管理应用
- ✅ 提供刷新和新窗口打开功能
- ✅ 处理加载状态和错误

关键特性：
- 使用 `useSession()` 检测登录状态
- iframe sandbox 安全配置
- 响应式布局
- 加载状态提示

## 使用流程

### 用户访问流程

1. **登录 Desktop Portal**
   ```
   访问: http://localhost:3000
   登录: 使用 Keycloak 账号
   ```

2. **访问任务管理**
   ```
   方式1: 点击桌面上的"任务管理"图标
   方式2: 在 Launchpad 中选择"任务管理"
   方式3: 直接访问 http://localhost:3000/tasks
   ```

3. **使用任务管理系统**
   ```
   - 查看任务列表
   - 创建新任务
   - 编辑和删除任务
   - 所有操作都带 Keycloak token
   ```

## 技术特点

### 1. iframe 沙箱模式

```typescript
<iframe
  src={taskManagementUrl}
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
  loading="lazy"
/>
```

安全配置：
- `allow-same-origin`: 允许同源策略（Keycloak session 共享需要）
- `allow-scripts`: 允许执行 JavaScript
- `allow-forms`: 允许表单提交
- `allow-popups`: 允许弹窗（Keycloak 登录可能需要）
- `allow-modals`: 允许模态框

### 2. 懒加载

- iframe 使用 `loading="lazy"` 延迟加载
- 只有在用户访问时才加载任务管理应用
- 提升 Desktop Portal 整体性能

### 3. 刷新机制

```typescript
const [iframeKey, setIframeKey] = useState(0)

// 刷新 iframe
<button onClick={() => setIframeKey(prev => prev + 1)}>
  🔄 刷新
</button>

<iframe key={iframeKey} ... />
```

通过更改 key 值强制重新加载 iframe。

## 故障排除

### 问题 1: iframe 无法加载

**症状**: 任务管理页面显示空白或错误

**解决方案**:
1. 检查任务管理服务是否运行
   ```bash
   docker ps | grep task-frontend
   ```
2. 访问 http://localhost:3001 验证服务可用
3. 检查浏览器控制台错误

### 问题 2: 认证失败

**症状**: 提示需要登录或无法访问

**解决方案**:
1. 确认 Keycloak 配置正确
2. 检查两个客户端都已配置
3. 验证 Web Origins 包含正确的域名
4. 清除浏览器缓存和 cookies

### 问题 3: CORS 错误

**症状**: 控制台显示跨域错误

**解决方案**:
1. 检查 Keycloak 的 Web Origins 设置
2. 确认后端 API 的 CORS 配置
3. 验证 iframe sandbox 属性

### 问题 4: Token 不共享

**症状**: 在任务管理中需要重新登录

**解决方案**:
1. 检查两个应用的 Realm 是否相同
2. 确认 iframe sandbox 包含 `allow-same-origin`
3. 验证两个应用在同一域名或配置了正确的 CORS

## 性能优化

### 1. 预加载

可以在 Desktop Portal 中预加载任务管理应用：

```typescript
<link rel="prefetch" href="http://localhost:3001" />
```

### 2. 缓存策略

任务管理应用使用：
- Service Worker 缓存静态资源
- HTTP 缓存头优化
- 懒加载图片和组件

### 3. 网络优化

- 压缩响应内容
- 使用 CDN 加速
- 启用 HTTP/2

## 扩展功能

### 1. 消息通信

实现 Desktop Portal 和任务管理系统之间的通信：

```typescript
// Desktop Portal
window.addEventListener('message', (event) => {
  if (event.origin === 'http://localhost:3001') {
    console.log('收到任务管理消息:', event.data)
  }
})

// 任务管理系统
window.parent.postMessage({ type: 'task-created', data: task }, '*')
```

### 2. 状态同步

- 任务数量徽章显示
- 未读通知提示
- 实时状态更新

### 3. 快捷操作

在 Desktop Portal 中添加任务管理快捷操作：
- 快速创建任务
- 查看今日任务
- 任务提醒

## 测试清单

### 集成测试

- [ ] Desktop Portal 启动正常
- [ ] 任务管理应用启动正常
- [ ] Keycloak 配置正确
- [ ] 用户可以登录 Desktop Portal
- [ ] 点击任务管理图标打开页面
- [ ] iframe 正确加载任务管理应用
- [ ] SSO 正常工作（无需重新登录）
- [ ] API 调用成功（携带正确的 token）
- [ ] 刷新功能正常
- [ ] 新窗口打开功能正常
- [ ] 登出功能正常
- [ ] 错误处理正常

### 浏览器兼容性

- [ ] Chrome/Edge (推荐)
- [ ] Firefox
- [ ] Safari

## 安全考虑

1. **iframe 沙箱**: 限制 iframe 权限
2. **CSP 策略**: 配置内容安全策略
3. **Token 安全**: 不通过 URL 传递 token
4. **同源策略**: 合理配置 CORS
5. **HTTPS**: 生产环境强制使用 HTTPS

## 文档参考

- [Desktop Portal 文档](../README.md)
- [任务管理集成指南](../../task-management/KEYCLOAK_INTEGRATION.md)
- [Keycloak 文档](https://www.keycloak.org/documentation)
- [iframe 安全](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)

---

**最后更新**: 2024年
**版本**: 1.0
**状态**: ✅ 已完成

