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
| 编辑器 | TipTap |
| AI | 火山方舟 Ark（文本生成、AI 配图） |
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

## 快速启动

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

至少填写以下项：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_creator_platform"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="请替换为足够长的随机字符串"
AUTH_URL="http://localhost:3000"
```

> 亦兼容 `NEXTAUTH_SECRET` / `NEXTAUTH_URL`。若 dev 端口非 3000，请同步修改 `AUTH_URL`。

AI 功能（可选）：

```env
ARK_API_KEY=""
ARK_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
ARK_MODEL=""
ARK_IMAGE_MODEL=""
```

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

## 开发管理员

执行 `npm run db:seed` 后可用以下账号登录 [/login](http://localhost:3000/login)：

| 项目 | 默认值 |
| --- | --- |
| 邮箱 | `admin@localhost` |
| 密码 | `Admin12345` |

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
| `npm run db:push` | 同步 Schema 到数据库 |
| `npm run db:migrate` | 执行数据库迁移 |
| `npm run db:seed` | 写入开发管理员 |
| `npm run db:studio` | 打开 Prisma Studio |

### 测试数据（可选）

| 命令 | 说明 |
| --- | --- |
| `npm run db:seed:test-users` | 创建测试用户 |
| `npm run db:seed:prompts` | 写入测试提示词 |
| `npm run db:seed:official-prompts` | 写入官方提示词模板 |
| `npm run db:seed:test-posts` | 批量写入测试文章 |
