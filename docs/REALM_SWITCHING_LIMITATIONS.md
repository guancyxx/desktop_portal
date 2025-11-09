# Realm 切换功能限制说明

## 当前状态

✅ **已实现**：
1. 组织列表获取（优先前端直接调用，fallback到后端）
2. SSO认证流程（用户可以通过SSO登录到不同realm）
3. Token动态获取（根据目标realm获取正确的client secret）

⚠️ **部分实现**：
- Realm切换后URL更新，但session未更新
- 用户仍然停留在Dreambuilder realm

## 根本问题

### NextAuth架构限制

NextAuth的配置是**静态的**，在应用启动时就固定了：

```typescript
// lib/auth.ts
const keycloakRealm = process.env.KEYCLOAK_REALM || 'Dreambuilder'

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      issuer: `${keycloakInternalUrl}/realms/${keycloakRealm}`,  // 硬编码
      authorization: {
        url: `${keycloakExternalUrl}/realms/${keycloakRealm}/...`, // 硬编码
      },
      token: `${keycloakInternalUrl}/realms/${keycloakRealm}/...`,  // 硬编码
    }),
  ],
}
```

这意味着：
1. **所有登录都通过Dreambuilder realm**
2. **Token刷新也使用Dreambuilder realm**  
3. **无法动态切换到其他realm**

### 尝试的解决方案及问题

#### 方案1：手动设置Session Cookie ❌

**尝试**：在realm-callback中手动创建JWT并设置cookie

**问题**：
- NextAuth在redirect后仍然读取旧的cookie
- JWT callback会被再次调用，覆盖我们设置的realmName
- Token刷新逻辑仍然指向Dreambuilder

#### 方案2：修改JWT Callback保留RealmName ⚠️

**尝试**：在jwt callback中保留已存在的realmName

```typescript
if (token.realmName && typeof token.realmName === 'string') {
  console.log(`[Auth] Using existing realmName: ${token.realmName}`)
}
```

**问题**：
- 虽然保留了realmName，但旧cookie仍然被使用
- 新设置的cookie没有生效

## 长期解决方案

### 方案A：多Realm Provider配置（推荐）⭐

为每个realm创建独立的NextAuth provider配置：

```typescript
// 动态生成providers
const realms = ['Dreambuilder', 'org1-realm', 'org2-realm']

export const authOptions: NextAuthOptions = {
  providers: realms.map(realm => 
    KeycloakProvider({
      id: `keycloak-${realm}`,
      issuer: `${keycloakUrl}/realms/${realm}`,
      // ...
    })
  ),
}
```

**优势**：
- ✅ 符合NextAuth架构
- ✅ 每个realm独立管理
- ✅ Token刷新正确

**劣势**：
- ❌ 需要预先知道所有realm
- ❌ 动态创建的realm需要重启应用

### 方案B：自定义Auth系统

完全不使用NextAuth，自己实现OAuth flow：

**优势**：
- ✅ 完全控制
- ✅ 支持动态realm
- ✅ 灵活性最高

**劣势**：
- ❌ 开发工作量大
- ❌ 需要自己处理安全问题
- ❌ 维护成本高

### 方案C：单点登录 + Realm映射（折中）

用户始终登录到Dreambuilder，但通过Identity Brokering访问其他realm：

**当前实现**：
1. 用户登录 Dreambuilder
2. 点击切换组织
3. 通过SSO自动登录到目标realm
4. ❌ Session未更新（问题所在）

**改进方案**：
1. 用户登录 Dreambuilder
2. 点击切换组织
3. **清除当前session**
4. 使用SSO登录到目标realm
5. **让NextAuth创建新的session**

**实现步骤**：
```typescript
// 1. 清除session
await signOut({ redirect: false })

// 2. 等待session清除
await new Promise(resolve => setTimeout(resolve, 500))

// 3. 跳转到Keycloak SSO
window.location.href = `${keycloakUrl}/realms/${targetRealm}/protocol/openid-connect/auth?...&kc_idp_hint=dreambuilder`
```

**问题**：
- ⚠️ 用户会看到短暂的登录页面
- ⚠️ 体验不够流畅

## 当前临时方案

鉴于架构限制，当前采用**简化方案**：

```typescript
async function handleSwitchRealm(realmName: string) {
  alert('准备切换组织，需要重新登录')
  await signOut({ callbackUrl: '/login' })
}
```

**特点**：
- ✅ 明确告知用户需要重新登录
- ✅ 避免给用户造成困惑（为什么切换了但realm没变）
- ✅ 简单可靠
- ❌ 用户体验不佳

## 推荐实施路径

### 短期（1-2周）

实施**方案C改进版**：

1. 修改切换逻辑：
   ```typescript
   // components/desktop/UserMenu.tsx
   async function handleSwitchRealm(realmName: string) {
     // 清除session
     await signOut({ redirect: false })
     
     // 构建SSO URL
     const authUrl = buildSSOUrl(realmName)
     
     // 跳转（会快速完成SSO）
     window.location.href = authUrl
   }
   ```

2. 优化SSO流程：
   - 确保 `kc_idp_hint=dreambuilder` 参数正确传递
   - 禁用Review Profile确保无需填表
   - 自动重定向到桌面

### 中期（1-2月）

实施**方案A**（多Provider）：

1. 创建Realm管理系统
2. 动态注册realm到NextAuth
3. 支持热重载（无需重启）

### 长期（3-6月）

考虑**方案B**（自定义系统）或升级到支持动态配置的认证框架。

## 测试结果

### 功能测试

| 功能 | 状态 | 说明 |
|------|------|------|
| 获取组织列表 | ✅ 正常 | 前端直接调用+fallback |
| 显示当前组织 | ✅ 正常 | 从session读取 |
| 点击切换组织 | ⚠️ 部分 | URL更新，session未更新 |
| SSO自动认证 | ✅ 正常 | kc_idp_hint生效 |
| Token交换 | ✅ 正常 | 动态获取client secret |

### 日志分析

```
[RealmCallback] Successfully set session cookie for realm: 0b5ccaa8-sso-test  ✅
[Auth] Initial login to realm: Dreambuilder  ❌ (应该是目标realm)
[Auth] Using existing realmName: Dreambuilder  ❌ (旧cookie被使用)
```

## 总结

由于NextAuth的架构限制，完整的跨realm切换需要较大的重构工作。

当前建议：
1. **短期**：使用临时方案（提示用户重新登录）
2. **中期**：实施改进的SSO流程
3. **长期**：重构认证系统或迁移到更灵活的框架

相关文档：
- `REALM_SWITCHING_FLOW.md` - 原设计方案
- `REALM_API_OPTIMIZATION.md` - API优化方案  
- `CODE_REFACTORING_SUMMARY.md` - 代码重构总结




