# REST API 接口文档

本文档描述 AI Creator Platform 的 HTTP API。接口基于 **Next.js App Router**，路由定义在 `app/api/` 目录。

> 相关文档：[认证模块](auth.md) · [内容审核规则](review-rules.md)

---

## 通用约定

### 基础 URL

| 环境     | Base URL                         |
| -------- | -------------------------------- |
| 本地开发 | `http://localhost:3000`          |
| 生产     | 以部署域名 + `NEXTAUTH_URL` 为准 |

### 请求格式

- JSON 接口：`Content-Type: application/json`
- 文件上传：`Content-Type: multipart/form-data`，字段名 `file`
- 响应默认 `Content-Type: application/json; charset=utf-8`（流式接口除外）

### 鉴权

项目使用 **Auth.js v5（JWT 会话）**。登录成功后浏览器会持有会话 Cookie。

| 标记     | 说明                                                         |
| -------- | ------------------------------------------------------------ |
| 公开     | 无需登录                                                     |
| 可选登录 | 未登录可访问，登录后返回个性化字段                           |
| 需登录   | 必须携带有效会话 Cookie，否则 `401`                          |
| Cron     | 需 `Authorization: Bearer <CRON_SECRET>`（生产环境建议配置） |

**调用需登录接口的方式：**

1. 浏览器：先访问 `/login` 完成登录，同源 `fetch` 自动携带 Cookie
2. 脚本 / API 工具：从浏览器 DevTools 复制 Cookie，或使用 `TEST_AUTH_COOKIE` 环境变量（见 `scripts/test-review.ts`）

### 错误响应

大多数接口失败时返回：

```json
{ "error": "人类可读的错误信息" }
```

常见 HTTP 状态码：

| 状态码                | 含义                                  |
| --------------------- | ------------------------------------- |
| `400`                 | 参数校验失败、业务规则不满足          |
| `401`                 | 未登录或 Cron 鉴权失败                |
| `403`                 | 已登录但无权访问资源                  |
| `404`                 | 资源不存在                            |
| `409`                 | 冲突（如邮箱已注册、审核无需重试）    |
| `422`                 | 内容审核未通过（附带 `reviewResult`） |
| `499`                 | 客户端取消请求（AI 生图）             |
| `500` / `502` / `503` | 服务端或上游依赖异常                  |

---

## 健康检查

### `GET /api/health`

**鉴权：** 公开

**响应 `200`（全部正常）或 `503`（部分依赖异常）：**

```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

`checks` 中单项为 `"error"` 时，`status` 为 `"error"`，HTTP 状态码为 `503`。

---

## 认证

详细设计见 [auth.md](auth.md)。

### Auth.js 内置端点

**路由：** `/api/auth/[...nextauth]`

由 Auth.js 自动提供，常用端点包括：

| 端点                                  | 说明                        |
| ------------------------------------- | --------------------------- |
| `GET/POST /api/auth/signin`           | 登录页（自定义为 `/login`） |
| `GET/POST /api/auth/signout`          | 退出登录，清除会话 Cookie   |
| `GET /api/auth/session`               | 获取当前会话                |
| `POST /api/auth/callback/credentials` | Credentials 登录回调        |

**登录凭据（Credentials Provider）：**

| 字段         | 类型   | 约束                   |
| ------------ | ------ | ---------------------- |
| `identifier` | string | 邮箱或大陆 11 位手机号 |
| `password`   | string | 至少 6 位              |

前端通常通过 Auth.js 客户端 `signIn("credentials", { identifier, password })` 调用，而非直接构造 HTTP 请求。

### `POST /api/auth/register`

**鉴权：** 公开

**请求体：**

| 字段       | 类型   | 必填   | 约束                            |
| ---------- | ------ | ------ | ------------------------------- |
| `name`     | string | ✅     | 1–20 字                         |
| `email`    | string | 二选一 | 有效邮箱；可与 `phone` 同时填写 |
| `phone`    | string | 二选一 | 大陆 11 位手机号                |
| `password` | string | ✅     | 6–32 位                         |

> `email` 与 `phone` 至少填一项。

**成功 `201`：**

```json
{
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "phone": null,
    "name": "用户名",
    "image": null
  }
}
```

**错误：** `400` 参数无效 · `409` 邮箱或手机号已注册

> 注册接口**不建立会话**。客户端需在注册成功后调用 `signIn("credentials")` 获取 Cookie。

---

## 用户

### `PATCH /api/users/me`

**鉴权：** 需登录

**请求体（至少一项）：**

| 字段   | 类型           | 约束                             |
| ------ | -------------- | -------------------------------- |
| `name` | string \| null | 最多 50 字；空字符串视为 `null`  |
| `bio`  | string \| null | 最多 500 字；空字符串视为 `null` |

**成功 `200`：**

```json
{
  "user": {
    "id": "cuid",
    "name": "新昵称",
    "bio": "个人简介",
    "image": null
  }
}
```

---

## 草稿

### `GET /api/drafts`

**鉴权：** 需登录

**响应 `200`：** 当前用户草稿列表（最多 100 条，按 `updatedAt` 降序）

```json
{
  "drafts": [
    {
      "id": "cuid",
      "title": "标题",
      "content": "<p>HTML 正文</p>",
      "updatedAt": "2026-06-05T08:00:00.000Z",
      "prompt": { "title": "关联 Prompt 标题" }
    }
  ]
}
```

### `POST /api/drafts`

**鉴权：** 需登录

**请求体：**

| 字段       | 类型           | 必填 | 约束                                  |
| ---------- | -------------- | ---- | ------------------------------------- |
| `title`    | string         | —    | 最多 100 字；空则默认为「未命名草稿」 |
| `content`  | string         | ✅   | HTML 正文，最大 1MB                   |
| `promptId` | string \| null | —    | 须为本人或官方 Prompt                 |
| `tags`     | string[]       | —    | 最多 8 个，单个最多 20 字             |
| `coverUrl` | string \| null | —    | 须为本站 `/uploads` 路径              |

**成功 `200`：**

```json
{
  "draft": {
    "id": "cuid",
    "updatedAt": "2026-06-05T08:00:00.000Z"
  }
}
```

### `GET /api/drafts/latest`

**鉴权：** 需登录

**说明：** 进入编辑器时恢复最近一条未发布草稿。

**成功 `200`：**

```json
{
  "draft": {
    "id": "cuid",
    "title": "标题",
    "content": "<p>...</p>",
    "promptId": null,
    "coverUrl": null,
    "updatedAt": "2026-06-05T08:00:00.000Z"
  }
}
```

无草稿时 `draft` 为 `null`（非 `404`）。

### `GET /api/drafts/{id}`

**鉴权：** 需登录 · 仅草稿所有者

**成功 `200`：**

```json
{
  "draft": {
    "id": "cuid",
    "title": "标题",
    "content": "<p>...</p>",
    "tags": ["标签"],
    "promptId": null,
    "sourcePostId": null,
    "coverUrl": "/uploads/...",
    "updatedAt": "2026-06-05T08:00:00.000Z"
  }
}
```

**错误：** `403` 无权 · `404` 不存在或首发草稿已发布

### `PUT /api/drafts/{id}`

**鉴权：** 需登录 · 仅草稿所有者

**请求体：** 同 `POST /api/drafts`

**成功 `200`：** `{ "draft": { "id", "updatedAt" } }`

### `DELETE /api/drafts/{id}`

**鉴权：** 需登录 · 仅草稿所有者

**成功 `200`：** `{ "ok": true }`

---

## 文章

### `GET /api/posts`

**鉴权：** 需登录

**Query 参数：**

| 参数     | 类型   | 默认        | 说明                               |
| -------- | ------ | ----------- | ---------------------------------- |
| `status` | string | `PUBLISHED` | `PUBLISHED` · `DRAFT` · `ARCHIVED` |

**成功 `200`：**

```json
{
  "posts": [
    {
      "id": "cuid",
      "title": "标题",
      "excerpt": "摘要文本",
      "status": "PUBLISHED",
      "publishedAt": "2026-06-05T08:00:00.000Z",
      "updatedAt": "2026-06-05T08:00:00.000Z"
    }
  ]
}
```

### `POST /api/posts`

**鉴权：** 需登录

**说明：** 首次发布文章，发布前自动触发 AI 内容审核。

**请求体：**

| 字段       | 类型           | 必填 | 约束                              |
| ---------- | -------------- | ---- | --------------------------------- |
| `title`    | string         | ✅   | 1–100 字                          |
| `content`  | string         | ✅   | HTML 正文，最大 1MB，去标签后非空 |
| `draftId`  | string \| null | —    | 关联草稿 ID，须为本人且未发布     |
| `promptId` | string \| null | —    | 须为本人或官方 Prompt             |
| `tags`     | string[]       | —    | 最多 8 个，单个最多 20 字         |
| `coverUrl` | string \| null | —    | 须为本站 `/uploads` 路径          |

**成功 `200`：**

```json
{
  "post": {
    "id": "cuid",
    "title": "标题",
    "updatedAt": "2026-06-05T08:00:00.000Z",
    "publishedAt": "2026-06-05T08:00:00.000Z",
    "qualityScore": 78,
    "reviewStatus": "PASSED",
    "reviewRiskLevel": "NONE"
  },
  "reviewResult": { "...": "见「审核结果结构」" }
}
```

**错误：**

- `422` 审核未通过，响应含 `reviewResult`
- `400` 编辑稿须走「更新发布」· 草稿已发布
- `403` 无权使用草稿

> 发布成功后关联的源草稿会被删除。

### `GET /api/posts/{id}`

**鉴权：** 需登录 · 仅文章作者

**成功 `200`：**

```json
{
  "post": {
    "id": "cuid",
    "title": "标题",
    "content": "<p>...</p>",
    "status": "PUBLISHED",
    "qualityScore": 78,
    "reviewStatus": "PASSED",
    "reviewRiskLevel": "NONE",
    "reviewedAt": "2026-06-05T08:00:00.000Z",
    "publishedAt": "2026-06-05T08:00:00.000Z",
    "updatedAt": "2026-06-05T08:00:00.000Z",
    "promptId": null,
    "tags": ["标签"]
  }
}
```

### `PUT /api/posts/{id}`

**鉴权：** 需登录 · 仅文章作者

**说明：** 仅允许更新 `promptId`；已发布 / 已归档文章的正文修改须走编辑草稿 + `publish-update`。

**请求体：**

| 字段       | 类型           |
| ---------- | -------------- |
| `promptId` | string \| null |

### `PATCH /api/posts/{id}`

**鉴权：** 需登录 · 仅文章作者

**说明：** 切换文章上线 / 下线状态。从非发布状态变为 `PUBLISHED` 时可能触发审核。

**请求体：**

| 字段     | 类型   | 取值                     |
| -------- | ------ | ------------------------ |
| `status` | string | `PUBLISHED` · `ARCHIVED` |

**成功 `200`：** `{ "post": { ... }, "reviewResult": null | {...} }`

**错误：** `422` 审核未通过

### `DELETE /api/posts/{id}`

**鉴权：** 需登录 · 仅文章作者

**成功 `200`：** `{ "ok": true }`

### `GET /api/posts/{id}/edit`

**鉴权：** 需登录 · 仅文章作者

**说明：** 查找或创建编辑草稿（EditDraft），用于修改已发布文章。

**成功 `200`：**

```json
{
  "draftId": "cuid",
  "postId": "cuid",
  "source": "edit",
  "title": "标题",
  "content": "<p>...</p>",
  "tags": [],
  "coverUrl": null,
  "promptId": null,
  "updatedAt": "2026-06-05T08:00:00.000Z"
}
```

### `POST /api/posts/{id}/publish-update`

**鉴权：** 需登录 · 仅文章作者

**说明：** 将 EditDraft 内容经审核后写回已发布文章。无请求体。

**成功 `200`：** `{ "post": { ... }, "reviewResult": { ... } }`

**错误：** `400` 没有待发布的编辑内容 · `422` 审核未通过

### `POST /api/posts/{id}/like`

**鉴权：** 需登录

**说明：** 切换点赞状态（toggle）。无请求体。

**成功 `200`：**

```json
{
  "liked": true,
  "likeCount": 42
}
```

**错误：** `404` 文章不存在或未上线

### `POST /api/posts/{id}/view`

**鉴权：** 可选登录

**说明：** 记录浏览量。无请求体。

**成功 `200`：**

```json
{
  "recorded": true,
  "viewCount": 128
}
```

---

## Feed

### `GET /api/feed/home`

**鉴权：** 可选登录（登录后返回 `likedByViewer`、`canLike`）

**Query 参数：**

| 参数         | 类型   | 默认        | 说明                                          |
| ------------ | ------ | ----------- | --------------------------------------------- |
| `channel`    | string | —           | `hot` 热点榜 · `viral` 爆文榜；省略为首页推荐 |
| `sort`       | string | `recommend` | `recommend` · `latest` · `likes` · `views`    |
| `topic`      | string | —           | 话题筛选                                      |
| `cursor`     | string | —           | 分页游标（上一页响应的 `nextCursor`）         |
| `limit`      | number | —           | 每页条数                                      |
| `returnPath` | string | —           | 文章详情回跳路径                              |

**成功 `200`：**

```json
{
  "items": [
    {
      "id": "cuid",
      "author": "作者名",
      "authorId": "cuid",
      "authorImage": null,
      "time": "2 小时前",
      "title": "文章标题",
      "excerpt": "摘要",
      "score": 78,
      "tags": ["标签"],
      "views": 100,
      "likes": 10,
      "href": "/posts/cuid?return=...",
      "coverUrl": "/uploads/...",
      "likedByViewer": false,
      "canLike": true,
      "rank": 1,
      "isRisingFast": false,
      "sustainedHotDays": null
    }
  ],
  "nextCursor": "encoded-cursor-or-null",
  "hasMore": true
}
```

---

## 提示词（Prompt）

### Prompt 分类 slug

| slug             | 中文名   |
| ---------------- | -------- |
| `long-form`      | 长文写作 |
| `short-post`     | 短图文   |
| `seeding`        | 种草内容 |
| `product-review` | 产品测评 |
| `industry`       | 行业分析 |
| `title-gen`      | 标题生成 |
| `rewrite`        | 改写润色 |

### `GET /api/prompts`

**鉴权：** 需登录

**Query 参数：**

| 参数    | 类型   | 默认   | 说明                          |
| ------- | ------ | ------ | ----------------------------- |
| `scope` | string | `mine` | `mine` 我的 · `favorite` 收藏 |

**成功 `200`：** `{ "prompts": [ SerializedPrompt ] }`

### `POST /api/prompts`

**鉴权：** 需登录

**请求体：**

| 字段       | 类型   | 必填 | 约束                        |
| ---------- | ------ | ---- | --------------------------- |
| `title`    | string | ✅   | 1–100 字                    |
| `content`  | string | ✅   | 最大 1MB                    |
| `category` | string | —    | 分类 slug，默认 `long-form` |

**成功 `200`：** `{ "prompt": SerializedPrompt }`

### `GET /api/prompts/{id}`

**鉴权：** 需登录 · 本人或官方 Prompt

**成功 `200`：** `{ "prompt": SerializedPrompt }`

### `PUT /api/prompts/{id}`

**鉴权：** 需登录

**请求体（至少一项）：**

| 字段         | 类型    | 说明                               |
| ------------ | ------- | ---------------------------------- |
| `title`      | string  | 1–100 字                           |
| `content`    | string  | 最大 1MB                           |
| `category`   | string  | 分类 slug                          |
| `isFavorite` | boolean | 收藏标记；官方 Prompt 仅允许改此项 |

**说明：** 官方 Prompt 内容不可修改，仅可切换收藏。

### `DELETE /api/prompts/{id}`

**鉴权：** 需登录 · 仅非官方 Prompt 且为所有者

**成功 `200`：** `{ "ok": true }`

### `POST /api/prompts/{id}/use`

**鉴权：** 需登录 · 本人或官方 Prompt

**说明：** 使用 Prompt，`usageCount` +1。无请求体。

**成功 `200`：** `{ "prompt": SerializedPrompt }`

**SerializedPrompt 结构：**

```json
{
  "id": "cuid",
  "title": "标题",
  "content": "Prompt 正文",
  "category": "long-form",
  "isOfficial": false,
  "isFavorite": false,
  "usageCount": 3,
  "createdAt": "2026-06-05T08:00:00.000Z",
  "updatedAt": "2026-06-05T08:00:00.000Z"
}
```

---

## 素材

### `GET /api/assets`

**鉴权：** 需登录

**成功 `200`：** `{ "assets": [ SerializedAsset ] }`（最多 100 条）

### `POST /api/assets`

**鉴权：** 需登录

支持两种 Content-Type：

**方式 A — 本地上传（multipart/form-data）：**

| 字段   | 类型 | 说明                             |
| ------ | ---- | -------------------------------- |
| `file` | File | JPG / PNG / WebP / GIF，最大 5MB |

**方式 B — 注册 AI 外链（application/json）：**

| 字段     | 类型   | 约束                    |
| -------- | ------ | ----------------------- |
| `name`   | string | 1–200 字                |
| `url`    | string | 有效 URL（AI 临时图片） |
| `source` | string | 固定 `"AI"`             |

**成功 `200`：** `{ "asset": SerializedAsset }`

**SerializedAsset 结构：**

```json
{
  "id": "cuid",
  "name": "文件名.jpg",
  "url": "/uploads/...",
  "mimeType": "image/jpeg",
  "sizeBytes": 102400,
  "source": "UPLOAD",
  "createdAt": "2026-06-05T08:00:00.000Z",
  "updatedAt": "2026-06-05T08:00:00.000Z"
}
```

`source` 取值：`UPLOAD` · `AI`

### `PATCH /api/assets/{id}`

**鉴权：** 需登录 · 仅所有者

**请求体：**

| 字段   | 类型   | 约束     |
| ------ | ------ | -------- |
| `name` | string | 1–200 字 |

### `DELETE /api/assets/{id}`

**鉴权：** 需登录 · 仅所有者

**说明：** 删除数据库记录及本地 `/uploads` 文件（如适用）。

**成功 `200`：** `{ "ok": true }`

---

## 图片上传（不入素材库）

### `POST /api/uploads`

**鉴权：** 需登录

**说明：** 将图片落盘到 `public/uploads/` 并返回 URL，**不写入 Asset 表**。用于编辑器封面、正文插图等。

支持两种 Content-Type，规则同 `POST /api/assets`：

- **multipart/form-data**：字段 `file`
- **application/json**：`{ "url": "https://..." }`（下载 AI 临时外链到本站）

**成功 `200`：**

```json
{
  "url": "/uploads/...",
  "mimeType": "image/jpeg",
  "sizeBytes": 102400
}
```

---

## AI

> 需在环境变量中配置 `ARK_API_KEY`、`ARK_MODEL`（文本）、`ARK_IMAGE_MODEL`（图片）。未配置时相关接口返回配置错误。

### `POST /api/ai/generate`

**鉴权：** 需登录

**说明：** 火山方舟文本生成，**NDJSON 流式响应**。

**请求体：**

| 字段      | 类型   | 必填 | 约束                                                      |
| --------- | ------ | ---- | --------------------------------------------------------- |
| `mode`    | string | ✅   | `generate` · `selection` · `polish` · `expand` · `shrink` |
| `keyword` | string | 条件 | `generate` / `selection` 模式必填，最多 1000 字           |
| `context` | string | 条件 | 非 `generate` 模式必填（选中片段），最多 8000 字          |

**响应：** `Content-Type: application/x-ndjson; charset=utf-8`

每行一个 JSON 事件：

```json
{"type":"delta","text":"生成的文字片段"}
{"type":"done"}
{"type":"error","message":"错误信息"}
```

### `POST /api/ai/image`

**鉴权：** 需登录

**请求体：**

| 字段     | 类型   | 必填 | 约束                          |
| -------- | ------ | ---- | ----------------------------- |
| `prompt` | string | ✅   | 1–500 字                      |
| `size`   | string | —    | `2K` · `3K` · `4K`，默认 `2K` |

**成功 `200`：**

```json
{
  "url": "https://...",
  "revisedPrompt": "优化后的描述（可选）"
}
```

**错误：** `503` 未配置 · `502` 上游失败 · `499` 请求已取消

---

## 内容审核

业务规则详见 [review-rules.md](review-rules.md)。

### 审核结果结构（`reviewResult`）

发布 / 更新 / 手动审核接口均可能返回此结构：

```json
{
  "status": "PASSED",
  "contentHash": "sha256...",
  "safety": {
    "passed": true,
    "riskLevel": "none",
    "categories": [],
    "reason": "未发现明显违规风险",
    "suggestion": "可正常发布"
  },
  "quality": {
    "dimensions": {
      "titleAppeal": { "score": 8, "reason": "..." },
      "completeness": { "score": 8, "reason": "..." },
      "structure": { "score": 8, "reason": "..." },
      "readability": { "score": 8, "reason": "..." },
      "originality": { "score": 7, "reason": "..." },
      "imageRelevance": { "score": 7, "reason": "..." }
    },
    "overallScore": 78,
    "summary": "整体质量良好"
  },
  "qualityScore": 78,
  "cacheHit": false,
  "aiFailed": false
}
```

| 字段                | 说明                                 |
| ------------------- | ------------------------------------ |
| `status`            | `PENDING` · `PASSED` · `REJECTED`    |
| `safety.riskLevel`  | `high` · `medium` · `low` · `none`   |
| `safety.categories` | 违规类别英文枚举，见 review-rules.md |

### `POST /api/review/content`

**鉴权：** 需登录

**说明：** 编辑器内预审核，不修改文章状态。

**请求体：**

| 字段      | 类型           | 必填 | 约束                  |
| --------- | -------------- | ---- | --------------------- |
| `title`   | string         | ✅   | 1–100 字              |
| `content` | string         | ✅   | 最大 1MB              |
| `postId`  | string \| null | —    | 关联文章（须为本人）  |
| `draftId` | string \| null | —    | 关联草稿（须为本人）  |
| `tags`    | string[]       | —    | 优先于 post 已有 tags |

**成功 `200`：** `{ "reviewResult": { ... } }`

### `POST /api/review/fix`

**鉴权：** 需登录

**说明：** 根据违规信息生成合规改写版本。

**请求体：**

| 字段         | 类型     | 必填                     |
| ------------ | -------- | ------------------------ |
| `title`      | string   | ✅                       |
| `content`    | string   | ✅                       |
| `reason`     | string   | ✅ 违规原因，最多 800 字 |
| `categories` | string[] | — 违规类别               |

**成功 `200`：**

```json
{
  "fixed": {
    "title": "改写后标题",
    "content": "改写后正文",
    "summary": "改写说明"
  }
}
```

### `POST /api/review/retry`

**鉴权：** 需登录 · 仅文章作者

**说明：** 对 `reviewStatus === PENDING` 的文章重试审核。

**请求体：**

```json
{ "postId": "cuid" }
```

**成功 `200`：**

```json
{
  "retryStatus": "completed",
  "reviewResult": { "...": "..." }
}
```

`retryStatus` 取值：`completed` · `still_pending`

**错误：** `409` 文章已完成审核

### `GET /api/review/{postId}`

**鉴权：** 需登录 · 仅文章作者

**说明：** 获取文章审核记录（最近 30 条）。

**成功 `200`：**

```json
{
  "records": [
    {
      "id": "cuid",
      "reviewType": "PUBLISH",
      "contentHash": "...",
      "passed": true,
      "riskLevel": "NONE",
      "categories": [],
      "qualityScore": 78,
      "result": { "...": "..." },
      "createdAt": "2026-06-05T08:00:00.000Z"
    }
  ]
}
```

---

## 定时任务

### `GET /api/cron/refresh-feed-scores`

**鉴权：** Cron（生产环境建议设置 `CRON_SECRET`）

**请求头：**

```http
Authorization: Bearer <CRON_SECRET>
```

> 若未配置 `CRON_SECRET`，接口不校验 Authorization。

**说明：** 刷新热点 / 爆文预计算分数。Vercel Cron 每 10 分钟调用一次（见 `vercel.json`）。

**成功 `200`：**

```json
{
  "ok": true,
  "updated": 42,
  "since": "2026-05-29T00:00:00.000Z"
}
```

---

## 接口索引

| 方法                 | 路径                             | 鉴权     |
| -------------------- | -------------------------------- | -------- |
| GET                  | `/api/health`                    | 公开     |
| GET/POST             | `/api/auth/[...nextauth]`        | Auth.js  |
| POST                 | `/api/auth/register`             | 公开     |
| PATCH                | `/api/users/me`                  | 需登录   |
| GET                  | `/api/drafts`                    | 需登录   |
| POST                 | `/api/drafts`                    | 需登录   |
| GET                  | `/api/drafts/latest`             | 需登录   |
| GET/PUT/DELETE       | `/api/drafts/{id}`               | 需登录   |
| GET                  | `/api/posts`                     | 需登录   |
| POST                 | `/api/posts`                     | 需登录   |
| GET/PUT/PATCH/DELETE | `/api/posts/{id}`                | 需登录   |
| GET                  | `/api/posts/{id}/edit`           | 需登录   |
| POST                 | `/api/posts/{id}/publish-update` | 需登录   |
| POST                 | `/api/posts/{id}/like`           | 需登录   |
| POST                 | `/api/posts/{id}/view`           | 可选登录 |
| GET                  | `/api/feed/home`                 | 可选登录 |
| GET/POST             | `/api/prompts`                   | 需登录   |
| GET/PUT/DELETE       | `/api/prompts/{id}`              | 需登录   |
| POST                 | `/api/prompts/{id}/use`          | 需登录   |
| GET/POST             | `/api/assets`                    | 需登录   |
| PATCH/DELETE         | `/api/assets/{id}`               | 需登录   |
| POST                 | `/api/uploads`                   | 需登录   |
| POST                 | `/api/ai/generate`               | 需登录   |
| POST                 | `/api/ai/image`                  | 需登录   |
| POST                 | `/api/review/content`            | 需登录   |
| POST                 | `/api/review/fix`                | 需登录   |
| POST                 | `/api/review/retry`              | 需登录   |
| GET                  | `/api/review/{postId}`           | 需登录   |
| GET                  | `/api/cron/refresh-feed-scores`  | Cron     |
