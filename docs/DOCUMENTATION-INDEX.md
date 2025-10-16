# Desktop Portal - 文档索引

本文档提供快速导航，帮助您找到所需的文档。

---

## 📁 文档结构

```
docs/
├── README.md                          # 文档中心（本目录）
├── DOCUMENTATION-INDEX.md             # 文档索引（本文件）
├── CHANGELOG.md                       # 版本变更历史
├── setup/                             # 安装配置文档
│   └── SETUP.md                       # 完整安装指南
├── development/                       # 开发文档
│   ├── IMPLEMENTATION.md              # 实施指南
│   └── CONTRIBUTING.md                # 贡献指南
├── user-guide/                        # 用户指南（待添加）
└── api/                               # API 文档（待添加）
```

---

## 📖 文档快速导航

### 🚀 新手入门

| 文档 | 路径 | 说明 |
|------|------|------|
| **项目概述** | [../README.md](../README.md) | 了解项目、技术栈和架构 |
| **快速开始** | [../README.md#quick-start](../README.md#quick-start) | 5分钟快速上手 |
| **安装指南** | [setup/SETUP.md](setup/SETUP.md) | 详细的安装和配置步骤 |

### 💻 开发者文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **实施指南** | [development/IMPLEMENTATION.md](development/IMPLEMENTATION.md) | 6阶段开发计划和代码示例 |
| **贡献指南** | [development/CONTRIBUTING.md](development/CONTRIBUTING.md) | 代码规范和PR流程 |
| **项目结构** | [../README.md#project-structure](../README.md#project-structure) | 目录和文件说明 |

### 📝 项目管理

| 文档 | 路径 | 说明 |
|------|------|------|
| **更新日志** | [CHANGELOG.md](CHANGELOG.md) | 版本历史和变更记录 |
| **许可证** | [../LICENSE](../LICENSE) | MIT License |

---

## 🎯 按任务查找文档

### 我想安装和运行项目

1. [安装指南](setup/SETUP.md#installation) - 安装步骤
2. [环境配置](setup/SETUP.md#environment-variables) - 配置环境变量
3. [Keycloak 配置](setup/SETUP.md#keycloak-configuration) - 配置认证服务
4. [启动应用](setup/SETUP.md#running) - 启动开发服务器

### 我想开发新功能

1. [实施指南](development/IMPLEMENTATION.md) - 了解开发流程
2. [项目结构](../README.md#project-structure) - 了解代码组织
3. [贡献指南](development/CONTRIBUTING.md#coding-standards) - 遵循代码规范
4. [API 参考](../README.md#api) - 使用 API

### 我想贡献代码

1. [贡献指南](development/CONTRIBUTING.md) - 完整流程
2. [代码规范](development/CONTRIBUTING.md#coding-standards) - 编码标准
3. [提交规范](development/CONTRIBUTING.md#commit-messages) - 提交信息格式
4. [测试要求](development/CONTRIBUTING.md#testing) - 测试标准

### 我遇到了问题

1. [常见问题](setup/SETUP.md#troubleshooting) - 故障排查
2. [GitHub Issues](https://github.com/guancyxx/desktop_portal/issues) - 提交问题
3. [主项目文档](../../../docs/README.md) - DreamBuilder 文档

---

## 📚 文档类型说明

### Setup（安装配置）

**目标受众**: 所有用户  
**内容**: 安装步骤、配置指南、环境设置

### Development（开发文档）

**目标受众**: 开发者、贡献者  
**内容**: 实施指南、代码规范、贡献流程

### User Guide（用户指南）

**目标受众**: 最终用户  
**内容**: 使用教程、功能说明（规划中）

### API（API 文档）

**目标受众**: 开发者、集成者  
**内容**: API 参考、集成示例（规划中）

---

## 🔄 文档更新流程

### 何时更新文档？

- ✅ 添加新功能时
- ✅ 修改现有功能时
- ✅ 修复影响使用的 Bug 时
- ✅ 更新依赖时
- ✅ 变更配置时

### 如何更新文档？

1. 修改对应的文档文件
2. 更新 CHANGELOG.md
3. 如果是重大变更，更新主 README
4. 提交时注明 `docs: ...`

---

## 📊 文档完整性检查

### 已完成

- ✅ README.md - 项目说明
- ✅ SETUP.md - 安装指南
- ✅ IMPLEMENTATION.md - 实施指南
- ✅ CONTRIBUTING.md - 贡献指南
- ✅ CHANGELOG.md - 更新日志
- ✅ 文档索引和导航

### 待完善

- ⏳ User Guide - 用户使用手册
- ⏳ API Documentation - API 接口文档
- ⏳ FAQ - 常见问题集
- ⏳ Troubleshooting - 详细故障排查

---

## 🌐 相关资源

### 内部文档

- [DreamBuilder 主文档](../../../docs/README.md)
- [Submodules 管理](../../../docs/development/SUBMODULES.md)
- [Desktop Portal 配置总结](../../../docs/setup/desktop-portal-setup.md)

### 外部资源

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Ark Desktop](https://github.com/longguikeji/ark-desktop)

---

**文档版本**: v1.0.0  
**最后更新**: 2024-10-16

