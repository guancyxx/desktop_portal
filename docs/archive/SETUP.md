# Desktop Portal 完整安装指南

## 📋 前置要求

### 必需

- Node.js >= 18.17.0
- pnpm >= 8.0.0 (推荐) 或 npm >= 9.0.0
- Git
- 已部署的 Keycloak 服务

### 检查版本

```bash
node --version  # v18.17.0 or higher
pnpm --version  # 8.0.0 or higher
```

---

## 🚀 安装步骤

### 步骤 1: 获取代码

#### 方式 A: 从主项目（推荐）

```bash
# 克隆主项目并包含子模块
git clone --recursive git@github.com:guancyxx/DreamBuilder.git
cd DreamBuilder/applications/desktop-portal
```

#### 方式 B: 独立克隆

```bash
git clone git@github.com:guancyxx/desktop_portal.git
cd desktop_portal
```

---

### 步骤 2: 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

**预期输出:**
```
Progress: resolved XXX, reused XXX, downloaded XXX
Dependencies installed successfully
```

---

### 步骤 3: 配置环境变量

创建 `.env.local` 文件:

```bash
cp .env.example .env.local
```

编辑 `.env.local`:

```env
# Keycloak Configuration
KEYCLOAK_ID=desktop-portal
KEYCLOAK_SECRET=your-client-secret-here
KEYCLOAK_ISSUER=http://localhost:8080/realms/dreambuilder

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Application Configuration
NEXT_PUBLIC_APP_NAME=DreamBuilder Portal
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**生成 NEXTAUTH_SECRET:**

```bash
# Linux/Mac/WSL
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

### 步骤 4: 配置 Keycloak 客户端

在 Keycloak 管理控制台中创建客户端：

1. 访问 http://localhost:8080
2. 登录管理员账户 (admin/admin_password)
3. 切换到 `dreambuilder` Realm
4. 进入 **Clients** → **Create client**

**客户端配置:**

```yaml
General Settings:
  Client ID: desktop-portal
  Name: Desktop Portal
  Description: DreamBuilder unified login portal
  
Capability config:
  Client authentication: ON
  Authorization: OFF
  Authentication flow:
    ✓ Standard flow
    ✓ Direct access grants
  
Login settings:
  Root URL: http://localhost:3000
  Home URL: http://localhost:3000
  Valid redirect URIs:
    - http://localhost:3000/*
    - http://localhost:3000/api/auth/callback/keycloak
  Valid post logout redirect URIs:
    - http://localhost:3000/*
  Web origins:
    - http://localhost:3000
```

5. 保存后进入 **Credentials** 标签
6. 复制 **Client secret**
7. 将其填入 `.env.local` 的 `KEYCLOAK_SECRET`

---

### 步骤 5: 启动开发服务器

```bash
pnpm dev
```

**预期输出:**
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.5s
```

访问 http://localhost:3000

---

## ✅ 验证安装

### 1. 访问首页

打开 http://localhost:3000

应该自动重定向到 `/portal`

### 2. 测试登录

1. 如果未登录，会跳转到登录页面
2. 点击 "Sign in with Keycloak"
3. 在 Keycloak 页面输入：
   - Username: `testuser`
   - Password: `password123`
4. 登录成功后应该看到应用工作台

### 3. 检查功能

- [ ] 能看到欢迎横幅
- [ ] 能看到统计概览
- [ ] 能看到应用卡片
- [ ] 能点击应用分类过滤
- [ ] 能访问用户资料页面
- [ ] 能访问设置页面
- [ ] 能切换明暗主题
- [ ] 能正常退出登录

---

## 🔧 常见问题

### Q1: Cannot find module 'next-auth'

**解决:**
```bash
pnpm install next-auth
```

### Q2: Keycloak 连接失败

**检查:**
1. Keycloak 是否运行: `docker-compose ps`
2. 端口是否正确: http://localhost:8080
3. Realm 名称是否为 `dreambuilder`

### Q3: 登录后显示错误

**检查:**
1. Client secret 是否正确
2. Redirect URIs 是否配置
3. 查看浏览器控制台错误

### Q4: 样式不显示

**解决:**
```bash
# 重新构建 Tailwind
rm -rf .next
pnpm dev
```

---

## 📦 生产构建

```bash
# 构建
pnpm build

# 启动生产服务器
pnpm start

# 或使用 PM2
pm2 start npm --name "desktop-portal" -- start
```

---

## 🐳 Docker 部署

```bash
# 构建镜像
docker build -t desktop-portal:latest .

# 运行容器
docker run -p 3000:3000 --env-file .env.local desktop-portal:latest
```

---

## 🎯 下一步

1. **自定义应用列表** - 编辑 `config/apps.ts`
2. **调整样式** - 修改 `tailwind.config.ts`
3. **添加新页面** - 在 `app/` 下创建
4. **集成后端 API** - 使用 `lib/api.ts`

---

## 📚 相关文档

- [README.md](README.md) - 项目概述
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - 实施指南
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
- [CHANGELOG.md](CHANGELOG.md) - 更新日志

---

**安装完成！开始享受 DreamBuilder Portal！** 🎉

