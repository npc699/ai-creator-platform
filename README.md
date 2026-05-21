# AI Creator Platform

基于 Next.js 16、Auth.js、Prisma、PostgreSQL 和 Redis 的创作者平台。

## 环境要求

- Node.js 20+
- npm
- Docker（用于本地 PostgreSQL / Redis）

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制示例文件并填写本地配置：

```bash
cp .env.example .env
```

`.env` 至少需要：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_creator_platform"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="请替换为足够长的随机字符串"
AUTH_URL="http://localhost:3000"
```

可选：开发管理员账号（用于 `npm run db:seed`）：

```env
DEV_ADMIN_EMAIL="admin@localhost"
DEV_ADMIN_PASSWORD="Admin12345"
DEV_ADMIN_NAME="管理员"
```

### 3. 启动数据库服务

```bash
npm run docker:up
```

### 4. 初始化数据库

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)。

若 3000 端口被占用，Next.js 会自动切换到其他端口（如 `3001`）。此时请同步修改 `.env` 中的 `AUTH_URL`，否则登录可能出现 `UntrustedHost` 错误。

## 开发管理员账号

执行 `npm run db:seed` 后会创建默认管理员：

| 项目 | 默认值 |
|------|--------|
| 邮箱 | `admin@localhost` |
| 密码 | `Admin12345` |
| 角色 | `ADMIN` |

在 [http://localhost:3000/login](http://localhost:3000/login) 登录。若仍显示旧用户信息，请清除浏览器 Cookie 后重新登录。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器（需先 `build`） |
| `npm run lint` | 代码检查 |
| `npm run docker:up` | 启动 PostgreSQL / Redis |
| `npm run docker:down` | 停止 Docker 服务 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 同步数据库 Schema |
| `npm run db:seed` | 写入开发管理员账号 |
| `npm run db:studio` | 打开 Prisma Studio |

## 健康检查

开发服务器启动后，可访问：

```text
GET http://localhost:3000/api/health
```

正常时返回 `200`，并包含 `database` 与 `redis` 状态。

## 生产环境运行

```bash
npm run build
npm run start
```

生产环境同样需要配置 `DATABASE_URL`、`REDIS_URL`、`AUTH_SECRET`、`AUTH_URL` 等环境变量。

## 文档

- 认证模块设计与实现：[docs/auth.md](docs/auth.md)
