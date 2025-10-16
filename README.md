# Desktop Portal - DreamBuilder 统一登录门户

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## 📖 项目简介

Desktop Portal 是 DreamBuilder 平台的统一登录门户，采用 **Next.js 14** 最新技术栈开发。设计理念参考 [Ark Desktop](https://github.com/longguikeji/ark-desktop)，提供现代化的应用访问入口和身份认证功能。

### 设计参考

本项目参考了 **Ark Desktop** 的设计理念：
- 🎨 现代化的 UI 设计
- 🔄 流畅的用户体验
- 📱 完善的移动端适配
- 🎯 直观的应用导航

### 核心特性

- 🔐 **统一身份认证** - 集成 Keycloak，支持 SSO 单点登录
- 🏠 **应用工作台** - 集中展示所有可访问的应用，类似 Ark Desktop
- 👤 **用户中心** - 个人信息管理、密码修改、会话管理
- 🎨 **现代化 UI** - 基于 Next.js 14 App Router 和 Tailwind CSS
- 🔒 **角色权限** - 基于角色的动态应用展示
- 📱 **响应式设计** - 完美支持桌面、平板和移动设备
- ⚡ **高性能** - 利用 Next.js 的 Server Components 和增量静态生成
- 🌓 **主题切换** - 支持亮色/暗色模式

---

## 🏗️ 技术架构

### 技术栈 (最新版本)

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.3
- **样式**: Tailwind CSS 3.4 + shadcn/ui
- **身份认证**: Keycloak + next-auth
- **状态管理**: Zustand / React Context
- **HTTP 客户端**: Fetch API / Axios
- **UI 组件**: Radix UI + shadcn/ui
- **图标**: Lucide React
- **动画**: Framer Motion
- **表单**: React Hook Form + Zod
- **代码规范**: ESLint + Prettier

### 为什么选择 Next.js 14？

- ✅ **Server Components** - 减少客户端 JavaScript
- ✅ **App Router** - 更灵活的路由系统
- ✅ **内置优化** - 自动代码分割、图片优化
- ✅ **SEO 友好** - 服务端渲染支持
- ✅ **开发体验** - Fast Refresh、TypeScript 支持
- ✅ **生产就绪** - 性能优化和部署简单

### 架构图

```
┌─────────────────────────────────────────────────┐
│    Desktop Portal (Next.js 14 App Router)       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │     App Router (Server Components)       │  │
│  │  /app                                    │  │
│  │  ├─ (auth)                              │  │
│  │  │  ├─ login/                           │  │
│  │  │  └─ callback/                        │  │
│  │  ├─ (portal)                            │  │
│  │  │  ├─ layout.tsx                       │  │
│  │  │  ├─ page.tsx (Dashboard)            │  │
│  │  │  ├─ profile/                         │  │
│  │  │  └─ apps/                            │  │
│  │  └─ api/                                │  │
│  │     ├─ auth/[...nextauth]/              │  │
│  │     └─ apps/                            │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Keycloak Integration (next-auth)        │  │
│  │  - SSO Authentication                     │  │
│  │  - Token Management                       │  │
│  │  - Role-based Access Control              │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  UI Layer (Tailwind + shadcn/ui)         │  │
│  │  - Application Cards                      │  │
│  │  - User Profile                           │  │
│  │  - Navigation Menu                        │  │
│  │  - Settings Panel                         │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18.17
- pnpm >= 8.0 (推荐) 或 npm >= 9.0
- 已部署的 Keycloak 服务

### 安装

```bash
# 克隆仓库（如果独立使用）
git clone git@github.com:guancyxx/desktop_portal.git
cd desktop_portal

# 或在 DreamBuilder 主项目中
cd applications/desktop-portal

# 安装依赖 (推荐使用 pnpm)
pnpm install
# 或
npm install
```

### 配置

创建 `.env.local` 文件：

```env
# Keycloak Configuration
KEYCLOAK_ID=desktop-portal
KEYCLOAK_SECRET=your-client-secret
KEYCLOAK_ISSUER=http://localhost:8080/realms/dreambuilder

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Application Configuration
NEXT_PUBLIC_APP_NAME=DreamBuilder Portal
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 运行

```bash
# 开发模式
pnpm dev
# 或
npm run dev

# 构建生产版本
pnpm build
npm start

# 类型检查
pnpm type-check

# 代码检查
pnpm lint
```

访问 http://localhost:3000

---

## 📂 项目结构（Next.js 14 App Router）

```
desktop-portal/
├── app/                         # Next.js 14 App Router
│   ├── (auth)/                  # 认证相关页面（路由组）
│   │   ├── login/
│   │   │   └── page.tsx         # 登录页面
│   │   └── callback/
│   │       └── page.tsx         # OAuth 回调页面
│   ├── (portal)/                # 门户主体（路由组）
│   │   ├── layout.tsx           # 门户布局
│   │   ├── page.tsx             # 应用工作台
│   │   ├── profile/
│   │   │   └── page.tsx         # 用户资料
│   │   └── apps/
│   │       └── [id]/
│   │           └── page.tsx     # 应用详情
│   ├── api/                     # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts     # NextAuth 配置
│   │   └── apps/
│   │       └── route.ts         # 应用列表 API
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页（重定向）
│   └── globals.css              # 全局样式
├── components/                  # React 组件
│   ├── ui/                      # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/                  # 布局组件
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── dashboard/               # 工作台组件
│   │   ├── app-card.tsx         # 应用卡片
│   │   ├── app-grid.tsx         # 应用网格
│   │   └── quick-actions.tsx    # 快捷操作
│   └── profile/                 # 用户资料组件
│       ├── user-info.tsx
│       └── settings-form.tsx
├── lib/                         # 工具库
│   ├── auth.ts                  # NextAuth 配置
│   ├── keycloak.ts              # Keycloak 配置
│   ├── utils.ts                 # 工具函数
│   └── api.ts                   # API 客户端
├── hooks/                       # 自定义 Hooks
│   ├── use-auth.ts              # 认证 Hook
│   ├── use-apps.ts              # 应用列表 Hook
│   └── use-theme.ts             # 主题切换 Hook
├── types/                       # TypeScript 类型
│   ├── auth.ts
│   ├── app.ts
│   └── index.ts
├── config/                      # 配置文件
│   ├── apps.ts                  # 应用配置
│   └── site.ts                  # 站点配置
├── public/                      # 静态资源
│   ├── images/
│   └── icons/
├── .env.local.example           # 环境变量示例
├── next.config.js               # Next.js 配置
├── tailwind.config.ts           # Tailwind 配置
├── tsconfig.json                # TypeScript 配置
└── package.json                 # 项目依赖
```

---

## 🎨 UI 设计参考 Ark Desktop

### 设计理念

参考 Ark Desktop 的设计，我们采用：

1. **卡片式布局** - 应用以卡片形式展示，清晰直观
2. **网格系统** - 响应式网格，自适应不同屏幕
3. **现代配色** - 简洁的配色方案，支持深色模式
4. **流畅动画** - 使用 Framer Motion 实现平滑过渡
5. **图标系统** - 统一的图标风格

### 主要页面

#### 1. 应用工作台（参考 Ark Desktop）

```typescript
// app/(portal)/page.tsx
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const apps = await getAuthorizedApps(session)
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Applications</h1>
      <AppGrid apps={apps} />
    </div>
  )
}
```

#### 2. 应用卡片组件

```typescript
// components/dashboard/app-card.tsx
export function AppCard({ app }: { app: Application }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="text-4xl mb-2">{app.icon}</div>
        <CardTitle>{app.name}</CardTitle>
        <CardDescription>{app.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={app.url}>Open App</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

## 🔐 Keycloak 集成（NextAuth）

### 配置 NextAuth

```typescript
// lib/auth.ts
import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"

export const authOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.idToken = token.idToken
      return session
    }
  }
}

export default NextAuth(authOptions)
```

### 保护路由

```typescript
// middleware.ts
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/(portal)/:path*",
    "/api/apps/:path*"
  ]
}
```

---

## 🎯 功能实现

### 1. 应用配置

```typescript
// config/apps.ts
export const applications = [
  {
    id: 'task-manager',
    name: 'Task Manager',
    description: 'Manage your tasks efficiently',
    icon: '📋',
    url: 'http://localhost:3001',
    category: 'productivity',
    roles: ['user', 'admin'],
    status: 'active',
    color: '#667eea'
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Your intelligent helper',
    icon: '🤖',
    url: 'http://localhost:3002',
    category: 'ai',
    roles: ['user', 'admin'],
    status: 'active',
    color: '#f093fb'
  },
  // 更多应用...
]
```

### 2. 服务端组件获取数据

```typescript
// app/(portal)/page.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  // 服务端获取数据
  const apps = await fetch(`${process.env.API_URL}/apps`, {
    headers: {
      Authorization: `Bearer ${session?.accessToken}`
    }
  }).then(res => res.json())
  
  return <AppGrid apps={apps} />
}
```

### 3. 客户端交互

```typescript
// components/dashboard/app-grid.tsx
'use client'

import { motion } from 'framer-motion'

export function AppGrid({ apps }: { apps: Application[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {apps.map((app, index) => (
        <motion.div
          key={app.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <AppCard app={app} />
        </motion.div>
      ))}
    </div>
  )
}
```

---

## 🚀 部署

### Vercel 部署（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 生产部署
vercel --prod
```

### Docker 部署

```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 自托管部署

```bash
# 构建
pnpm build

# 启动
pnpm start

# 或使用 PM2
pm2 start npm --name "desktop-portal" -- start
```

---

## 📚 文档

### 项目文档

- **[文档中心](docs/README.md)** - 完整的文档导航
- **[安装指南](docs/setup/SETUP.md)** - 详细安装和配置步骤
- **[实施指南](docs/development/IMPLEMENTATION.md)** - 6阶段开发计划
- **[贡献指南](docs/development/CONTRIBUTING.md)** - 代码规范和贡献流程
- **[更新日志](docs/CHANGELOG.md)** - 版本历史

### 外部资源

- [Next.js 14 文档](https://nextjs.org/docs)
- [NextAuth.js 文档](https://next-auth.js.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 组件](https://ui.shadcn.com/)
- [Ark Desktop 项目](https://github.com/longguikeji/ark-desktop)
- [Keycloak 官方文档](https://www.keycloak.org/documentation)

---

## 🛠️ 开发指南

### 添加新应用

1. 在 `config/apps.ts` 中添加配置
2. 在 Keycloak 中创建对应 Client
3. 重启开发服务器

### 自定义主题

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          // ... 更多颜色
        }
      }
    }
  }
}
```

### 添加新页面

```bash
# 创建新页面
app/
  (portal)/
    new-page/
      page.tsx
```

---

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [Ark Desktop](https://github.com/longguikeji/ark-desktop) - 设计灵感
- [Next.js](https://nextjs.org/) - React 框架
- [Keycloak](https://www.keycloak.org/) - 身份认证
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件

---

**Built with ❤️ using Next.js 14 for DreamBuilder Project**
