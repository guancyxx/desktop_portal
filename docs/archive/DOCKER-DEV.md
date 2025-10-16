# Desktop Portal Docker 开发环境指南

## 概述

本指南介绍如何使用 Docker Compose 在开发环境中运行 Desktop Portal，包括热重载功能的配置和使用。

## 前置要求

- Docker Desktop 或 Docker Engine (>= 20.10)
- Docker Compose (>= 2.0)
- Git

## 快速开始

### 1. 启动开发环境

在项目根目录执行：

```bash
# 使用启动脚本（推荐）
bash scripts/dev-start.sh

# 或直接使用 docker-compose
docker-compose up -d --build
```

### 2. 访问应用

- **Desktop Portal**: http://localhost:3000
- **Keycloak 管理控制台**: http://localhost:8080
  - 用户名: admin
  - 密码: admin_password
- **Nginx 网关**: http://localhost

### 3. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看 Desktop Portal 日志
docker-compose logs -f desktop-portal

# 查看 Keycloak 日志
docker-compose logs -f keycloak
```

### 4. 停止服务

```bash
# 使用停止脚本
bash scripts/dev-stop.sh

# 或直接使用 docker-compose
docker-compose down
```

## 热重载功能

### 工作原理

开发环境配置了以下卷挂载以支持热重载：

```yaml
volumes:
  # 源代码挂载 - 实时同步代码变更
  - ./applications/desktop-portal:/app
  
  # node_modules 独立卷 - 避免本地和容器冲突
  - desktop-portal-node-modules:/app/node_modules
  
  # .next 构建缓存卷 - 提升重新编译速度
  - desktop-portal-next:/app/.next
```

### 代码变更流程

1. 在本地编辑器中修改代码
2. Docker 容器自动检测文件变更
3. Next.js 开发服务器自动重新编译
4. 浏览器自动刷新（通过 Fast Refresh）

### 验证热重载

1. 启动开发环境后，访问 http://localhost:3000
2. 修改任意组件文件（如 `app/page.tsx`）
3. 保存文件
4. 浏览器应在几秒内自动更新

## 开发工作流

### 安装新依赖

```bash
# 进入容器
docker-compose exec desktop-portal sh

# 安装依赖
pnpm add <package-name>

# 或安装开发依赖
pnpm add -D <package-name>

# 退出容器
exit
```

安装后，需要重启服务以应用变更：

```bash
docker-compose restart desktop-portal
```

### 运行脚本命令

```bash
# 运行 lint
docker-compose exec desktop-portal pnpm lint

# 运行类型检查
docker-compose exec desktop-portal pnpm type-check

# 运行格式化
docker-compose exec desktop-portal pnpm format
```

### 清理和重建

```bash
# 停止并删除容器（保留数据卷）
docker-compose down

# 删除容器和数据卷
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build
```

## 环境配置

### 环境变量文件

- `.env` - 根目录环境变量（Docker Compose 使用）
- `applications/desktop-portal/.env.development` - Portal 开发环境变量

### 关键配置项

```env
# Next.js 配置
NODE_ENV=development
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# Keycloak 配置（容器内网络）
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=dreambuilder
KEYCLOAK_CLIENT_ID=desktop-portal

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production

# Redis 配置（容器内网络）
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
```

## 服务架构

### 服务列表

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| desktop-portal | dreambuilder-desktop-portal | 3000 | Next.js 应用 |
| postgres | dreambuilder-postgres | 5432 | PostgreSQL 数据库 |
| keycloak | dreambuilder-keycloak | 8080 | Keycloak 认证服务 |
| redis | dreambuilder-redis | 6379 | Redis 缓存 |
| nginx | dreambuilder-nginx | 80, 443 | Nginx 网关 |

### 网络配置

所有服务都连接到 `dreambuilder-network` 桥接网络，可以通过服务名相互访问。

### 数据持久化

以下数据卷用于持久化存储：

- `postgres_data` - PostgreSQL 数据
- `redis_data` - Redis 数据
- `desktop-portal-node-modules` - Node.js 依赖
- `desktop-portal-next` - Next.js 构建缓存

## 故障排查

### 端口冲突

如果端口已被占用，修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "3001:3000"  # 将本地端口改为 3001
```

### 热重载不工作

1. 确认文件已保存
2. 检查容器日志：`docker-compose logs -f desktop-portal`
3. 尝试重启服务：`docker-compose restart desktop-portal`
4. 如果仍无效，重建容器：`docker-compose up -d --build desktop-portal`

### 依赖安装问题

如果遇到依赖安装问题：

```bash
# 删除 node_modules 卷
docker volume rm dreambuilder_desktop-portal-node-modules

# 重建容器
docker-compose up -d --build desktop-portal
```

### Keycloak 连接问题

确保：
1. Keycloak 容器健康：`docker-compose ps keycloak`
2. 容器内使用服务名：`http://keycloak:8080`
3. 浏览器访问使用 localhost：`http://localhost:8080`

### 查看容器内文件

```bash
# 进入容器
docker-compose exec desktop-portal sh

# 查看文件
ls -la /app

# 退出
exit
```

## 性能优化

### 加速构建

1. 使用 `.dockerignore` 排除不必要的文件
2. 使用命名卷存储 `node_modules` 和 `.next`
3. 合理配置 Next.js 缓存

### 减少资源占用

```yaml
# 在 docker-compose.yml 中添加资源限制
services:
  desktop-portal:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## 最佳实践

1. **定期清理** - 删除未使用的容器、镜像和卷
2. **版本锁定** - 使用固定的镜像版本标签
3. **环境隔离** - 开发、测试、生产使用不同的配置
4. **日志管理** - 配置日志轮转，避免日志文件过大
5. **安全配置** - 生产环境使用强密码和密钥

## 相关文档

- [项目设置指南](../setup/SETUP.md)
- [实现详情](./IMPLEMENTATION.md)
- [贡献指南](./CONTRIBUTING.md)

## 获取帮助

如遇问题，请：
1. 查看日志：`docker-compose logs -f`
2. 检查服务状态：`docker-compose ps`
3. 查阅 Docker 和 Next.js 官方文档
4. 提交 Issue 到项目仓库

