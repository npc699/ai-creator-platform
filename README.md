# AI Creator Platform

基于 Next.js 16 的 AI 创作者工作台，支持富文本写作、提示词库、素材管理、内容审核与 Feed 推荐。

**技术栈：** Next.js App Router · React 19 · Auth.js v5 · Prisma · PostgreSQL · Redis · TipTap · 火山方舟（Ark）

## 功能概览

| 模块 | 说明 |
|------|------|
| 用户认证 | 邮箱 / 手机号 + 密码登录注册，JWT 会话，`proxy.ts` 路由守卫 |
| 编辑器 | TipTap 富文本，草稿自动保存（服务端 + IndexedDB），封面与标签 |
| AI 助手 | 火山方舟文本生成与 AI 配图（需配置 `ARK_*`） |
| 提示词库 | 分类管理、收藏、一键插入编辑器 |
| 素材库 | 图片上传（`public/uploads`）与 AI 生成素材 |
| 内容发布 | 草稿 → 发布，发布前 AI 审核与质量评分 |
| Feed 流 | 首页推荐、热点榜、爆文榜，Redis 缓存与定时分数刷新 |
| 互动 | 文章点赞、浏览统计、作者主页 |

## 项目结构

```text
app/
  (auth)/          登录、注册
  (main)/          主应用：首页 Feed、草稿、已发布、素材、提示词、文章阅读、用户主页
  (editor)/        全屏编辑器
  api/             REST API（认证、草稿、文章、Feed、AI、审核、Cron 等）
components/
  layout/          页面布局与 Feed 列表
  editor/          编辑器与 AI 助手
  ui/              通用 UI 组件
lib/
  auth/            Auth.js 配置与会话
  db/              Prisma、Redis 客户端
  posts/ drafts/ feed/ prompts/ assets/ ai/ review/  各业务域逻辑
prisma/            Schema、迁移与默认 seed（seed.ts）
docs/              认证、审核规则、Feed 性能验收等文档
scripts/           开发灌数、回填与校验（scripts/db/…）
proxy.ts           未登录路由守卫与 callbackUrl 写入
```

## 环境要求

- Node.js 20+
- npm
- Docker（本地 PostgreSQL / Redis）

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

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

**必填项：**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_creator_platform"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="请替换为足够长的随机字符串"
NEXTAUTH_URL="http://localhost:3000"
```

> 代码同时兼容 `AUTH_SECRET` / `AUTH_URL` 别名，与 `NEXTAUTH_*` 二选一即可。

**AI 功能（可选，未配置时编辑器 AI 相关接口不可用）：**

```env
ARK_API_KEY=""
ARK_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
ARK_MODEL=""          # 文本生成模型
ARK_IMAGE_MODEL=""    # 图片生成模型
```

**开发管理员（可选，用于 `npm run db:seed`）：**

```env
DEV_ADMIN_EMAIL="admin@localhost"
DEV_ADMIN_PASSWORD="Admin12345"
DEV_ADMIN_NAME="管理员"
```

### 3. 启动数据库

```bash
npm run docker:up
```

Docker 会启动 PostgreSQL 17（端口 5432）与 Redis 8（端口 6379）。

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

若 3000 端口被占用，Next.js 会自动切换端口（如 `3001`）。请同步修改 `.env` 中的 `NEXTAUTH_URL`，否则登录可能出现 `UntrustedHost` 错误。

## 开发管理员账号

执行 `npm run db:seed` 后创建默认管理员：

| 项目 | 默认值 |
|------|--------|
| 邮箱 | `admin@localhost` |
| 密码 | `Admin12345` |
| 角色 | `ADMIN` |

在 [/login](http://localhost:3000/login) 登录。若仍显示旧用户信息，请清除浏览器 Cookie 后重新登录。

## 常用命令

### 开发与构建

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器（需先 `build`） |
| `npm run lint` | ESLint 检查 |

### 数据库

| 命令 | 说明 |
|------|------|
| `npm run docker:up` | 启动 PostgreSQL / Redis |
| `npm run docker:down` | 停止 Docker 服务 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 同步 Schema 到数据库（开发） |
| `npm run db:migrate` | 执行迁移（`prisma migrate dev`） |
| `npm run db:seed` | 写入开发管理员账号 |
| `npm run db:studio` | 打开 Prisma Studio |

### 测试数据与运维

| 命令 | 说明 |
|------|------|
| `npm run db:seed:test-users` | 创建 5 个测试用户并写入 `local/test-accounts/` |
| `npm run db:seed:prompts` | 为各用户写入测试 Prompt（须先 `db:seed`） |
| `npm run db:seed:official-prompts` | 写入官方 Prompt 模板（须先 `db:seed`） |
| `npm run db:seed:test-posts` | 批量写入测试文章（依赖 `local/test-accounts/accounts.json`） |
| `npm run db:backfill:test-quality` | 回填测试文章质量分 |
| `npm run db:backfill:feed-scores` | 回填 Feed 预计算分数 |
| `npm run feed:score-sanity` | Feed 分数一致性校验 |
| `npm run test:review` | 内容审核回归测试（需 `TEST_AUTH_COOKIE`） |

## 环境变量参考

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 |
| `REDIS_URL` | ✅ | Redis 连接串 |
| `NEXTAUTH_SECRET` | ✅ | Auth.js 签名密钥（可用 `AUTH_SECRET`） |
| `NEXTAUTH_URL` | ✅ | 应用对外 URL（可用 `AUTH_URL`） |
| `ARK_API_KEY` | — | 火山方舟 API Key |
| `ARK_BASE_URL` | — | 方舟 API 地址，默认北京区域 |
| `ARK_MODEL` | — | 文本生成模型 ID |
| `ARK_IMAGE_MODEL` | — | 图片生成模型 ID |
| `DEV_ADMIN_*` | — | 开发种子管理员信息 |
| `CRON_SECRET` | 生产建议 | Feed 分数定时刷新接口的 Bearer Token |
| `TEST_AUTH_COOKIE` | — | 审核测试脚本用的会话 Cookie |
| `TEST_BASE_URL` | — | 审核测试目标地址，默认 `http://localhost:3000` |

## 健康检查

```text
GET /api/health
```

正常返回 `200`，响应体包含 `database` 与 `redis` 状态；依赖异常时返回 `503`。

## 生产部署

```bash
npm run build
npm run start
```

部署到 Vercel 时，`vercel.json` 已配置 Cron：每 10 分钟调用 `/api/cron/refresh-feed-scores` 刷新 Feed 预计算分数。生产环境建议设置 `CRON_SECRET`，接口会校验 `Authorization: Bearer <CRON_SECRET>`。

上传文件默认写入 `public/uploads/`，生产环境如需持久化存储，需自行对接对象存储并调整 `lib/assets/`。

## 文档

| 文档 | 内容 |
|------|------|
| [docs/auth.md](docs/auth.md) | 认证模块：Auth.js、JWT 会话、路由守卫、安全回跳 |
| [docs/review-rules.md](docs/review-rules.md) | 内容审核类别、风险等级与质量评分规则 |
| [docs/feed-lighthouse.md](docs/feed-lighthouse.md) | Feed 榜单页 Lighthouse 性能验收指南 |

## 主要路由

| 路径 | 说明 |
|------|------|
| `/` | 首页 Feed（推荐 / 热点 / 爆文） |
| `/login` `/register` | 登录 / 注册 |
| `/editor` `/editor/[id]` | 新建 / 编辑文章 |
| `/drafts` | 草稿箱 |
| `/published` | 已发布 |
| `/assets` | 素材库 |
| `/prompts` | 提示词库 |
| `/posts/[id]` | 文章阅读 |
| `/users/[id]` | 用户主页 |
