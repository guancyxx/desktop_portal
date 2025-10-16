# Desktop Portal 实施指南

本文档提供详细的实施步骤，帮助您从零开始构建 Desktop Portal 项目。

## 📋 实施计划

### 阶段 1: 项目初始化 (1-2天)

#### 1.1 创建 Next.js 项目

```bash
# 进入项目目录
cd applications/desktop-portal

# 初始化 Next.js 项目（如果还没有）
npx create-next-app@latest . --typescript --tailwind --app --use-pnpm

# 安装依赖
pnpm install
```

#### 1.2 安装必要的依赖包

```bash
# 身份认证
pnpm add next-auth@latest

# UI 组件库
pnpm add @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slot
pnpm add @radix-ui/react-tabs @radix-ui/react-toast

# 工具库
pnpm add class-variance-authority clsx tailwind-merge
pnpm add framer-motion lucide-react
pnpm add axios zustand zod react-hook-form @hookform/resolvers

# 开发依赖
pnpm add -D tailwindcss-animate prettier prettier-plugin-tailwindcss
```

#### 1.3 配置环境变量

创建 `.env.local` 文件：

```env
# Keycloak Configuration
KEYCLOAK_ID=desktop-portal
KEYCLOAK_SECRET=your-client-secret-here
KEYCLOAK_ISSUER=http://localhost:8080/realms/dreambuilder

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-your-secret-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

生成 NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

---

### 阶段 2: 基础架构搭建 (2-3天)

#### 2.1 创建目录结构

```bash
mkdir -p app/{(auth)/login,(portal)/{profile,apps},api/auth/[...nextauth]}
mkdir -p components/{ui,layout,dashboard,profile}
mkdir -p lib hooks types config public/{images,icons}
```

#### 2.2 配置 NextAuth

创建 `lib/auth.ts`:

```typescript
import { NextAuthOptions } from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
        token.roles = account.realm_access?.roles || []
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.idToken = token.idToken as string
      session.roles = token.roles as string[]
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
```

创建 `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

#### 2.3 创建中间件保护路由

创建 `middleware.ts`:

```typescript
export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/portal/:path*',
    '/api/apps/:path*',
  ],
}
```

---

### 阶段 3: UI 组件开发 (3-4天)

#### 3.1 安装 shadcn/ui

```bash
# 初始化 shadcn/ui
npx shadcn-ui@latest init

# 添加所需组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
```

#### 3.2 创建全局样式

创建 `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 262.1 83.3% 57.8%;
    --primary-foreground: 210 40% 98%;
    /* ...更多颜色变量 */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ...更多颜色变量 */
  }
}
```

#### 3.3 创建布局组件

创建 `components/layout/header.tsx`:

```typescript
'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <h1 className="text-2xl font-bold">DreamBuilder Portal</h1>
        <div className="flex items-center gap-4">
          <span>{session?.user?.name}</span>
          <Avatar>
            <AvatarFallback>
              {session?.user?.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <Button onClick={() => signOut()}>Logout</Button>
        </div>
      </div>
    </header>
  )
}
```

---

### 阶段 4: 应用配置与展示 (2-3天)

#### 4.1 创建应用配置

创建 `config/apps.ts`:

```typescript
export interface Application {
  id: string
  name: string
  description: string
  icon: string
  url: string
  category: string
  roles: string[]
  status: 'active' | 'coming-soon' | 'disabled'
  color: string
}

export const applications: Application[] = [
  {
    id: 'task-manager',
    name: 'Task Manager',
    description: 'Manage your tasks and projects efficiently',
    icon: '📋',
    url: 'http://localhost:3001',
    category: 'productivity',
    roles: ['user', 'admin'],
    status: 'active',
    color: '#667eea',
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Your intelligent automation helper',
    icon: '🤖',
    url: 'http://localhost:3002',
    category: 'ai',
    roles: ['user', 'admin'],
    status: 'active',
    color: '#f093fb',
  },
  // 更多应用...
]
```

#### 4.2 创建应用卡片组件

创建 `components/dashboard/app-card.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Application } from '@/config/apps'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AppCardProps {
  app: Application
  index: number
}

export function AppCard({ app, index }: AppCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="group hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="text-4xl mb-2">{app.icon}</div>
          <CardTitle>{app.name}</CardTitle>
          <CardDescription>{app.description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            className="w-full" 
            asChild
            style={{ backgroundColor: app.color }}
          >
            <Link href={app.url} target="_blank">
              Open Application
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
```

#### 4.3 创建工作台页面

创建 `app/(portal)/page.tsx`:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { applications } from '@/config/apps'
import { AppCard } from '@/components/dashboard/app-card'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  // 根据用户角色过滤应用
  const userApps = applications.filter(app =>
    app.roles.some(role => session?.roles?.includes(role))
  )

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Applications</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userApps.map((app, index) => (
          <AppCard key={app.id} app={app} index={index} />
        ))}
      </div>
    </div>
  )
}
```

---

### 阶段 5: 样式优化（参考 Ark Desktop）(1-2天)

#### 5.1 实现渐变背景

```typescript
// components/layout/gradient-bg.tsx
export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
    </div>
  )
}
```

#### 5.2 添加动画效果

在 `tailwind.config.ts` 中添加：

```typescript
keyframes: {
  blob: {
    '0%': { transform: 'translate(0px, 0px) scale(1)' },
    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
    '100%': { transform: 'translate(0px, 0px) scale(1)' },
  },
},
animation: {
  blob: 'blob 7s infinite',
},
```

---

### 阶段 6: 测试与优化 (2-3天)

#### 6.1 性能优化

- 使用 Next.js Image 组件
- 实现代码分割
- 添加 loading 状态
- 实现错误边界

#### 6.2 SEO 优化

创建 `app/(portal)/layout.tsx`:

```typescript
export const metadata = {
  title: 'DreamBuilder Portal',
  description: 'Unified login portal for all applications',
}
```

---

## 🚀 快速启动脚本

完成所有配置后，运行：

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 访问 http://localhost:3000
```

---

## ✅ 验收标准

- [ ] 用户可以通过 Keycloak 登录
- [ ] 登录后显示应用工作台
- [ ] 根据用户角色显示不同应用
- [ ] 应用卡片有悬停动画
- [ ] 点击应用可以跳转
- [ ] 支持暗色模式
- [ ] 响应式设计适配移动端
- [ ] 性能评分 >= 90 (Lighthouse)

---

## 📚 参考资源

- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [NextAuth.js with Keycloak](https://next-auth.js.org/providers/keycloak)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Ark Desktop Design](https://github.com/longguikeji/ark-desktop)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 💡 最佳实践

1. **使用 Server Components** - 尽可能使用服务端组件
2. **类型安全** - 为所有 API 调用定义类型
3. **错误处理** - 实现全局错误边界
4. **加载状态** - 所有异步操作显示加载状态
5. **可访问性** - 遵循 WCAG 标准
6. **性能监控** - 使用 Vercel Analytics

---

**实施进度跟踪：** 请在实施过程中更新此文档的完成状态

