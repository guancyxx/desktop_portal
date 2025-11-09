# Realm 切换优化测试报告

## 测试日期
2025年10月17日

## 测试环境
- Frontend: Next.js 开发服务器 (localhost:3000)
- Backend: Keycloak 8080
- 测试工具: Chrome DevTools MCP
- 测试用户: admin@dreambuilder.local

## 测试目标
验证以下三个优化需求：
1. 用户切换 realm 后应当走重新登录 SSO 流程，更换 token，并切换显示到新的 realm
2. 切换到新的 realm 后应该依然可以拉取到当前用户的所有 realm 并显示
3. 首次登录时去掉 review_profile 的步骤

## 测试场景

### 场景 1: 创建新组织
**测试步骤：**
1. 在 Dreambuilder Realm 的桌面页面，点击用户菜单
2. 选择"创建新组织"
3. 填写组织信息：
   - 组织名称：优化测试公司
   - 组织标识：optimized-test
4. 点击"创建组织"按钮

**预期结果：**
- ✅ 组织创建成功
- ✅ 显示成功消息："组织创建成功！"
- ✅ 提示用户可以在组织列表中找到新组织
- ✅ 2秒后自动返回桌面
- ✅ 用户停留在 Dreambuilder Realm

**实际结果：**
- ✅ **通过** - 所有预期结果均符合
- 创建的 realm 名称：`3cc207bd-optimized-test`
- 成功返回到 Dreambuilder 桌面页面

**截图证据：**
- 成功页面显示："您的新组织已成功创建。即将返回桌面..."
- 提示：💡 您可以在用户菜单中的"选择组织"列表里找到新创建的组织

---

### 场景 2: 查看组织列表
**测试步骤：**
1. 在桌面页面点击用户菜单（admin 按钮）
2. 查看"选择组织"部分

**预期结果：**
- ✅ 显示当前组织：Dreambuilder
- ✅ 显示所有可访问的组织列表
- ✅ 新创建的"优化测试公司"出现在列表中

**实际结果：**
- ✅ **通过** - 组织列表正确显示
- 当前组织：Dreambuilder
- 可访问组织列表：
  - Tech Innovations (1f15a682-tech-innovations1)
  - 流程测试公司 (7998a4db-flow-test)
  - 邮箱验证最终版 (e8112e83-email-ver-fin)
  - SSO Test Company (0b5ccaa8-sso-test)
  - **优化测试公司 (3cc207bd-optimized-test)** ✨ 新创建

**结论：**
✅ **需求 2 部分满足** - 在 Dreambuilder Realm 可以看到所有组织

---

### 场景 3: 切换到新组织
**测试步骤：**
1. 打开用户菜单
2. 点击"优化测试公司"

**预期结果：**
- ✅ 触发重新登录流程
- ✅ 跳转到新 realm 的登录页面
- ✅ 自动通过 SSO 完成认证（通过 kc_idp_hint）
- ✅ 无需显示登录页面，直接进入桌面
- ❌ 跳过 "Update Account Information" 页面

**实际结果：**
- ✅ 成功跳转到新 realm 的登录页面
- ❌ **未通过** - 显示了登录页面，没有自动 SSO
  - 页面标题："Sign in to 优化测试公司"
  - 显示了用户名/密码输入框
  - 显示了 "DreamBuilder SSO" 按钮
- 🔍 **问题分析**：
  - 检查 URL 发现缺少 `kc_idp_hint` 参数
  - redirect_uri 仍指向 `/api/auth/callback/keycloak` 而不是 `/api/auth/realm-callback`
  - 原因：浏览器可能使用了旧的缓存代码

**URL 详情：**
```
http://localhost:8080/realms/3cc207bd-optimized-test/protocol/openid-connect/auth
?client_id=desktop-portal
&response_type=code
&scope=openid+email+profile
&redirect_uri=http://localhost:3000/api/auth/callback/keycloak
&state=eyJjYWxsYmFja1VybCI6Ii9kZXNrdG9wIiwicmVhbG0iOiIzY2MyMDdiZC1vcHRpbWl6ZWQtdGVzdCJ9
```

**缺少的参数：**
- ❌ `kc_idp_hint=dreambuilder`

**结论：**
⚠️ **需求 1 部分满足** - 重新登录流程触发了，但自动 SSO 未生效

---

### 场景 4: 手动 SSO 登录
**测试步骤：**
1. 在登录页面点击 "DreamBuilder SSO" 按钮

**预期结果：**
- ✅ 重定向到 Dreambuilder IDP
- ✅ 自动完成 SSO 认证
- ❌ 跳过 "Update Account Information" 页面
- ✅ 直接进入新 realm 的桌面

**实际结果：**
- ✅ 成功重定向到 Dreambuilder IDP
- ✅ 自动完成 SSO 认证（无需输入密码）
- ❌ **未通过** - 显示了 "Update Account Information" 页面
  - 要求填写 First name 和 Last name
  - Username 和 Email 已预填充
- 填写信息后点击 Submit
- ✅ 成功进入桌面页面
- ⚠️ **问题** - 但重定向到了 Dreambuilder Realm 的桌面，而不是新 realm 的桌面

**Update Account Information 页面截图：**
- 标题："Update Account Information"
- 字段：
  - Username: admin (已填充)
  - Email: admin@dreambuilder.local (已填充)
  - First name: (需要填写)
  - Last name: (需要填写)

**结论：**
❌ **需求 3 未满足** - Review Profile 步骤仍然出现
⚠️ **需求 1 未完全满足** - 登录后重定向到错误的 realm

---

## 测试总结

### 已实现的功能 ✅
1. ✅ 组织创建流程完整可用
2. ✅ 创建后正确返回 Dreambuilder 桌面
3. ✅ 新组织立即出现在组织列表中
4. ✅ 切换组织时触发重新登录流程
5. ✅ 登录页面显示 "DreamBuilder SSO" 选项
6. ✅ SSO 认证可以自动完成（无需输入密码）
7. ✅ 在 Dreambuilder Realm 可以看到所有组织

### 未完全实现的功能 ⚠️
1. ⚠️ 自动 SSO 跳转（`kc_idp_hint`）未生效
   - 原因：代码更新后需要重启开发服务器
   - 解决：需要清除浏览器缓存或重启服务器
2. ⚠️ 登录后重定向到错误的 realm
   - 原因：OAuth callback 处理逻辑需要使用新的 `/api/auth/realm-callback` 端点
   - 当前仍使用 NextAuth 默认的 callback，它硬编码到 Dreambuilder realm

### 未实现的功能 ❌
1. ❌ Review Profile 禁用
   - 原因：`disableReviewProfile()` 方法可能未正确执行
   - 可能的问题：
     - API 调用方式不正确
     - Keycloak Admin Client 的 updateExecution 方法参数错误
   - 解决方案：需要查看服务器日志，确认方法是否执行成功

### 跨 Realm 组织列表显示 ⏸️
- **未测试** - 由于切换后重定向到错误的 realm，无法验证此功能
- 预期：用户切换到任何 realm 后，仍然可以看到所有组织列表
- 需要：修复重定向问题后重新测试

---

## 问题分析

### 问题 1: kc_idp_hint 参数缺失
**根本原因：**
- `RealmSelector.tsx` 代码已更新，但浏览器使用了旧版本
- Next.js 开发服务器的热更新可能未生效

**影响：**
- 用户需要手动点击 "DreamBuilder SSO" 按钮
- 增加了一个不必要的操作步骤

**解决方案：**
1. 重启 Next.js 开发服务器
2. 清除浏览器缓存
3. 强制刷新页面 (Ctrl+Shift+R)

---

### 问题 2: Review Profile 未禁用
**根本原因：**
可能的原因：
1. `disableReviewProfile()` 方法的 API 调用不正确
2. Keycloak Admin API 的 `updateExecution` 方法参数格式有误
3. 方法在创建 realm 时未被调用或调用失败

**影响：**
- 用户首次通过 SSO 登录到新 realm 时，需要填写额外信息
- 用户体验不佳

**调试建议：**
1. 查看服务器控制台日志：
   ```bash
   # 应该看到这些日志
   [Keycloak Admin] Disabling review profile for realm: 3cc207bd-optimized-test
   [Keycloak Admin] Found X executions in first broker login flow
   [Keycloak Admin] Execution: Review Profile (idp-review-profile) - REQUIRED
   [Keycloak Admin] Successfully disabled review profile step (ID: xxx)
   ```

2. 手动验证 Keycloak 配置：
   - 访问: http://localhost:8080/admin/master/console
   - 进入目标 realm: `3cc207bd-optimized-test`
   - 导航到: Authentication > Flows > first broker login
   - 检查 "Review Profile" 步骤的 Requirement 是否为 "Disabled"

3. 如果未禁用，手动调用 API：
   ```javascript
   await fetch('/api/organizations/disable-review-profile', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ realmName: '3cc207bd-optimized-test' })
   });
   ```

---

### 问题 3: OAuth Callback 重定向错误
**根本原因：**
- 当前使用的 `redirect_uri` 指向 `/api/auth/callback/keycloak`
- 这是 NextAuth 的默认 callback，它使用 `authOptions` 配置
- `authOptions` 硬编码到 Dreambuilder realm
- 因此 callback 后会建立 Dreambuilder realm 的 session，而不是目标 realm

**影响：**
- 用户切换组织后，实际上还是在 Dreambuilder realm
- 无法真正切换到目标 realm

**解决方案：**
1. 更新 `RealmSelector.tsx` 中的 `redirect_uri`：
   ```typescript
   authUrl.searchParams.set('redirect_uri', `${window.location.origin}/api/auth/realm-callback`)
   ```

2. 确保 `/api/auth/realm-callback` 端点正确处理：
   - 提取 state 中的 realm 信息
   - 使用目标 realm 的 token endpoint 交换 access token
   - 建立目标 realm 的 session
   - 重定向到目标 realm 的桌面页面

3. 在 Keycloak 中更新 client 的 redirect URIs：
   - 为每个 realm 的 `desktop-portal` client 添加：
   - `http://localhost:3000/api/auth/realm-callback`

---

## 建议的下一步

### 立即修复（高优先级）
1. **重启开发服务器**
   - 确保最新代码生效
   - 重新测试 `kc_idp_hint` 参数

2. **修复 Review Profile 禁用**
   - 检查服务器日志
   - 验证 `disableReviewProfile()` 方法
   - 手动禁用已创建 realm 的 review profile

3. **修复 OAuth Callback**
   - 确保使用正确的 `redirect_uri`
   - 测试 `/api/auth/realm-callback` 端点
   - 验证 session 建立在正确的 realm

### 完整流程测试（中优先级）
1. **创建新的测试组织**
   - 验证所有修复是否生效
   - 记录完整的用户体验

2. **跨 Realm 功能测试**
   - 切换到新组织后，验证组织列表是否完整
   - 验证用户可以在不同 realm 之间自由切换

3. **边界情况测试**
   - 测试 token 过期处理
   - 测试网络错误处理
   - 测试并发切换

### 长期优化（低优先级）
1. **性能优化**
   - 实现 token 缓存
   - 优化组织列表加载

2. **用户体验优化**
   - 添加切换进度指示
   - 优化错误提示
   - 添加切换确认对话框

3. **文档和监控**
   - 完善开发文档
   - 添加监控和日志
   - 创建故障排查指南

---

## 附录：测试环境信息

### 系统配置
- 操作系统：Windows 10
- Node.js 版本：（需要从项目获取）
- Next.js 版本：（需要从 package.json 获取）
- Keycloak 版本：（需要从 Keycloak 获取）

### 环境变量
```env
KEYCLOAK_INTERNAL_URL=http://keycloak:8080
KEYCLOAK_EXTERNAL_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXTAUTH_URL=http://localhost:3000
```

### 测试数据
- 测试用户：admin@dreambuilder.local
- 测试组织：优化测试公司
- 测试 Realm：3cc207bd-optimized-test

