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

- [完整功能文档](./DESKTOP-FEATURES-COMPLETE.md)
- [用户使用指南](../README-DESKTOP.md)
- [归档文档](./archive/) - 历史文档和开发记录

## 🔧 技术栈

- Next.js 14 (App Router)
- React 18 + TypeScript
- Framer Motion (动画)
- Tailwind CSS (样式)
- NextAuth + Keycloak (认证)

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
