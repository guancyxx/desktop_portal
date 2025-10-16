# Desktop Portal 任务管理集成测试指南

## 前置条件

### 1. 确保所有服务运行

```bash
# 启动所有容器
docker-compose up -d

# 检查服务状态
docker-compose ps

# 应该看到以下服务运行中:
# - dreambuilder-postgres
# - dreambuilder-postgres-tasks
# - dreambuilder-keycloak
# - dreambuilder-redis
# - dreambuilder-desktop-portal
# - dreambuilder-task-backend
# - dreambuilder-task-frontend
```

### 2. 配置 Keycloak

按照 `applications/task-management/QUICK_START_KEYCLOAK.md` 完成配置：

1. 访问 http://localhost:8080
2. 创建 Realm: `Dreambuilder`
3. 创建客户端:
   - `desktop-portal`
   - `task-management`
4. 创建测试用户

### 3. 运行数据库迁移

```bash
# 任务管理后端迁移
docker exec -it dreambuilder-task-backend alembic upgrade head
```

## 自动化测试脚本

### 测试场景 1: 登录流程

```javascript
// 1. 访问 Desktop Portal
await page.goto('http://localhost:3000');

// 2. 检查是否重定向到登录页
const currentUrl = await page.url();
console.log('当前 URL:', currentUrl);

// 3. 等待 Keycloak 登录页面加载
await page.waitForSelector('#kc-form-login', { timeout: 5000 });

// 4. 输入用户名和密码
await page.type('#username', 'testuser');
await page.type('#password', 'testpassword');

// 5. 点击登录
await page.click('#kc-login');

// 6. 等待重定向到 Desktop Portal
await page.waitForNavigation({ timeout: 10000 });

// 7. 验证登录成功
const desktopVisible = await page.waitForSelector('[data-testid="desktop-container"]', { timeout: 5000 });
console.log('✅ 登录成功！');
```

### 测试场景 2: 打开任务管理应用

```javascript
// 1. 等待桌面加载
await page.waitForSelector('[data-testid="desktop-container"]', { timeout: 5000 });

// 2. 查找任务管理应用图标
const taskManagerApp = await page.waitForSelector('[data-app-id="task-manager"]', { timeout: 5000 });

// 3. 点击应用图标
await taskManagerApp.click();

// 4. 等待任务管理页面加载
await page.waitForSelector('iframe[title="任务管理系统"]', { timeout: 10000 });

// 5. 验证 iframe 加载成功
const iframeLoaded = await page.evaluate(() => {
  const iframe = document.querySelector('iframe[title="任务管理系统"]');
  return iframe && iframe.src.includes('localhost:3001');
});

console.log('✅ 任务管理应用加载成功！', iframeLoaded);
```

### 测试场景 3: 验证 SSO（单点登录）

```javascript
// 1. 检查 Desktop Portal session
const portalSession = await page.evaluate(() => {
  return localStorage.getItem('keycloak-session');
});

// 2. 切换到任务管理 iframe
const iframe = await page.frames().find(f => 
  f.url().includes('localhost:3001')
);

// 3. 检查任务管理系统是否自动认证
const taskSession = await iframe.evaluate(() => {
  return localStorage.getItem('keycloak-session');
});

// 4. 验证 SSO
const ssoWorks = portalSession && taskSession;
console.log('✅ SSO 验证:', ssoWorks ? '成功' : '失败');
```

### 测试场景 4: API 调用验证

```javascript
// 1. 在 iframe 中检查 API 调用
const apiResponse = await iframe.evaluate(async () => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${window.keycloakInstance.token}`
      }
    });
    return {
      status: response.status,
      ok: response.ok,
      data: await response.json()
    };
  } catch (error) {
    return { error: error.message };
  }
});

console.log('✅ API 调用结果:', apiResponse);
```

## 手动测试步骤

### 步骤 1: 访问 Desktop Portal

1. 打开浏览器：http://localhost:3000
2. **预期结果**: 
   - 重定向到 Keycloak 登录页
   - 显示 "Dreambuilder" Realm 登录界面

### 步骤 2: 登录

1. 输入用户名：`testuser`
2. 输入密码：`testpassword`
3. 点击 "Sign In"
4. **预期结果**:
   - 成功登录
   - 重定向回 Desktop Portal
   - 显示桌面界面

### 步骤 3: 验证桌面显示

**检查项**:
- [ ] 显示壁纸背景
- [ ] 显示菜单栏（左上角）
- [ ] 显示 Dock（底部）
- [ ] 显示应用图标
- [ ] "任务管理" 图标可见（📋）

### 步骤 4: 打开任务管理应用

1. 点击"任务管理"图标（📋）
2. **预期结果**:
   - 打开新窗口/标签页显示任务管理
   - 页面标题显示"任务管理"
   - iframe 加载任务管理系统

### 步骤 5: 验证 iframe 加载

**检查项**:
- [ ] iframe 显示任务管理界面
- [ ] 不需要重新登录（SSO 生效）
- [ ] 可以看到任务列表或创建任务界面
- [ ] 页面顶部显示用户信息

### 步骤 6: 测试功能

**在任务管理系统中**:
1. 点击"创建任务"按钮
2. 填写任务信息：
   - 标题：测试任务
   - 描述：这是集成测试任务
   - 优先级：高
3. 点击"保存"
4. **预期结果**:
   - 任务创建成功
   - 显示在任务列表中
   - 没有认证错误

### 步骤 7: 测试刷新功能

1. 点击任务管理页面顶部的"🔄 刷新"按钮
2. **预期结果**:
   - iframe 重新加载
   - 数据正常显示
   - 不需要重新登录

### 步骤 8: 测试新窗口打开

1. 点击"🔗 新窗口打开"按钮
2. **预期结果**:
   - 在新标签页打开 http://localhost:3001
   - 直接显示任务管理界面（不需要登录）
   - 数据与 iframe 中一致

### 步骤 9: 验证登出

1. 在 Desktop Portal 中点击登出
2. **预期结果**:
   - 退出登录
   - 重定向到登录页
   - 任务管理系统也同时登出

## 开发者工具验证

### 使用浏览器开发者工具（F12）

#### 1. Network 标签

**检查点**:
```
请求到 Desktop Portal (localhost:3000)
├─ HTML 文档加载
├─ JavaScript 资源
├─ CSS 样式
└─ API 调用到 Keycloak

请求到任务管理 (localhost:3001)
├─ 通过 iframe 加载
├─ 携带 Keycloak session
└─ API 调用到后端 (localhost:8000)
    └─ 请求头包含: Authorization: Bearer <token>
```

#### 2. Console 标签

**无错误**:
- ✅ 没有 CORS 错误
- ✅ 没有 401/403 认证错误
- ✅ 没有 JavaScript 运行时错误

**预期日志**:
```
Keycloak 初始化成功
认证成功
Token 已刷新
API 调用成功
```

#### 3. Application 标签

**LocalStorage 检查**:
```
Desktop Portal (localhost:3000)
├─ keycloak-session: <session-id>
├─ keycloak-token: <access-token>
└─ keycloak-refresh-token: <refresh-token>

任务管理 (localhost:3001)
├─ keycloak-session: <同样的 session-id>
├─ keycloak-token: <access-token>
└─ keycloak-refresh-token: <refresh-token>
```

#### 4. Elements 标签

**iframe 结构验证**:
```html
<div class="flex h-full w-full flex-col">
  <div class="flex items-center justify-between">
    <h1>任务管理</h1>
    <button>刷新</button>
    <a>新窗口打开</a>
  </div>
  <iframe
    src="http://localhost:3001"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
    title="任务管理系统"
  />
</div>
```

## Chrome DevTools MCP 验证脚本

如果你使用 Chrome DevTools MCP，可以运行以下验证：

```bash
# 1. 打开页面并截图
mcp chrome-devtools new-page --url http://localhost:3000

# 2. 等待登录页面
mcp chrome-devtools take-snapshot

# 3. 填写登录表单
mcp chrome-devtools fill --uid <username-input-uid> --value testuser
mcp chrome-devtools fill --uid <password-input-uid> --value testpassword
mcp chrome-devtools click --uid <login-button-uid>

# 4. 等待桌面加载
mcp chrome-devtools wait-for --text "任务管理"

# 5. 截图验证
mcp chrome-devtools take-screenshot --file-path ./desktop-loaded.png

# 6. 点击任务管理图标
mcp chrome-devtools click --uid <task-manager-icon-uid>

# 7. 验证 iframe
mcp chrome-devtools take-snapshot

# 8. 最终截图
mcp chrome-devtools take-screenshot --file-path ./task-manager-opened.png
```

## 性能测试

### 加载时间测试

```javascript
const performance = await page.evaluate(() => {
  const navigation = performance.getEntriesByType('navigation')[0];
  return {
    'DNS 查询': navigation.domainLookupEnd - navigation.domainLookupStart,
    'TCP 连接': navigation.connectEnd - navigation.connectStart,
    '请求响应': navigation.responseEnd - navigation.requestStart,
    'DOM 解析': navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    '页面加载': navigation.loadEventEnd - navigation.loadEventStart,
    '总时间': navigation.loadEventEnd - navigation.fetchStart
  };
});

console.log('性能指标:', performance);
```

**期望值**:
- DNS 查询: < 50ms
- TCP 连接: < 100ms
- 请求响应: < 500ms
- DOM 解析: < 1000ms
- 页面加载: < 2000ms
- 总时间: < 3000ms

## 常见问题诊断

### 问题诊断清单

| 问题 | 检查项 | 解决方案 |
|------|--------|----------|
| 页面无法访问 | `docker ps` 检查服务 | `docker-compose up -d` |
| 登录失败 | Keycloak 配置 | 检查客户端配置 |
| iframe 空白 | 任务管理服务 | 检查 localhost:3001 |
| 401 错误 | Token 验证 | 检查后端日志 |
| CORS 错误 | 跨域配置 | 检查 Web Origins |

## 测试报告模板

```markdown
# 集成测试报告

**测试日期**: YYYY-MM-DD
**测试人员**: [姓名]
**环境**: Docker Compose / 本地开发

## 测试结果

### 1. 服务启动 ✅/❌
- [ ] Keycloak
- [ ] Desktop Portal
- [ ] 任务管理前端
- [ ] 任务管理后端
- [ ] PostgreSQL (x2)
- [ ] Redis

### 2. 认证流程 ✅/❌
- [ ] 登录成功
- [ ] SSO 正常
- [ ] Token 验证
- [ ] 登出正常

### 3. 应用集成 ✅/❌
- [ ] 应用图标显示
- [ ] 点击打开应用
- [ ] iframe 加载
- [ ] 功能正常

### 4. API 调用 ✅/❌
- [ ] 携带 Token
- [ ] 响应正常
- [ ] 数据正确
- [ ] 错误处理

## 问题记录

1. [问题描述]
   - 现象: ...
   - 原因: ...
   - 解决: ...

## 总结

- 测试通过率: X/Y
- 关键问题: 
- 建议: 
```

## 下一步

测试通过后：

1. ✅ 记录测试结果
2. ✅ 更新文档
3. ✅ 提交代码
4. ✅ 部署到测试环境
5. ✅ 进行用户验收测试

---

**文档版本**: 1.0  
**最后更新**: 2024年  
**状态**: ✅ 可用

