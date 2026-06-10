# AI Creator Platform

面向内容创作者的 AI 写作工作台：富文本编辑、提示词库、素材管理、内容审核，以及带推荐算法的信息流分发。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Next.js 16（App Router）、React 19、TypeScript |
| 样式 | Tailwind CSS |
| 认证 | Auth.js v5（Credentials + JWT 会话） |
| 数据库 | PostgreSQL 17、Prisma 7 |
| 缓存 | Redis 8 |
| 对象存储 | 本地 `public/uploads/`（开发）/ Vercel Blob（生产） |
| 编辑器 | TipTap |
| AI | 火山方舟 Ark（文本生成、AI 配图、内容审核） |
| 校验 | Zod |
| 本地基础设施 | Docker Compose |

## 功能简介

| 模块 | 说明 |
| --- | --- |
| 用户认证 | 邮箱 / 手机号 + 密码登录注册 |
| 编辑器 | TipTap 富文本，草稿自动保存，封面与标签 |
| AI 助手 | 文本续写 / 改写、AI 配图（需配置 Ark） |
| 提示词库 | 分类浏览、收藏、一键插入编辑器 |
| 素材库 | 图片上传与 AI 生成素材 |
| 内容发布 | 草稿发布，发布前 AI 审核与质量评分 |
| Feed 流 | 首页推荐、热点榜、爆文榜 |
| 互动 | 点赞、浏览统计、作者主页 |

## 环境要求

- Node.js 20+
- npm
- Docker（本地 PostgreSQL / Redis）

---

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

至少填写：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_creator_platform"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="请替换为足够长的随机字符串"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
```

> 亦兼容 `NEXTAUTH_SECRET` / `NEXTAUTH_URL`。若 dev 端口非 3000，请同步修改 `AUTH_URL`。

AI 功能（可选，编辑器续写 / 配图 / 发布审核需要）：

```env
ARK_API_KEY=""
ARK_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
ARK_MODEL=""
ARK_IMAGE_MODEL=""
```

本地图片上传无需配置 `BLOB_READ_WRITE_TOKEN`，会自动写入 `public/uploads/`。

### 3. 启动数据库

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

### 开发管理员

执行 `npm run db:seed` 后可用以下账号登录 [/login](http://localhost:3000/login)：

| 项目 | 默认值 |
| --- | --- |
| 邮箱 | `admin@localhost` |
| 密码 | `Admin12345` |

可通过 `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD` / `DEV_ADMIN_NAME` 覆盖 seed 凭据。

### 测试数据（可选）

```bash
npm run db:seed:test-users      # 5 个模拟创作者账号
npm run db:seed:test-posts      # 每用户 5 篇已发布文章 + 模拟审核数据
npm run db:seed:official-prompts
```

测试用户凭据写入 `local/test-accounts/accounts.txt`（已 gitignore，勿提交）。

---

## 线上部署（Vercel）

推荐架构：

| 组件 | 服务 |
| --- | --- |
| Web | [Vercel](https://vercel.com) |
| PostgreSQL | [Neon](https://neon.tech) |
| Redis | [Upstash](https://upstash.com) |
| 图片存储 | Vercel Blob（Public） |

### 部署步骤概览

1. 将代码 push 到 GitHub，在 Vercel Import 项目（分支 `main`）
2. 创建 Neon / Upstash / Vercel Blob，并 Connect Blob 到项目（勾选 read-write token）
3. 在 Vercel 配置环境变量（见下表），Redeploy
4. 本地临时将 `.env` 的 `DATABASE_URL` 指向 Neon，执行初始化（见「远程数据库初始化」）
5. 验收：`/api/health`、`/login`、素材上传、AI 功能

### 生产环境变量

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | Neon 连接串（`?sslmode=require`，勿加 `channel_binding=require`） |
| `REDIS_URL` | Upstash Redis URL（建议 `rediss://`） |
| `AUTH_SECRET` | 随机 32+ 字符 |
| `AUTH_URL` | 线上 URL，如 `https://xxx.vercel.app`（须与访问域名完全一致） |
| `AUTH_TRUST_HOST` | `true` |
| `CRON_SECRET` | Cron 接口鉴权密钥 |
| `BLOB_READ_WRITE_TOKEN` | Connect Blob 后自动注入 |
| `DEV_ADMIN_*` | seed 时写入的管理员（生产请用强密码） |
| `ARK_*` | AI 功能（演示 / 审核需要） |

生成随机密钥：

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 远程数据库初始化

在**本地**将 `DATABASE_URL` 临时改为 Neon 连接串后执行：

```bash
npm run db:generate
npm run db:push:remote    # Windows 连 Neon 时若 db:push 报 P1001，用此命令
npm run db:seed
npm run db:seed:test-users
npm run db:seed:test-posts
npm run db:seed:official-prompts
```

完成后将本地 `.env` 的 `DATABASE_URL` 改回 `localhost`。

> `db:push:remote` 通过 `pg` 客户端同步 schema，适用于 Prisma `db push` 无法连接 Neon 的环境。

### Cron 说明

`vercel.json` 配置了 Feed 分数定时刷新（`/api/cron/refresh-feed-scores`）。Vercel Hobby 计划为**每天 1 次**；演示前可手动触发：

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<你的域名>/api/cron/refresh-feed-scores
```

### 图片存储

- **本地**：未配置 `BLOB_READ_WRITE_TOKEN` 时，图片写入 `public/uploads/`
- **Vercel**：配置 Blob 后，图片上传至 Vercel Blob，返回 HTTPS 公开 URL

---

## 常用命令

### 开发与构建

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器（需先 `build`） |
| `npm run lint` | ESLint 检查 |

### 数据库与 Docker

| 命令 | 说明 |
| --- | --- |
| `npm run docker:up` | 启动 PostgreSQL / Redis |
| `npm run docker:down` | 停止 Docker 服务 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 同步 Schema 到数据库（本地） |
| `npm run db:push:remote` | 经 pg 同步 Schema 到远程库 |
| `npm run db:migrate` | 执行数据库迁移 |
| `npm run db:seed` | 写入管理员账号 |
| `npm run db:studio` | 打开 Prisma Studio |

### 测试数据与运维

| 命令 | 说明 |
| --- | --- |
| `npm run db:seed:test-users` | 创建 5 个测试创作者 |
| `npm run db:seed:test-posts` | 写入测试文章与模拟审核记录 |
| `npm run db:seed:official-prompts` | 写入官方提示词模板 |
| `npm run db:seed:prompts` | 写入测试提示词 |
| `npm run db:backfill:feed-scores` | 回填 Feed 预计算分数 |
| `npm run test:review` | 内容审核评估脚本 |
