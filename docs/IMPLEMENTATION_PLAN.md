# Realm切换功能完整实施方案

## 目标

1. ✅ 用户可以使用自己的token查询realm列表（不返回403）
2. ✅ 用户可以无缝切换到不同realm
3. ✅ 切换后session正确更新到目标realm

## 方案A：添加Keycloak权限（简单）

### 步骤1：创建Realm查询角色

在Dreambuilder realm创建一个角色，允许用户查看realm列表：

**手动配置**：
1. 登录Keycloak Admin Console
2. 进入 Dreambuilder realm
3. 创建 Client Role: `realm-viewer`
4. 分配权限给默认用户组

**自动配置**（推荐）：
创建配置脚本，在创建用户时自动分配权限。

### 问题
- ❌ 仍然需要Admin API权限（复杂）
- ❌ 安全风险（普通用户不应有Admin API访问权限）
- ⚠️ **不推荐此方案**

## 方案B：重构认证系统支持动态Realm（推荐）⭐

### 核心思路

不依赖NextAuth的静态配置，自己实现动态realm切换：

1. **保持NextAuth用于主登录**（Dreambuilder realm）
2. **实现自定义realm切换逻辑**
3. **手动管理跨realm的session**

### 架构设计

```
用户登录
  ↓
Dreambuilder Realm (NextAuth标准流程)
  ↓
获取Realm列表 (后端API - 使用Admin Client)
  ↓
点击切换Realm
  ↓
清除当前Session
  ↓
SSO到目标Realm (Keycloak Identity Brokering)
  ↓
自定义Callback处理 (/api/auth/realm-switch)
  ↓
创建新Session (手动设置cookie)
  ↓
✅ 切换完成
```

### 实施步骤

#### 1. 修改Realm切换逻辑

```typescript
// components/desktop/UserMenu.tsx
async function handleSwitchRealm(realmName: string) {
  // 1. 清除当前session（但保留一个标记）
  localStorage.setItem('switching-to-realm', realmName)
  await signOut({ redirect: false })
  
  // 2. 短暂延迟确保session清除
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 3. 跳转到SSO
  const authUrl = buildRealmSSOUrl(realmName)
  window.location.href = authUrl
}
```

#### 2. 创建专用的Realm切换回调

```typescript
// app/api/auth/realm-switch/route.ts
export async function GET(req: NextRequest) {
  // 1. 获取OAuth code
  // 2. 交换token
  // 3. 解析用户信息
  // 4. 创建完整的JWT token
  // 5. 设置HttpOnly cookie
  // 6. 清除localStorage标记
  // 7. 重定向到桌面
}
```

#### 3. 修改JWT Callback处理动态Realm

```typescript
// lib/auth.ts
async jwt({ token, account, profile }) {
  if (account && profile) {
    // 标准登录流程
  }
  
  // 重要：检查是否是手动设置的token
  if (token._isManual) {
    // 跳过NextAuth的处理，直接返回
    return token
  }
  
  // 正常的token刷新逻辑
}
```

#### 4. 创建Session创建辅助函数

```typescript
// lib/session-manager.ts
export async function createRealmSession(
  realmName: string,
  tokens: any,
  user: any
) {
  const tokenData = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    realmName: realmName,
    user: user,
    _isManual: true, // 标记为手动创建
    // ... 其他必要字段
  }
  
  // 使用NextAuth的encode创建JWT
  const jwt = await encode({
    token: tokenData,
    secret: process.env.NEXTAUTH_SECRET!,
  })
  
  return jwt
}
```

### 关键改进点

1. **标记手动创建的Token** (`_isManual`)
   - JWT callback看到这个标记就跳过处理
   - 避免被NextAuth覆盖

2. **localStorage协调**
   - 存储切换意图
   - 确保流程连贯

3. **独立的切换回调**
   - 不与标准登录流程混淆
   - 专门处理realm切换

4. **等待Session清除**
   - 300ms延迟确保旧cookie清除
   - 避免cookie冲突

## 方案C：完全自定义认证（长期方案）

### 概述
完全移除NextAuth依赖，实现自己的OAuth客户端。

### 优势
- ✅ 完全控制
- ✅ 支持任意动态配置
- ✅ 无架构限制

### 劣势
- ❌ 工作量大（2-3周）
- ❌ 需要处理安全细节
- ❌ 维护成本高

### 不推荐
当前阶段不建议采用此方案。

## 最终推荐方案

**采用方案B：重构认证系统支持动态Realm**

### 理由
1. ✅ 不依赖用户Admin API权限（安全）
2. ✅ 保留NextAuth的优势（主登录）
3. ✅ 实施难度适中（2-3天）
4. ✅ 可扩展性好
5. ✅ 用户体验流畅

### 实施优先级

**P0 - 立即实施**：
1. 创建 `lib/session-manager.ts`
2. 创建 `app/api/auth/realm-switch/route.ts`
3. 修改 `components/desktop/UserMenu.tsx` 切换逻辑
4. 修改 `lib/auth.ts` 的jwt callback

**P1 - 后续优化**：
1. 添加切换loading状态
2. 优化错误处理
3. 添加切换动画
4. 实现realm切换历史记录

**P2 - 长期改进**：
1. 缓存realm列表
2. 预加载目标realm信息
3. 支持多realm并发登录
4. 实现realm收藏功能

## 预期效果

### 用户体验
```
点击切换组织
  ↓
显示"正在切换..." (300ms)
  ↓
快速SSO认证 (500ms)
  ↓
✅ 自动进入新realm桌面 (总计<1秒)
```

### 技术效果
- ✅ Session正确更新
- ✅ RealmName正确显示
- ✅ Token属于目标realm
- ✅ 后续操作在目标realm进行
- ✅ 可以随时切换回Dreambuilder

## 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Cookie冲突 | 中 | 清除旧session后等待300ms |
| Token过期 | 低 | 实现refresh逻辑 |
| 用户混淆当前realm | 中 | 界面明确显示当前组织 |
| 切换失败 | 中 | 完善错误处理和回滚 |

## 测试计划

### 单元测试
- [ ] session-manager.ts 各函数
- [ ] realm-switch route 处理逻辑
- [ ] jwt callback 的_isManual处理

### 集成测试
- [ ] Dreambuilder → Org1
- [ ] Org1 → Org2
- [ ] Org2 → Dreambuilder
- [ ] 快速连续切换
- [ ] 切换中断恢复

### E2E测试
- [ ] 完整切换流程
- [ ] Token刷新
- [ ] 页面刷新后realm保持
- [ ] 退出登录

## 下一步

立即开始实施方案B的P0任务。





