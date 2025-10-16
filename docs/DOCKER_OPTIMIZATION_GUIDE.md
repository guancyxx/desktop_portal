# Docker 容器环境优化应用指南

本指南说明如何在 Docker 容器环境中应用代码优化。

---

## 🐳 容器架构

项目使用 `docker-compose` 管理多个服务：

```yaml
services:
  - postgres        # 数据库
  - keycloak        # 认证服务
  - redis           # 缓存
  - desktop-portal  # Next.js 应用
  - nginx           # API 网关
```

---

## 📦 依赖安装

### 方式 1：重启容器（推荐）

修改 `package.json` 后，重启容器自动安装依赖：

```bash
# 停止并重新创建容器
docker-compose up -d --force-recreate desktop-portal

# 或者完全重启服务
docker-compose restart desktop-portal
```

### 方式 2：容器内手动安装

```bash
# 进入容器
docker-compose exec desktop-portal sh

# 安装依赖
pnpm install

# 退出容器
exit
```

### 方式 3：完全重建

如果遇到问题，完全重建容器：

```bash
# 停止并删除容器
docker-compose down

# 重建镜像并启动
docker-compose up -d --build desktop-portal
```

---

## 🔄 热重载

项目配置了文件监听以支持热重载：

```yaml
# docker-compose.yml
environment:
  CHOKIDAR_USEPOLLING: "1"
  WATCHPACK_POLLING: "true"
  WATCHPACK_POLLING_INTERVAL: "300"
  NEXT_WEBPACK_USEPOLLING: "1"
```

### 热重载不工作？

1. **检查卷挂载**
   ```bash
   docker-compose config
   # 确认 volumes 配置正确
   ```

2. **检查文件权限**
   ```bash
   # 在容器中
   docker-compose exec desktop-portal ls -la /app
   ```

3. **重启服务**
   ```bash
   docker-compose restart desktop-portal
   ```

---

## 📊 查看容器日志

### 实时日志

```bash
# 查看 desktop-portal 日志
docker-compose logs -f desktop-portal

# 查看所有服务日志
docker-compose logs -f

# 查看最近 100 行
docker-compose logs --tail=100 desktop-portal
```

### 常见日志信息

**正常启动**:
```
desktop-portal | ▲ Next.js 14.0.4
desktop-portal | - Local:        http://localhost:3000
desktop-portal | ✓ Ready in 2.5s
```

**依赖安装**:
```
desktop-portal | Packages: +4
desktop-portal | Progress: resolved 1, reused 0, downloaded 4, added 4
```

**TypeScript 错误**:
```
desktop-portal | Type error: Property 'xxx' does not exist on type 'yyy'
```

---

## 🛠️ 开发工作流

### 1. 修改代码

在宿主机上编辑文件：

```bash
# 代码自动挂载到容器
./applications/desktop-portal/
```

### 2. 查看变化

浏览器自动刷新：
```
http://localhost:3000
```

### 3. 调试

**DevTools**:
- React Query DevTools: 自动显示在页面右下角
- Zustand DevTools: 浏览器扩展（Redux DevTools）

**控制台**:
```javascript
// 查看性能报告
performanceMonitor.exportReport()

// 查看 store 状态
useDesktopStore.getState()
```

### 4. 类型检查

```bash
# 在容器中运行
docker-compose exec desktop-portal pnpm type-check

# 或在宿主机（如果安装了 pnpm）
cd applications/desktop-portal
pnpm type-check
```

---

## 🔍 故障排查

### 问题 1: 容器启动失败

**症状**: `docker-compose up` 失败

**解决方案**:
```bash
# 查看详细错误
docker-compose logs desktop-portal

# 检查端口占用
netstat -ano | findstr :3000

# 清理并重启
docker-compose down
docker-compose up -d
```

### 问题 2: 依赖安装失败

**症状**: `pnpm install` 报错

**解决方案**:
```bash
# 删除 node_modules 卷
docker-compose down -v
docker volume rm dreambuilder_desktop-portal-node-modules

# 重建
docker-compose up -d --build desktop-portal
```

### 问题 3: 热重载不工作

**症状**: 修改代码后页面不更新

**解决方案**:
```bash
# 1. 检查环境变量
docker-compose exec desktop-portal env | grep POLLING

# 2. 重启服务
docker-compose restart desktop-portal

# 3. 检查文件权限
docker-compose exec desktop-portal ls -la /app

# 4. 如果还不行，重建容器
docker-compose up -d --force-recreate desktop-portal
```

### 问题 4: TypeScript 错误

**症状**: 严格模式导致类型错误

**解决方案**:
```bash
# 1. 查看具体错误
docker-compose exec desktop-portal pnpm type-check

# 2. 临时禁用严格检查（不推荐）
# 在 tsconfig.json 中设置 "strict": false

# 3. 修复类型错误（推荐）
# 根据错误信息逐个修复
```

### 问题 5: 内存不足

**症状**: Next.js 构建失败，内存错误

**解决方案**:
```bash
# 增加 Docker 内存限制
# Docker Desktop > Settings > Resources > Memory

# 或在 docker-compose.yml 中限制内存
services:
  desktop-portal:
    mem_limit: 2g
```

---

## 📈 性能优化技巧

### 1. 使用 .dockerignore

确保 `.dockerignore` 排除不必要的文件：

```
node_modules
.next
.git
*.log
.env.local
```

### 2. 多阶段构建（生产环境）

`Dockerfile` 使用多阶段构建：

```dockerfile
FROM node:18-alpine AS deps
# 安装依赖

FROM node:18-alpine AS builder
# 构建应用

FROM node:18-alpine AS runner
# 运行应用
```

### 3. 缓存优化

利用 Docker 层缓存：

```dockerfile
# 先复制 package.json（不常变）
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# 再复制源代码（常变）
COPY . .
```

### 4. 卷挂载优化

使用命名卷存储 node_modules：

```yaml
volumes:
  - ./applications/desktop-portal:/app
  - desktop-portal-node-modules:/app/node_modules  # 避免冲突
  - desktop-portal-next:/app/.next                  # 缓存构建
```

---

## 🚀 部署流程

### 开发环境

```bash
# 启动所有服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f desktop-portal
```

### 生产环境

```bash
# 使用生产 Dockerfile
docker-compose -f docker-compose.prod.yml up -d

# 或者手动构建
docker build -t desktop-portal:latest -f Dockerfile .
docker run -p 3000:3000 desktop-portal:latest
```

---

## 📝 常用命令速查

### 容器管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart desktop-portal

# 删除容器
docker-compose down

# 删除容器和卷
docker-compose down -v

# 查看状态
docker-compose ps

# 查看资源使用
docker stats
```

### 日志和调试

```bash
# 查看日志
docker-compose logs -f desktop-portal

# 进入容器
docker-compose exec desktop-portal sh

# 执行命令
docker-compose exec desktop-portal pnpm type-check
docker-compose exec desktop-portal pnpm lint

# 复制文件
docker cp desktop-portal:/app/file.txt ./
```

### 清理和维护

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理所有未使用资源
docker system prune -a --volumes

# 查看磁盘使用
docker system df
```

---

## 🔐 环境变量

### 开发环境

在 `docker-compose.yml` 中配置：

```yaml
environment:
  NODE_ENV: development
  NEXT_PUBLIC_API_URL: http://localhost:3000
  KEYCLOAK_URL: http://keycloak:8080
  NEXT_PUBLIC_KEYCLOAK_URL: http://localhost:8080
```

### 生产环境

使用 `.env` 文件：

```bash
# .env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
```

---

## 📚 相关文档

- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Next.js Docker 部署](https://nextjs.org/docs/deployment#docker-image)
- [优化实施指南](./OPTIMIZATION_IMPLEMENTATION.md)
- [优化执行总结](./OPTIMIZATION_SUMMARY.md)

---

## 💡 最佳实践

1. **开发环境**: 使用卷挂载 + 热重载
2. **生产环境**: 使用多阶段构建 + 最小化镜像
3. **依赖管理**: 使用命名卷避免冲突
4. **日志查看**: 定期检查容器日志
5. **资源限制**: 设置合理的 CPU/内存限制
6. **定期清理**: 清理未使用的镜像和卷

---

**文档版本**: v1.0  
**最后更新**: 2025-10-16  
**适用环境**: Docker Compose v3.8+

