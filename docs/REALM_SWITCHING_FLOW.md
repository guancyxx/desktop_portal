# Realm 切换与 SSO 流程说明

## 概述

本文档描述了用户在 DreamBuilder 系统中切换组织(Realm)的完整流程，以及通过 Identity Brokering 实现的 SSO（单点登录）机制。

## 核心架构

### 多租户架构
- **主 Realm**: Dreambuilder - 作为中央身份提供者(IDP)
- **租户 Realms**: 每个组织对应一个独立的 Keycloak Realm
- **身份联邦**: 所有租户 Realm 通过 Identity Brokering 连接到 Dreambuilder Realm

### 关键特性
1. 用户在不同 realm 之间切换时，需要重新进行 SSO 认证
2. 每次切换都会获取新 realm 的 access token
3. 用户可以在任何 realm 中查看并切换到其有权访问的所有组织
4. 首次通过 SSO 登录到新 realm 时，自动创建用户，无需 review profile

## 流程图

### 1. 组织创建流程

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Keycloak
    
    User->>Frontend: 填写组织信息
    Frontend->>API: POST /api/organizations/create
    API->>Keycloak: 创建 Realm
    API->>Keycloak: 配置 Identity Brokering
    API->>Keycloak: 禁用 Review Profile
    API->>Keycloak: 创建 desktop-portal Client
    API-->>Frontend: 返回创建结果
    Frontend->>Frontend: 显示成功消息（2秒）
    Frontend->>User: 重定向到 /desktop
    Note over User: 用户停留在 Dreambuilder Realm
    Note over User: 新组织出现在组织选择列表中
\`\`\`

### 2. 组织切换流程

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Browser
    participant TargetRealm
    participant DreambuilderRealm
    participant NextAuth
    
    User->>Browser: 点击切换到目标组织
    Browser->>NextAuth: signOut() - 清除当前 session
    Browser->>TargetRealm: 重定向到目标 Realm 的登录页
    Note over Browser,TargetRealm: URL 包含 kc_idp_hint=dreambuilder
    TargetRealm->>Browser: 自动重定向到 DreamBuilder SSO
    Browser->>DreambuilderRealm: SSO 认证请求
    Note over DreambuilderRealm: 用户已在 Dreambuilder 登录
    DreambuilderRealm-->>TargetRealm: 返回认证 token
    TargetRealm->>TargetRealm: 创建/更新用户（如需要）
    TargetRealm->>Browser: 重定向到 /api/auth/realm-callback
    Browser->>NextAuth: 处理 callback，交换 token
    NextAuth->>Browser: 建立新 session
    Browser->>User: 重定向到 /desktop
    Note over User: 用户现在在目标 Realm 的桌面
\`\`\`

### 3. SSO 认证细节

\`\`\`mermaid
sequenceDiagram
    participant Browser
    participant TargetRealm as Target Realm<br/>(Keycloak)
    participant DreambuilderRealm as Dreambuilder Realm<br/>(Keycloak IDP)
    participant RealmCallback as /api/auth/realm-callback
    
    Browser->>TargetRealm: GET /realms/{target}/protocol/openid-connect/auth<br/>?client_id=desktop-portal<br/>&kc_idp_hint=dreambuilder<br/>&redirect_uri=.../realm-callback<br/>&state={realm,callbackUrl}
    
    Note over TargetRealm: 检测到 kc_idp_hint
    TargetRealm->>DreambuilderRealm: 重定向到 IDP 认证
    
    Note over DreambuilderRealm: 用户已登录，自动授权
    DreambuilderRealm-->>TargetRealm: 返回 IDP token
    
    TargetRealm->>TargetRealm: 验证 IDP token
    TargetRealm->>TargetRealm: 自动创建/更新用户<br/>（跳过 Review Profile）
    
    TargetRealm->>Browser: 重定向到 redirect_uri<br/>带上 authorization code
    
    Browser->>RealmCallback: GET /api/auth/realm-callback?code=xxx&state=xxx
    
    RealmCallback->>TargetRealm: POST /realms/{target}/protocol/openid-connect/token<br/>交换 access_token
    
    TargetRealm-->>RealmCallback: 返回 access_token, refresh_token
    
    RealmCallback->>RealmCallback: 设置 session cookie
    RealmCallback->>Browser: 重定向到 /desktop?realm={target}
    
    Note over Browser: 用户现在在目标 Realm 的 session 中
\`\`\`

## 关键组件说明

### Frontend 组件

#### RealmSelector.tsx
- 负责显示组织列表
- 处理组织切换逻辑
- 关键方法：`handleSwitchRealm()`
  ```typescript
  1. 调用 signOut({ redirect: false }) 清除当前 session
  2. 构建包含目标 realm 信息的 state 参数
  3. 重定向到目标 realm 的 auth 端点，带上 kc_idp_hint=dreambuilder
  ```

#### create/page.tsx
- 组织创建页面
- 创建成功后显示成功消息，2秒后返回桌面
- 用户可以在组织列表中找到新创建的组织

### Backend API

#### /api/organizations/create
- 创建新的 Keycloak Realm
- 配置 Identity Brokering
- 禁用 Review Profile
- 创建 desktop-portal Client

#### /api/auth/realm-callback
- 处理跨 Realm 的 OAuth 回调
- 使用 authorization code 交换 access token
- 建立新 realm 的 session
- 重定向到目标页面

#### /api/user/realms
- 返回当前用户可访问的所有组织
- 使用管理员凭据查询，不依赖用户当前所在的 realm
- 过滤条件：realm 配置了 dreambuilder IDP

### Keycloak 配置

#### Identity Provider 配置
每个租户 Realm 都配置了一个指向 Dreambuilder Realm 的 IDP：
- Alias: `dreambuilder`
- Display Name: `DreamBuilder SSO`
- Provider ID: `keycloak-oidc`
- Trust Email: true
- Sync Mode: FORCE
- 配置了属性映射器（email, username, firstName, lastName）

#### Authentication Flow
- 使用 "first broker login" flow
- **Review Profile 步骤设置为 DISABLED**
- 用户通过 SSO 首次登录时自动创建，无需填写额外信息

#### Broker Client
在 Dreambuilder Realm 中为每个租户创建一个 broker client：
- Client ID: `{realmName}-broker`
- Client Protocol: `openid-connect`
- Access Type: `confidential`
- Redirect URIs: `{keycloak_url}/realms/{realmName}/broker/dreambuilder/endpoint/*`

## Token 管理

### Token 作用域
- 每个 realm 有独立的 access token 和 refresh token
- 切换 realm 时，旧 token 失效，获取新 token

### Session 管理
- NextAuth session 绑定到当前 realm
- 切换 realm 相当于在新 realm 建立新的 session
- 前一个 realm 的 session 在切换时被清除

### Token 生命周期
- Access Token: 30 分钟
- SSO Session Idle Timeout: 30 分钟
- SSO Session Max Lifespan: 10 小时

## 用户属性同步

通过 Identity Brokering，以下用户属性会从 Dreambuilder Realm 同步到目标 Realm：
- Email（作为唯一标识）
- Username
- First Name
- Last Name

## 安全考虑

### 身份验证
- 所有认证最终都通过 Dreambuilder Realm 验证
- 租户 Realm 不存储密码，完全依赖 IDP

### 授权
- 每个 realm 可以有独立的角色和权限配置
- 用户在不同 realm 可以有不同的角色

### Token 安全
- Token 通过 HTTPS 传输（生产环境）
- Refresh token 用于静默刷新 access token
- Token 存储在 HTTP-only cookies 中

## 开发环境配置

### 环境变量
- `KEYCLOAK_INTERNAL_URL`: Keycloak 内部访问地址（后端使用）
- `KEYCLOAK_EXTERNAL_URL` / `NEXT_PUBLIC_KEYCLOAK_URL`: Keycloak 外部访问地址（浏览器使用）
- `KEYCLOAK_CLIENT_SECRET`: desktop-portal client 的密钥
- `NEXTAUTH_SECRET`: NextAuth JWT 加密密钥

### Hosts 配置
开发环境需要在 hosts 文件中配置：
\`\`\`
127.0.0.1 keycloak
\`\`\`

## 故障排查

### 问题：切换组织后还需要登录
- 检查 Identity Brokering 是否正确配置
- 检查 broker client 的 redirect URIs
- 查看 Keycloak 日志确认 SSO 流程

### 问题：出现 "Update Account Information" 页面
- 检查 "first broker login" flow 中的 Review Profile 步骤是否被禁用
- 手动调用 `/api/organizations/disable-review-profile` API

### 问题：Token 交换失败
- 检查 client_secret 是否正确
- 检查 redirect_uri 是否在 client 的白名单中
- 查看后端日志了解详细错误信息

### 问题：组织列表为空
- 检查 realm 是否配置了 dreambuilder IDP
- 检查用户邮箱是否与 Dreambuilder realm 中的一致
- 查看 API 日志确认查询逻辑

## 后续优化建议

1. **自动 SSO 跳转**：通过 `kc_idp_hint` 参数实现自动跳过登录页面，直接进行 SSO
2. **Session 持久化**：考虑实现跨 realm 的 session 共享机制
3. **Token 刷新**：实现 refresh token 的自动刷新逻辑
4. **错误处理**：增强错误处理和用户提示
5. **日志监控**：添加详细的认证流程日志，便于故障排查

