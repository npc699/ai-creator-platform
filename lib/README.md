# lib 目录说明

项目内可复用的服务端与通用工具代码，按业务域分层。React 组件与 API route 通过 `@/lib/*` 引用，不在 UI 层直接写 Prisma / 复杂业务规则。

## 模块一览

| 目录 | 职责 | 典型导入 |
|------|------|----------|
| `auth/` | Auth.js、会话、登录注册 Schema | `@/lib/auth`、`@/lib/auth/client` |
| `db/` | Prisma、Redis 单例 | `@/lib/db` |
| `validations/` | REST API 请求 Zod | `@/lib/validations`、`@/lib/validations/post` |
| `posts/` | 文章列表 DTO、已发布、阅读导航、指标 | `@/lib/posts`、`@/lib/posts/metrics` |
| `drafts/` | 草稿查询、云/本地合并策略 | `@/lib/drafts`、`@/lib/drafts/sync` |
| `feed/` | 首页 Feed、算法、缓存、侧栏热榜 | `@/lib/feed/params`、`@/lib/feed/home/query` |
| `prompts/` | 提示词分类、列表、URL 参数 | `@/lib/prompts`、`@/lib/prompts/panel-params` |
| `assets/` | 素材存储、序列化、MIME | `@/lib/assets`、`@/lib/assets/storage` |
| `editor/` | 编辑器导航、正文图片 | `@/lib/editor/navigation`、`@/lib/editor/image/*` |
| `ai/` | 火山方舟文本 / 生图 | `@/lib/ai`（服务端）、`@/lib/ai/schema`（Client 类型） |
| `review/` | 内容审核与质量分 | `@/lib/review`、`@/lib/review/schema` |
| `users/` | 作者主页、创作者统计 | `@/lib/users`、`@/lib/users/profile-navigation` |
| `client/` | 浏览器 fetch 与 IndexedDB | `@/lib/client/assets/api`、`@/lib/client/drafts/idb` |
| `utils/` | cn、品牌 token、认证页样式 | `@/lib/utils`、`@/lib/utils/brand` |
| `generated/` | Prisma Client（自动生成） | `@/lib/generated/prisma/client` |

## 依赖约定

```text
app/ / components/          →  lib/*（按场景 deep import）
lib/client/                 →  lib/drafts/sync、lib/prompts/*、lib/validations/*（类型）
lib/feed/home/              →  lib/posts/list-types、lib/feed/scores/*、lib/db
lib/review/                 →  lib/ai、lib/prompts/review、lib/db
lib/users/                  →  lib/posts/*、lib/drafts/query、lib/db
lib/* 域模块                 →  勿反向依赖 components/
```

**边界规则：**

| 标记 | 含义 | 示例 |
|------|------|------|
| `import "server-only"` | 仅 API route / RSC / Server Action | `@/lib/db`、`@/lib/review`、`@/lib/feed/home/query` |
| `"use client"` | 仅 Client Component | `@/lib/client`、`@/lib/client/drafts/idb` |
| 同构 | Server / Client 均可 import（无 db） | `@/lib/utils`、`@/lib/feed/params`、`@/lib/editor/navigation` |
| deep import | barrel 含 server-only 时，Client 只用子路径 | Client 用 `@/lib/ai/schema`，勿 `@/lib/ai` |

**Prisma 类型与 enum：** 统一 `@/lib/generated/prisma/client`，勿从 `@/lib/db` 再 export。

## 导入示例

```ts
// API route：发布文章
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { reviewContent } from "@/lib/review";
import { postPublishSchema } from "@/lib/validations/post";

// RSC 首页 Feed
import { fetchHomeFeedPage } from "@/lib/feed/home/query";
import { buildHomeQuery } from "@/lib/feed/params";

// Client Component：编辑器草稿
import { getLocalDraft, putLocalDraft } from "@/lib/client/drafts/idb";
import { getDraftStorageKey } from "@/lib/drafts/sync";

// Client Component：合并 className
import { cn } from "@/lib/utils";
import { btnPrimary } from "@/lib/utils/brand";

// 类型 only（任意环境）
import type { FeedArticleItem } from "@/lib/posts/list-types";
import type { PostStatus } from "@/lib/generated/prisma/client";
```

---

## auth/ — 认证与会话

```text
lib/auth/
├── index.ts              # 服务端入口（import "server-only"）
├── config.ts             # Auth.js：Credentials、JWT callbacks
├── session.ts            # getCurrentUser()
├── session-user.ts       # findActiveUserById（proxy / session 回查）
├── schemas.ts            # 登录/注册 Zod Schema
├── identifier.ts         # 邮箱/手机号解析与查库
├── validators.ts         # 邮箱/手机号纯函数校验（无 db）
├── client.ts             # 客户端入口（无 Node/Prisma）
└── safe-callback-url.ts    # 登录回跳白名单（client 与 proxy 共用）
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 服务端：当前用户、handlers、注册校验 | `@/lib/auth` |
| 客户端：登录回跳 URL | `@/lib/auth/client` |
| Edge / proxy：回跳路径校验 | `@/lib/auth/client` 的 `getSafeCallbackPath` |
| 需深路径时 | `@/lib/auth/safe-callback-url`（与 client 等价） |

**注意：** `@/lib/auth` 含 `server-only`，不可在 Client Component 中 import。

## db/ — Prisma / Redis

```text
lib/db/
├── index.ts              # 服务端入口（import "server-only"）
├── prisma.ts             # PrismaClient 单例（@prisma/adapter-pg）
└── redis.ts              # Redis 懒连接单例
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 服务端：数据库查询 | `import { prisma } from "@/lib/db"` |
| 服务端：Feed / 审核缓存 | `import { getRedis } from "@/lib/db"` |
| Prisma 类型 / enum | `@/lib/generated/prisma/client`（勿从 db 再 export） |

**注意：**

- `@/lib/db` 含 `server-only`，不可在 Client Component 中 import。
- schema 变更后执行 `db:generate`；开发环境还需递增 [`prisma.ts`](db/prisma.ts) 中的 `PRISMA_CLIENT_CACHE_KEY`。
- `getRedis()` 首次调用才 connect；未配置 `REDIS_URL` 时调用方需 try/catch 降级。

## validations/ — Zod 请求契约

```text
lib/validations/
├── index.ts              # 聚合导出（Schema + Input 类型）
├── post.ts               # 发布 / 更新 / 上下线
├── draft.ts              # 草稿创建 / 更新
├── prompt.ts             # 提示词创建 / 更新
├── asset.ts              # 素材注册 / 重命名
├── user-profile.ts       # 用户资料 PATCH
├── cover-url.ts          # 封面 URL（post / draft 共用）
└── remote-image.ts       # 外链图片持久化
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| API route 校验 | `import { postPublishSchema } from "@/lib/validations"` 或 `@/lib/validations/post` |
| 客户端 API 类型 | `import type { PromptCreateInput } from "@/lib/validations"` |
| 模块内共用 | `cover-url.ts` 仅被 `post` / `draft` 引用，用相对路径 `./cover-url` |

**注意：**

- 与 `auth/schemas.ts` 区分：`validations/` 面向 **REST API 业务体**；`auth/schemas` 面向登录注册 Credentials。
- 不含 Prisma / db；可安全 `import type` 到 Client Component。

## posts/ — 文章列表、已发布、阅读、指标

```text
lib/posts/
├── index.ts              # 同构 API（不含 metrics）
├── list-types.ts         # FeedArticleItem（列表行 DTO canonical）
├── feed-item.ts          # mapPublishedPostToFeedItem + 展示格式化
├── excerpt.ts            # TipTap HTML → 列表摘要
├── tags.ts               # 标签校验与 normalize
├── metrics.ts            # 点赞 / 浏览（server-only，勿从 index 导入）
├── published-list.ts     # 已发布 Prisma where / orderBy / 空态
├── panel-params.ts       # PublishedFilter / buildPublishedQuery
├── reader-navigation.ts  # buildPostHref / 阅读回跳 / scroll key
└── merge-feed-items.ts   # 分页列表去重合并
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 列表 DTO、映射、摘要、标签 | `@/lib/posts` 或 `@/lib/posts/list-types` |
| 已发布 Tab / URL 参数 | `@/lib/posts/panel-params` |
| 点赞 / 浏览（API、RSC） | `@/lib/posts/metrics`（server-only） |
| 首页 Feed 映射 | `@/lib/feed/home/map-item` |

**注意：**

- `FeedArticleItem` 的 canonical 定义在 `posts/list-types`。
- `metrics.ts` 含 `server-only`，不可在 Client Component 中 import。
- 首页查询归属 `feed/home/`，不在 `posts/`。

## drafts/ — 草稿查询、EditDraft、同步策略

```text
lib/drafts/
├── index.ts                  # 同构 API（不含 edit-draft）
├── query.ts                  # unpublishedDraftWhere / buildDraftListWhere
├── edit-draft.ts             # findOrCreateEditDraft（server-only，API 深路径）
├── feed-item.ts              # mapDraftToFeedItem
├── fetch-edit-bootstrap.ts   # 编辑已发布文 bootstrap fetch（client）
├── page-meta.ts              # 草稿箱页文案
└── sync.ts                   # storageKey、云/本地合并、错误分类
```

浏览器 IndexedDB 读写见 `lib/client/drafts/idb.ts`（依赖 `drafts/sync` 类型）。

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 草稿箱列表 where / 映射 | `@/lib/drafts` 或 `@/lib/drafts/query` |
| 编辑器加载合并策略 | `@/lib/drafts/sync` |
| IndexedDB 读写 | `@/lib/client/drafts/idb` |
| EditDraft API | `@/lib/drafts/edit-draft`（server-only） |
| 编辑已发布 bootstrap | `@/lib/drafts/fetch-edit-bootstrap` |

**注意：**

- `edit-draft.ts` 依赖 Prisma，仅服务端/API 使用，勿从 Client Component import。
- `sync.ts` 为纯函数，可与 `client/drafts/idb` 在浏览器侧组合使用。

## feed/ — 首页 Feed、算法、缓存、榜单

```text
lib/feed/
├── index.ts              # 同构 API（不含 server-only 重型查询）
├── params.ts             # channel / sort / buildHomeQuery / buildFeedSortOptions
├── topic-params.ts       # topic 编解码 + tags 筛选
├── format.ts             # 指标 / 质量分 / 相对时间格式化
├── badges.ts             # 频道角标 + 质量档位 + 排名样式
├── cache.ts              # Redis 首屏缓存 + 上榜资格 + 失效
├── sidebar-ranking.ts    # 侧栏热榜 Top N
├── mock-items.ts
├── home/                 # 首页查询（5 文件）
│   ├── list.ts
│   ├── cursor.ts
│   ├── query.ts
│   ├── recommend-query.ts
│   └── map-item.ts
└── scores/               # 算法与刷分（5 文件）
    ├── window.ts
    ├── common.ts
    ├── recommend.ts
    ├── rankings.ts
    └── refresh.ts
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| URL 参数、Tab 链接 | `@/lib/feed` 或 `@/lib/feed/params` |
| 列表格式化 / 徽章 | `@/lib/feed/format`、`@/lib/feed/badges` |
| 首页分页查询 | `@/lib/feed/home/query`（server-only） |
| 侧栏热榜 | `@/lib/feed/sidebar-ranking`（server-only） |
| cron 刷分 | `@/lib/feed/scores/refresh`（server-only） |
| Prompts Tab 参数 | `@/lib/prompts/panel-params`（非 feed） |

**注意：**

- `home/`、`cache.ts`、`sidebar-ranking.ts`、`scores/refresh.ts` 含 Prisma/Redis，勿在 Client Component import。
- `FeedArticleItem` canonical 在 `posts/list-types`；首页映射见 `feed/home/map-item`。
- Prompts Tab 参数在 `@/lib/prompts/panel-params`，不在 `feed/`。

## prompts/ — 提示词分类、列表、URL 参数

```text
lib/prompts/
├── index.ts              # 公开 API（不含 ownership 服务端 helper）
├── category.ts           # slug / 标签 / Prisma enum 转换
├── query.ts              # scope / sort / orderBy / 客户端排序
├── list.ts               # buildPromptListWhere / promptListInclude
├── ownership.ts          # 鉴权与收藏（API route 深路径）
├── serialize.ts          # SerializedPrompt DTO
├── review.ts             # 审核 prompt 模板（review 域共用）
└── panel-params.ts       # scope/category/buildPromptsQuery
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 分类 slug / 标签 | `@/lib/prompts` 或 `@/lib/prompts/category` |
| Tab / URL 参数 | `@/lib/prompts/panel-params` |
| 列表 where / 序列化 | `@/lib/prompts/list`、`@/lib/prompts/serialize` |
| API 鉴权 | `@/lib/prompts/ownership`（含 Prisma，仅服务端） |
| 审核 prompt 文案 | `@/lib/prompts/review` |

**注意：**

- `ownership.ts` 依赖 `getCurrentUser` 与 Prisma，勿在 Client Component 中 import。
- `panel-params` 已从 `feed/` 拆出；勿再经 `@/lib/feed/panel-params` 引用 Prompts 参数。

## assets/ — 素材存储与序列化（服务端为主）

```text
lib/assets/
├── index.ts                  # 同构 API（不含 storage / validate）
├── storage.ts                # 本地上传 / 远程落盘 / 删除（server-only）
├── serialize.ts              # SerializedAsset DTO
├── validate-image-file.ts    # 上传校验（API route 深路径）
├── mime.ts                   # 图片 mime 推断
└── public-url.ts             # /uploads/ URL 构建与识别
```

浏览器侧 HTTP 封装见 `lib/client/assets/api.ts`。

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 公开 URL / 是否本站上传 | `@/lib/assets` 或 `@/lib/assets/public-url` |
| 网格是否图片 | `@/lib/assets/mime` |
| API 序列化 | `@/lib/assets/serialize` |
| 保存 / 删除文件 | `@/lib/assets/storage`（server-only） |
| 上传校验 | `@/lib/assets/validate-image-file`（server-only） |
| 素材页 fetch | `@/lib/client/assets/api` |

**注意：**

- `storage.ts` 含 `server-only` 与 Node fs，不可在 Client Component 中 import。
- 上传校验与 `editor/image/local-image` 共用 5MB 上限。

## editor/ — 编辑器导航与正文图片

```text
lib/editor/
├── index.ts                  # navigation + image 同构 API
├── navigation.ts             # from 白名单、buildEditorHref、getEditorBackTarget
└── image/
    ├── local-image.ts        # 本地文件校验与 DataURL
    ├── upload.ts             # /api/uploads 直传与远程持久化
    └── handlers.ts           # TipTap 粘贴/拖拽图片
```

浏览器 HTTP 封装见 `lib/client/assets/api.ts`、`lib/client/prompts/api.ts`。

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 编辑器入口 / 返回 | `@/lib/editor` 或 `@/lib/editor/navigation` |
| 正文图片校验 / 上传 | `@/lib/editor/image/local-image`、`image/upload` |
| TipTap handlers | `@/lib/editor/image/handlers` |
| 素材库 / Prompt fetch | `@/lib/client/assets/api`、`@/lib/client/prompts/api` |

**注意：**

- `navigation.ts` 无 db 依赖，可在 layout / article / posts 侧安全使用。
- 素材与 Prompt 的 REST 客户端在 `lib/client/`，勿在 `editor/` 下新增 `*-api.ts`。

## ai/ — 火山方舟（文本 / 生图）

```text
lib/ai/
├── index.ts              # 聚合导出（含 server-only，勿在 Client 默认 import）
├── ark-config.ts         # ARK_API_KEY / BASE_URL / 错误类型
├── ark.ts                # chatArk / streamArkChat（server-only）
├── ark-image.ts          # generateArkImage（server-only）
├── prompts.ts            # buildAiMessages（按 mode 组装 messages）
├── schema.ts             # 编辑器 AI 写作请求 Zod
└── image-schema.ts       # 生图请求 / 响应 Zod、AiImageSize
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| API route（generate / image） | `@/lib/ai` |
| 审核 pipeline 非流式调用 | `@/lib/ai` 的 `chatArk` |
| Client：写作 mode / 生图尺寸 | `@/lib/ai/schema`、`@/lib/ai/image-schema` |
| 环境变量与配置错误 | `@/lib/ai/ark-config`（server-only） |

**注意：**

- `ark-config.ts`、`ark.ts`、`ark-image.ts` 含 `server-only`，Client Component 请只用 `schema` / `image-schema` 的类型与常量。
- 生图默认分辨率档位见 `AI_IMAGE_SIZES`（2K / 3K / 4K）。

## review/ — 内容审核与质量分

```text
lib/review/
├── index.ts              # reviewContent / generateCompliantContent 等（server-only）
└── schema.ts             # 审核请求 / AI 响应 / 归一化结果 Zod
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 发布 / 更新 / 手动审核 pipeline | `@/lib/review` |
| API route 请求体验证 | `@/lib/review/schema` |
| 审核 prompt 模板 | `@/lib/prompts/review` |
| 非流式 LLM 调用 | `@/lib/ai` 的 `chatArk`（review 内部已用） |

**注意：**

- `index.ts` 含 `server-only`、Redis 缓存与 `chatArk`，勿在 Client Component import。
- `schema.ts` 无 db 依赖，可在 API route 或未来 Client 校验中 deep import。
- 质量分权重与 prompt 版本见 `@/lib/prompts/review` 的 `QUALITY_DIMENSION_WEIGHTS`、`REVIEW_PROMPT_VERSION`。

## users/ — 发布者资料、主页导航与创作者统计

```text
lib/users/
├── index.ts                  # 聚合导出
├── author-profile.ts         # 公开资料 / 文章列表 / 访客统计（server-only）
├── profile-navigation.ts     # 主页 href / 返回目标（同构，无 db）
└── creator-stats.ts          # 创作者计数、侧栏统计（server-only）
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 右栏已发布 / 草稿 / 阅读 | `@/lib/users` 的 `getCreatorSidebarStats` |
| 作者主页 route | `@/lib/users` |
| 主页链接 / 顶栏返回 | `@/lib/users/profile-navigation` 或 `@/lib/users` |
| 统计数字格式化（≥1 万） | `@/lib/users` 的 `formatCreatorStatCount` |
| 仅类型（Client 组件） | `@/lib/users/author-profile` |

**注意：**

- `author-profile.ts`、`creator-stats.ts` 含 Prisma，勿在 Client Component import。
- `profile-navigation.ts` 仅依赖 `editor/navigation`，可在 reader / layout 安全使用。
- 本人「已发布」口径含 `ARCHIVED`（与侧栏一致）；访客公开列表仅 `PUBLISHED`。

## client/ — 浏览器侧 API 与 IndexedDB

```text
lib/client/
├── index.ts              # 聚合导出（"use client"）
├── assets/
│   └── api.ts            # /api/assets CRUD
├── prompts/
│   └── api.ts            # /api/prompts CRUD / use / favorite
└── drafts/
    └── idb.ts            # IndexedDB 本地草稿（"use client"）
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 素材库 fetch / 上传 / 重命名 | `@/lib/client/assets/api` 或 `@/lib/client` |
| Prompt 列表 / 编辑 / 收藏 | `@/lib/client/prompts/api` 或 `@/lib/client` |
| 编辑器本地草稿读写 | `@/lib/client/drafts/idb` 或 `@/lib/client` |
| 云/本地合并策略（纯函数） | `@/lib/drafts/sync`（非 client 目录） |

**注意：**

- `index.ts` 与 `drafts/idb.ts` 含 `"use client"`，勿在 Server Component / API route import。
- `assets/api`、`prompts/api` 为 `fetch` 封装，类型可 import，运行时应仅在浏览器调用。
- IndexedDB 依赖 `drafts/sync` 的 `getDraftStorageKey` 与 `LocalDraftRecord` 类型。

## utils/ — 无业务含义工具

```text
lib/utils/
├── index.ts              # cn（clsx + tailwind-merge）
├── brand.ts              # 品牌 Tailwind token（按钮、导航、徽章等）
└── auth-form.ts          # 登录/注册页表单样式（与主站品牌色解耦）
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| 合并 className | `@/lib/utils` |
| 主站 UI token | `@/lib/utils/brand` |
| 认证页表单样式 | `@/lib/utils/auth-form` |

**注意：**

- `utils/` 不含 Prisma、fetch 或业务域逻辑；业务代码勿放入此目录。
- `brand.ts` 与 `auth-form.ts` 仅导出 class 字符串，可在 Server / Client Component 安全使用。

## generated/ — Prisma Client（勿改）

```text
lib/generated/
└── prisma/
    └── client.ts           # prisma generate 输出，schema 变更后 npm run db:generate
```

### 导入约定

| 场景 | 推荐导入 |
|------|----------|
| Model 类型、enum、Prisma namespace | `@/lib/generated/prisma/client` |
| 数据库查询 | `@/lib/db` 的 `prisma` 实例（勿 new PrismaClient） |

**注意：**

- 此目录由 Prisma 自动生成，**勿手动编辑**；变更 `prisma/schema.prisma` 后执行 `npm run db:generate`。
- 开发环境 schema 迭代时，需同步递增 [`db/prisma.ts`](db/prisma.ts) 中的 `PRISMA_CLIENT_CACHE_KEY`。
- enum / 类型 import 与 `prisma` 实例分离：类型走 `generated/`，查询走 `db/`。
