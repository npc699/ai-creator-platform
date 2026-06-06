# AI Creator Platform

基于 Next.js 16 的 AI 创作者工作台，支持富文本写作、提示词库、素材管理、内容审核与 Feed 推荐。

**技术栈：** Next.js App Router · React 19 · Auth.js v5 · Prisma · PostgreSQL · Redis · TipTap · 火山方舟（Ark）

## 功能概览

| 模块     | 说明                                                          |
| -------- | ------------------------------------------------------------- |
| 用户认证 | 邮箱 / 手机号 + 密码登录注册，JWT 会话，`proxy.ts` 路由守卫   |
| 编辑器   | TipTap 富文本，草稿自动保存（服务端 + IndexedDB），封面与标签 |
| AI 助手  | 火山方舟文本生成与 AI 配图（需配置 `ARK_*`）                  |
| 提示词库 | 分类管理、收藏、一键插入编辑器                                |
| 素材库   | 图片上传（`public/uploads`）与 AI 生成素材                    |
| 内容发布 | 草稿 → 发布，发布前 AI 审核与质量评分                         |
| Feed 流  | 首页推荐、热点榜、爆文榜，Redis 缓存与定时分数刷新            |
| 互动     | 文章点赞、浏览统计、作者主页                                  |

## 架构概览

应用按 **路由组 → 页面编排 → 领域组件 → 通用基元 → lib 业务逻辑** 分层：

```text
app/(main)/page.tsx          数据拉取、权限、URL 参数
       │
       ├─ components/pages/            页面级编排（对应 app/(main) 路由）
       ├─ components/feed/             首页 Feed 无限滚动
       ├─ components/reader/        文章阅读 UI
       └─ components/layout/         Dashboard 外壳

lib/posts/  lib/feed/  lib/drafts/  …   服务端查询、算法、校验（无 React）
```

### `components/` 模块划分

| 目录 | 职责 | 典型消费者 |
| ---- | ---- | ---------- |
| `layout/` | 应用布局壳：顶栏、侧栏、右栏、`DashboardShell` | `app/(main)/layout` |
| `ui/` | 与业务无关的通用 UI（Panel、Tab、Dialog、EmptyState） | 各页面与领域组件 |
| `article/` | 文章列表行、榜单变体、badge、点赞、滚动恢复、空状态 | Feed、草稿、已发布、阅读页 |
| `feed/` | 首页 Feed 专属：面板壳、无限滚动、频道 Header | `pages/home` |
| `reader/` | 文章阅读页：顶栏、meta 区（不含正文 HTML） | `app/(main)/posts/[id]` |
| `editor/` | 编辑器工作区：Shell、Context、TipTap、侧栏 AI/Prompt/素材 | `app/(editor)/editor/*` |
| `media/` | 图片 / 素材 UI 基元（accordion、AI 生图 hook 等） | `editor/`、`assets/` |
| `pages/` | `(main)` 路由页面编排：组合领域组件，不写 Prisma | `app/(main)/*` |
| `assets/` | 素材管理页：网格、添加面板 | `pages/assets` |
| `author/` | 作者头像、资料链接、主页 Header/统计、资料编辑 | 列表行、阅读页、用户主页 |
| `prompts/` | 提示词卡片、筛选 Tab、表单字段/弹窗、页顶 Header | 提示词库页、编辑器侧栏 |

**依赖约定（避免循环引用）：**

```text
layout / ui          →  不依赖 article、feed、editor 等业务组件
article / reader     →  可依赖 ui、author；不依赖 feed、editor
feed                 →  依赖 article、ui；不依赖 editor
editor               →  依赖 media、ui、prompts、article（点赞 hook 等）
media                →  仅依赖 lib；不依赖 editor、assets
assets               →  依赖 media、ui；不依赖 editor
pages                →  组合 article、ui、assets、author、prompts、feed（仅 home）；不依赖 editor
```

各模块通过 `index.ts` 导出公开 API；迁移期部分旧名（如 `FeedListItem`、`PostReaderHeader`）保留为 `@deprecated` alias。

### `components/` 目录结构

```text
components/
├── layout/                 # Dashboard 壳
│   ├── dashboard/          DashboardShell
│   ├── header/             顶栏
│   ├── sidebar/            主导航
│   ├── rail/               右栏（创作统计、热榜）
│   ├── user/               用户菜单
│   ├── navigation/         编辑器入口、开始创作
│   └── chrome/             回到顶部等
│
├── ui/                     # 通用 UI 基元
│   ├── panel/              ContentPanel、SectionHeader
│   ├── nav/                TabNav
│   ├── dialog/             DialogShell、ConfirmDialog
│   └── empty-state/
│
├── article/                # 跨场景文章列表 / 卡片 / 元信息
│   ├── list-item.tsx       列表行主体
│   ├── list-presets.tsx    Home/Hot/Viral 变体、ArticleList/Row
│   ├── badges.tsx          MetaBadges、榜单装饰
│   ├── cover.tsx           列表封面
│   ├── list-scroll.tsx     滚动恢复
│   ├── use-article-like.ts
│   ├── published-filter-nav.tsx
│   └── empty-state-link.tsx
│
├── feed/                   # 首页 Feed 专属
│   ├── panel.tsx           FeedPanel（ContentPanel + Header）
│   ├── home-infinite-list.tsx
│   ├── sort-nav.tsx        （内部）
│   └── channel-header.tsx  （内部）
│
├── reader/                 # 文章阅读页
│   ├── header.tsx          顶栏 + 作者操作
│   └── article-meta.tsx    标题 / 作者 / 指标 / 审核横幅
│
├── editor/                 # 编辑器工作区
│   ├── editor-context.tsx  全局状态、草稿、AI 流
│   ├── editor-shell.tsx    布局壳 + 发布 / 保存
│   ├── workspace/          TipTap、Toolbar、extensions
│   ├── sidebar/            AI / Prompt / 素材侧栏
│   ├── cover/              封面选择与弹窗
│   ├── tags/               标签编辑
│   ├── draft/              草稿箱切换
│   └── image/              插入图片弹窗
│
├── media/                  # 编辑器与素材库共用
│   ├── copy.ts
│   ├── accordion.tsx
│   ├── resolution-picker.tsx
│   └── use-ai-image-generate.ts
│
├── pages/                  # (main) 页面级编排
│   ├── index.ts
│   ├── home/home-page.tsx
│   ├── published/published-page.tsx
│   ├── drafts/drafts-page.tsx
│   ├── assets/assets-page.tsx
│   ├── prompts/prompts-page.tsx
│   └── users/profile-page.tsx
├── assets/                 # 素材管理页
├── author/                 # 作者展示组件
│   ├── index.ts
│   ├── avatar.tsx          # AuthorAvatar
│   ├── profile-link.tsx    # AuthorProfileLink
│   ├── profile-header.tsx  # AuthorProfileHeader
│   ├── profile-edit.tsx    # AuthorProfileEditFields + Dialog + Section
│   └── stats-bar.tsx       # AuthorProfileStatsBar
└── prompts/                # 提示词 UI 组件
    ├── index.ts
    ├── card.tsx            # PromptCard（含详情 modal）
    ├── form.tsx            # PromptFormFields + PromptFormDialog
    ├── filter-tabs.tsx     # PromptFilterTabs（link / button）
    └── filters-header.tsx  # PromptFiltersHeader
```

### `lib/` 业务逻辑

React 组件不直接写 SQL / 复杂业务规则；查询、评分、校验放在 `lib/`：

```text
lib/
├── auth/          认证：Auth.js、会话、安全回跳
├── db/            Prisma、Redis 客户端
├── validations/   REST API 请求 Zod
├── posts/         文章列表 DTO、已发布、阅读导航、指标
├── drafts/        草稿查询与云/本地合并策略
├── feed/          频道参数、首页查询、算法、缓存、侧栏热榜
├── prompts/       提示词分类、列表、URL 参数
├── assets/        素材序列化、MIME、存储
├── editor/        编辑器导航与正文图片
├── ai/            火山方舟文本 / 配图
├── review/        内容审核与质量分
├── users/         作者主页、创作者统计
├── client/        浏览器 fetch 与 IndexedDB
├── utils/         cn、品牌 token、认证页样式
├── generated/     Prisma Client（自动生成，勿改）
└── README.md      模块表、依赖约定、导入示例
```

详见 [lib/README.md](lib/README.md)。

## 项目结构

```text
app/
  (auth)/          登录、注册
  (main)/          主应用：Feed、草稿、已发布、素材、提示词、阅读、用户主页
  (editor)/        全屏编辑器（EditorShell + TipTapEditor）
  api/             REST API（认证、草稿、文章、Feed、AI、审核、Cron 等）
components/        见上文「components/ 模块划分」
lib/               见上文「lib/ 业务逻辑」
prisma/            Schema、迁移与 seed
docs/              认证、审核、API、Feed 性能等文档
scripts/           开发灌数、回填与校验
proxy.ts           未登录路由守卫与 callbackUrl
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

| 项目 | 默认值            |
| ---- | ----------------- |
| 邮箱 | `admin@localhost` |
| 密码 | `Admin12345`      |
| 角色 | `ADMIN`           |

在 [/login](http://localhost:3000/login) 登录。若仍显示旧用户信息，请清除浏览器 Cookie 后重新登录。

## 常用命令

### 开发与构建

| 命令            | 说明                           |
| --------------- | ------------------------------ |
| `npm run dev`   | 启动开发服务器                 |
| `npm run build` | 生产构建                       |
| `npm run start` | 启动生产服务器（需先 `build`） |
| `npm run lint`  | ESLint 检查                    |

### 数据库

| 命令                  | 说明                             |
| --------------------- | -------------------------------- |
| `npm run docker:up`   | 启动 PostgreSQL / Redis          |
| `npm run docker:down` | 停止 Docker 服务                 |
| `npm run db:generate` | 生成 Prisma Client               |
| `npm run db:push`     | 同步 Schema 到数据库（开发）     |
| `npm run db:migrate`  | 执行迁移（`prisma migrate dev`） |
| `npm run db:seed`     | 写入开发管理员账号               |
| `npm run db:studio`   | 打开 Prisma Studio               |

### 测试数据与运维

| 命令                               | 说明                                                         |
| ---------------------------------- | ------------------------------------------------------------ |
| `npm run db:seed:test-users`       | 创建 5 个测试用户并写入 `local/test-accounts/`               |
| `npm run db:seed:prompts`          | 为各用户写入测试 Prompt（须先 `db:seed`）                    |
| `npm run db:seed:official-prompts` | 写入官方 Prompt 模板（须先 `db:seed`）                       |
| `npm run db:seed:test-posts`       | 批量写入测试文章（依赖 `local/test-accounts/accounts.json`） |
| `npm run db:backfill:test-quality` | 回填测试文章质量分                                           |
| `npm run db:backfill:feed-scores`  | 回填 Feed 预计算分数                                         |
| `npm run feed:score-sanity`        | Feed 分数一致性校验                                          |
| `npm run test:review`              | 内容审核回归测试（需 `TEST_AUTH_COOKIE`）                    |

## 环境变量参考

| 变量               | 必填     | 说明                                           |
| ------------------ | -------- | ---------------------------------------------- |
| `DATABASE_URL`     | ✅       | PostgreSQL 连接串                              |
| `REDIS_URL`        | ✅       | Redis 连接串                                   |
| `NEXTAUTH_SECRET`  | ✅       | Auth.js 签名密钥（可用 `AUTH_SECRET`）         |
| `NEXTAUTH_URL`     | ✅       | 应用对外 URL（可用 `AUTH_URL`）                |
| `ARK_API_KEY`      | —        | 火山方舟 API Key                               |
| `ARK_BASE_URL`     | —        | 方舟 API 地址，默认北京区域                    |
| `ARK_MODEL`        | —        | 文本生成模型 ID                                |
| `ARK_IMAGE_MODEL`  | —        | 图片生成模型 ID                                |
| `DEV_ADMIN_*`      | —        | 开发种子管理员信息                             |
| `CRON_SECRET`      | 生产建议 | Feed 分数定时刷新接口的 Bearer Token           |
| `TEST_AUTH_COOKIE` | —        | 审核测试脚本用的会话 Cookie                    |
| `TEST_BASE_URL`    | —        | 审核测试目标地址，默认 `http://localhost:3000` |

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

| 文档                                               | 内容                                            |
| -------------------------------------------------- | ----------------------------------------------- |
| [docs/auth.md](docs/auth.md)                       | 认证模块：Auth.js、JWT 会话、路由守卫、安全回跳 |
| [docs/api.md](docs/api.md)                         | REST API 路由说明（27 个接口）                  |
| [docs/review-rules.md](docs/review-rules.md)       | 内容审核类别、风险等级与质量评分规则            |
| [docs/feed-lighthouse.md](docs/feed-lighthouse.md) | Feed 榜单页 Lighthouse 性能验收指南             |
| [lib/README.md](lib/README.md)                     | `lib/` 目录与导入约定                           |

## 主要路由

| 路径                     | 说明                            |
| ------------------------ | ------------------------------- |
| `/`                      | 首页 Feed（推荐 / 热点 / 爆文） |
| `/login` `/register`     | 登录 / 注册                     |
| `/editor` `/editor/[id]` | 新建 / 编辑文章                 |
| `/drafts`                | 草稿箱                          |
| `/published`             | 已发布                          |
| `/assets`                | 素材库                          |
| `/prompts`               | 提示词库                        |
| `/posts/[id]`            | 文章阅读                        |
| `/users/[id]`            | 用户主页                        |
