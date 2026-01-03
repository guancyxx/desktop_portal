# NextAuth v5 升级文档

## 升级概述

成功将项目从 NextAuth v4 升级到 NextAuth v5 (Auth.js)。

## 主要变更

### 1. 依赖升级

```json
// package.json
{
  "next": "^15.5.6",  // 从 14.0.4 升级（v5要求）
  "next-auth": "5.0.0-beta.29"  // 从 4.24.5 升级
}
```

### 2. 文件结构变更

- **auth.ts**: 从 `lib/auth.ts` 移到根目录 `auth.ts`
- **API Routes**: 使用新的 handlers 导出方式
- **Middleware**: 使用新的 `auth()` 函数

### 3. 核心配置文件

#### auth.ts (根目录)

```typescript
import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${keycloakInternalUrl}/realms/${keycloakRealm}`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger, session }) {
      // v5 新特性：支持 trigger 参数
      if (trigger === 'update' && session?.switchRealm) {
        // 动态realm切换逻辑
        return {
          ...token,
          accessToken: session.tokens.accessToken,
          realmName: session.switchRealm,
          // ...
        }
      }
      // ...
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut, update } = NextAuth(authConfig)
```

#### middleware.ts

```typescript
import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  // 中间件逻辑
})
```

#### API Routes

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"

export const { GET, POST } = handlers
```

### 4. 环境变量更新

```bash
# v5 使用 AUTH_SECRET 而不是 NEXTAUTH_SECRET
AUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# 向后兼容
NEXTAUTH_SECRET=your-secret-key  # 仍然支持
```

### 5. 动态 Realm 切换实现

v5 的关键优势：支持使用 `update()` 函数动态更新session。

#### 切换流程

1. **前端触发切换** (`UserMenu.tsx`):
   ```typescript
   // 跳转到OAuth认证
   window.location.href = authUrl.toString()
   ```

2. **OAuth Callback处理** (`/api/auth/callback/realm-switch`):
   - 接收OAuth code
   - 重定向到前端处理页面

3. **前端处理** (`/realm-switching`):
   ```typescript
   // 调用后端API交换tokens
   const response = await fetch('/api/auth/switch-realm', {
     method: 'POST',
     body: JSON.stringify({ code, realm, redirectUri }),
   })
   
   // 使用 v5 的 update() 更新session
   await update({
     switchRealm: data.realm,
     tokens: data.tokens,
   })
   ```

4. **JWT Callback处理**:
   ```typescript
   if (trigger === 'update' && session?.switchRealm) {
     // 更新token到新realm
     return { ...token, ...session.tokens }
   }
   ```

### 6. 类型定义

```typescript
// types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    realmName?: string
    switchRealm?: string
    tokens?: {
      accessToken: string
      refreshToken: string
      // ...
    }
  }
}
```

## 升级优势

### v5 相比 v4 的改进

1. **动态Session更新**: 使用 `update()` 函数实时更新session
2. **更好的TypeScript支持**: 类型推断更准确
3. **简化的配置**: 共享配置，减少重复代码
4. **边缘兼容性**: 支持Edge Runtime
5. **OAuth预览部署**: 支持在预览环境中OAuth认证

### 对本项目的具体好处

1. **无缝Realm切换**: 不需要完全重新登录
2. **更灵活的Token管理**: 动态realm的token刷新
3. **更好的开发体验**: 更清晰的配置和类型提示

## 当前状态

### ✅ 已完成
- [x] 升级 Next.js 到 15.5.6
- [x] 升级 NextAuth 到 v5.0.0-beta.29
- [x] 迁移 auth.ts 配置到 v5 格式
- [x] 更新 middleware.ts
- [x] 更新 API routes
- [x] 实现动态realm切换逻辑
- [x] 创建realm-switching处理页面

### ⏳ 待测试
- [ ] 初始登录流程
- [ ] Realm切换流程
- [ ] Token刷新功能
- [ ] 跨realm操作

### ⚠️ 已知问题

1. **Identity Brokering冲突**: 
   - 当前Keycloak配置了Identity Brokering，将Dreambuilder realm重定向到master realm
   - 需要调整Keycloak配置或在Dreambuilder realm创建本地用户

2. **测试环境问题**:
   - Master realm的admin密码问题
   - 需要配置测试用户

## 下一步

### 短期任务
1. 在Dreambuilder realm创建测试用户
2. 测试完整的登录流程
3. 测试realm切换功能
4. 验证token刷新

### 长期改进
1. 添加realm切换的loading状态
2. 优化错误处理
3. 添加切换动画
4. 实现realm切换历史记录
5. 添加单元测试和集成测试

## 回滚方案

如果需要回滚到 v4：

1. 恢复 package.json:
   ```json
   {
     "next": "14.0.4",
     "next-auth": "^4.24.5"
   }
   ```

2. 恢复 `lib/auth.ts.v4.backup`

3. 恢复旧的 middleware.ts 和 API routes

## 参考资源

- [NextAuth v5 官方文档](https://authjs.dev)
- [v4 到 v5 迁移指南](https://authjs.dev/getting-started/migrating-to-v5)
- [Keycloak Provider](https://authjs.dev/getting-started/providers/keycloak)
- [Dynamic Session Updates](https://authjs.dev/guides/extending-the-session#updating-the-session)

## 总结

NextAuth v5 升级为动态realm切换提供了强大的支持。虽然需要一些架构调整，但长期来看会带来更好的灵活性和用户体验。





