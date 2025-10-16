# DreamBuilder Portal - macOS 风格桌面系统

## 📖 概述

DreamBuilder Portal 是一个基于 Next.js 14 的 macOS 风格桌面系统，提供统一的应用访问入口和身份认证功能。

## 🚀 快速开始

### 访问系统

```
http://localhost:3000
```

登录后自动进入桌面模式。

### 测试账号

- 用户名: `testuser`
- 密码: `test123`
- 角色: user, admin

## 📱 功能特性

### 桌面组件

- **Dock 栏** - 底部应用启动栏（macOS 风格）
- **MenuBar** - 顶部系统菜单栏
- **Launchpad** - 全屏应用启动器
- **Window 系统** - 窗口化应用管理

### 页面功能

- `/desktop` - 主桌面
- `/settings` - 系统设置
- `/profile` - 用户个人资料  
- `/help` - 帮助中心

## 🎨 设计风格

参考 macOS Big Sur / Monterey 设计语言：
- 毛玻璃效果
- 动态渐变壁纸
- 流畅动画过渡
- 三色窗口控制按钮

## 📚 文档

### 当前文档
- [完整功能文档](./DESKTOP-FEATURES-COMPLETE.md) - 桌面功能详细说明
- [用户使用指南](../README-DESKTOP.md) - 用户操作指南
- [优化快速指南](./OPTIMIZATION_QUICK_GUIDE.md) - 优化功能使用指南 ⭐
- [DDD 架构指南](./DDD_ARCHITECTURE_GUIDE.md) - 领域驱动设计说明 ⭐
- [Docker 优化指南](./DOCKER_OPTIMIZATION_GUIDE.md) - Docker 配置优化

### 归档文档
- [优化文档归档](./archive/optimization/) - 代码优化完成文档 📦
- [历史文档](./archive/) - 其他历史文档和开发记录

> **提示**: ⭐ 标记的文档为最新优化成果，建议开发者优先阅读

## 🔧 技术栈

### 核心框架
- **Next.js 14** - App Router
- **React 18** - UI 框架
- **TypeScript** - 严格模式

### 状态和数据管理
- **Zustand** - 状态管理 🆕
- **TanStack Query** - 数据获取和缓存 🆕
- **Immer** - 不可变状态更新 🆕

### UI 和样式
- **Framer Motion** - 动画
- **Tailwind CSS** - 样式
- **Radix UI** - 无障碍组件

### 认证和安全
- **NextAuth** - 身份认证
- **Keycloak** - SSO 集成
- **DOMPurify** - XSS 防护 🆕

### 开发工具
- **React Query DevTools** - 数据调试 🆕
- **Zustand DevTools** - 状态调试 🆕

> **提示**: 🆕 标记为本次优化新增的技术栈

## 🐳 Docker 部署

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 重启 desktop-portal
docker-compose restart desktop-portal
```

## 📞 支持

访问 `/help` 页面查看详细使用说明和快捷键。

---

Built with ❤️ by DreamBuilder Team
