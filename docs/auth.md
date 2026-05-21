# 认证模块设计与实现

本文档说明 `feat/auth` 中邮箱密码认证模块的设计思路、核心流程和当前实现边界。当前认证方案基于 Next.js App Router、Auth.js v5（`next-auth@beta`）、Prisma、PostgreSQL 和 `bcryptjs`。

## 设计目标

认证模块第一阶段的目标是先建立一个完整、可验证的邮箱密码登录闭环：

- 用户可以通过邮箱、用户名和密码注册账号。
- 注册时服务端负责最终校验，并只保存密码哈希。
- 用户可以通过邮箱和密码登录。
- 登录成功后通过 JWT session 维持登录态。
- 未登录用户访问主应用页面时自动跳转登录页。
- 已登录用户访问登录或注册页时自动跳转首页。

本阶段暂不接入 OAuth，也不引入数据库 session 表。因此当前没有使用 `@auth/prisma-adapter`，也没有新增 Auth.js 的 `Account`、`Session`、`VerificationToken` 模型。后续如果接入 GitHub、Google 等 OAuth，再扩展这些表更合适。

## 模块结构

```text
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (main)/
    page.tsx
  api/
    auth/
      [...nextauth]/route.ts
      register/route.ts
lib/
  auth/
    config.ts
    session.ts
    schemas.ts
    safe-callback-url.ts
  db/
    prisma.ts
    redis.ts
proxy.ts
types/
  next-auth.d.ts
prisma/
  schema.prisma
```

各文件职责如下：

- `lib/auth/config.ts`：Auth.js 核心配置，包含 Credentials Provider、登录校验和 JWT/session 回调。
- `lib/auth/session.ts`：提供 `getCurrentUser()` 读取当前登录用户。
- `lib/auth/schemas.ts`：登录与注册的 zod 校验 schema。
- `lib/auth/safe-callback-url.ts`：登录后回跳 URL 的同站白名单校验。
- `app/api/auth/[...nextauth]/route.ts`：挂载 Auth.js handler，处理登录、登出、CSRF、callback 等内置认证请求。
- `app/api/auth/register/route.ts`：自定义注册接口，负责创建邮箱密码用户。
- `app/(auth)/login/page.tsx`：登录页面，调用 Auth.js `signIn("credentials")`。
- `app/(auth)/register/page.tsx`：注册页面，先调用注册接口，再自动登录。
- `app/(main)/page.tsx`：登录后的首页占位。
- `proxy.ts`：Next.js 16 下的路由守卫入口。
- `types/next-auth.d.ts`：扩展 `Session` 和 `JWT` 类型，让应用能类型安全地访问用户 ID。

## 数据模型设计

当前 `User` 模型承担认证用户和后续业务数据归属两类职责：

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  name         String?
  image        String?
  posts        Post[]
  drafts       Draft[]
  prompts      Prompt[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

关键设计点：

- `email` 使用唯一索引，作为邮箱密码登录的账号标识。
- `passwordHash` 保存密码哈希，不保存明文密码。
- `passwordHash` 设计为可空，是为了给未来 OAuth 用户留出空间；当前注册接口创建的邮箱密码用户一定会写入该字段。
- `posts`、`drafts`、`prompts` 保留业务关联，后续内容、草稿、提示词都可以通过 `userId` 归属到当前登录用户。

## 注册流程

注册由 `app/api/auth/register/route.ts` 提供 `POST /api/auth/register`。

请求体格式：

```json
{
  "name": "用户名",
  "email": "user@example.com",
  "password": "Password123"
}
```

处理流程：

1. 解析 JSON 请求体，格式错误直接返回 `400`。
2. 使用 zod 校验 `name`、`email`、`password`。
3. 将邮箱转为小写，避免同一邮箱因大小写差异重复注册。
4. 查询数据库确认邮箱是否已存在。
5. 邮箱重复时返回 `409`。
6. 使用 `bcrypt.hash(password, 12)` 生成密码哈希。
7. 创建用户，并只返回 `id`、`email`、`name`、`image` 等安全字段。

这里把最终校验放在服务端，是因为客户端表单校验可以被绕过。注册接口也不会返回 `passwordHash`，避免敏感字段进入响应。

## 登录流程

登录由 Auth.js Credentials Provider 处理，核心逻辑在 `lib/auth/config.ts` 的 `authorize()` 中。

处理流程：

1. 登录页调用 `signIn("credentials", { email, password, redirect: false })`。
2. Auth.js 把凭据传给 `authorize()`。
3. `authorize()` 使用 zod 校验邮箱和密码。
4. 根据邮箱查询 `User`。
5. 如果用户不存在，或没有 `passwordHash`，返回 `null`。
6. 使用 `bcrypt.compare()` 比较输入密码和数据库中的哈希。
7. 校验通过后返回 Auth.js 用户对象。
8. Auth.js 写入 JWT session。

登录失败统一返回 `null`，由 Auth.js 处理为通用登录失败。这样不会向前端暴露“邮箱不存在”或“密码错误”的具体原因，能降低账号枚举风险。

## Session 与用户 ID

当前使用 JWT session：

```ts
session: {
  strategy: "jwt",
}
```

选择 JWT 的原因：

- Credentials Provider 不依赖 Auth.js 数据库 session 表。
- 当前阶段没有引入 Prisma Adapter，也没有 `Session` 表。
- `proxy.ts` 可以直接在路由边界通过 token 判断登录态，避免把 Prisma 引入 proxy 运行时。

登录成功后，`jwt` callback 会把数据库用户 ID 写入 token：

```ts
jwt({ token, user }) {
  if (user) {
    token.id = user.id;
  }

  return token;
}
```

随后 `session` callback 把 token 中的 ID 同步到 `session.user.id`。`types/next-auth.d.ts` 对 Session 和 JWT 做了类型扩展，确保后续业务代码能安全访问当前用户 ID。

## 路由守卫

Next.js 16 中不再使用旧的 `middleware.ts` 命名，本项目使用 `proxy.ts`。

当前守卫规则：

- 未登录访问受保护页面时，跳转 `/login`。
- 已登录访问 `/login` 或 `/register` 时，跳转 `/`。
- `/api/*`、`/_next/static/*`、`/_next/image/*`、`favicon.ico` 和静态文件不经过页面守卫。

需要注意：`app/(main)/page.tsx` 是路由组写法，`(main)` 不会出现在 URL 中。因此首页真实路径是 `/`，不是 `/main`。

当前 matcher：

```ts
matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
```

这样可以让 API 路由保持独立，避免注册接口、Auth.js 内置接口或静态资源被误重定向。

## 页面交互

### 登录页

`app/(auth)/login/page.tsx` 是客户端组件，主要职责是收集邮箱和密码，然后调用：

```ts
signIn("credentials", {
  email,
  password,
  redirect: false,
});
```

使用 `redirect: false` 是为了让页面自己处理失败提示和成功跳转。登录成功后执行：

```ts
router.push("/");
router.refresh();
```

`router.refresh()` 用于刷新服务端组件读取到的 session 状态。

### 注册页

`app/(auth)/register/page.tsx` 先在客户端检查两次密码是否一致，再调用 `POST /api/auth/register`。

注册成功后不会让用户再次手动登录，而是复用同一组邮箱和密码调用 `signIn("credentials")` 自动建立会话，然后跳转首页。

## 环境变量

认证模块至少依赖：

```env
DATABASE_URL=""
AUTH_SECRET=""
AUTH_URL=""
```

本地 Docker 环境通常还需要：

```env
REDIS_URL=""
```

说明：

- `DATABASE_URL` 用于 Prisma 连接 PostgreSQL。
- `AUTH_SECRET` 用于 Auth.js 加密和校验 session token，必须是足够长的随机字符串。
- `AUTH_URL` 用于指定当前应用地址。若开发端口不是 `3000`，例如 Next 自动切到 `3001`，这里也要同步改成对应端口，否则可能触发 Auth.js 的 `UntrustedHost` 错误。
- `.env.example` 保留了 `NEXTAUTH_SECRET` 和 `NEXTAUTH_URL`，用于兼容旧命名；新实现优先使用 `AUTH_SECRET`。

## 安全考虑

当前实现已经覆盖以下基础安全点：

- 明文密码只存在于当前请求作用域，不写入数据库，不返回前端。
- 密码使用 `bcryptjs` 哈希，成本因子为 `12`。
- 登录失败返回通用错误，不区分邮箱不存在和密码错误。
- 注册和登录都在服务端做最终校验。
- 注册响应只选择安全字段，避免泄露 `passwordHash`。
- 路由守卫只解码 JWT，不访问数据库，降低 proxy 运行时复杂度。

后续可增强的点：

- 增加登录和注册接口的限流。
- 增加密码强度规则，例如必须包含数字、大小写字母或特殊字符。
- 增加邮箱验证流程。
- 增加忘记密码和重置密码流程。
- 增加审计日志，记录关键认证事件。

## 开发管理员账号

项目提供 seed 脚本，用于本地开发时快速创建管理员测试账号。

```bash
npm run db:seed
```

默认账号（可通过 `.env` 覆盖）：

| 字段 | 默认值 |
|------|--------|
| 邮箱 | `admin@localhost` |
| 密码 | `Admin12345` |
| 用户名 | `管理员` |
| 角色 | `ADMIN` |

环境变量：

```env
DEV_ADMIN_EMAIL="admin@localhost"
DEV_ADMIN_PASSWORD="Admin12345"
DEV_ADMIN_NAME="管理员"
```

seed 使用 `upsert`，重复执行会更新密码和角色，不会重复插入。普通用户通过注册接口创建，角色默认为 `USER`。

登录后首页会显示 `（管理员）` 标识；若仍显示旧用户名，请先清除浏览器 Cookie 或使用无痕窗口重新登录。

## 运行与验证

首次运行或数据模型变更后执行：

```bash
npm install
npm run docker:up
npm run db:generate
npm run db:push
npm run dev
```

手动验证路径：

1. 访问 `/`，未登录时应跳转 `/login?callbackUrl=%2F`。
2. 访问 `/register` 注册新账号。
3. 注册成功后应自动登录并跳转 `/`。
4. 退出或清理 cookie 后，使用同一账号在 `/login` 登录。
5. 登录状态下访问 `/login` 或 `/register`，应自动跳转 `/`。

已执行过的自动验证包括：

- `npm run db:generate`
- `npm run db:push`
- `npm run lint`
- `npm run build`
- HTTP 级别注册、登录、重定向验证

## 当前边界

当前认证模块是“邮箱密码登录 MVP”，有意保持实现收敛：

- 不包含 OAuth 登录。
- 不包含邮箱验证。
- 不包含忘记密码。
- 不包含数据库 session。
- 不包含角色权限系统。
- 不包含用户设置页或退出按钮组件。

这些能力可以在后续分支逐步扩展，而不是在第一版认证闭环中一次性引入。
