# lib 目录说明

项目内可复用的服务端与通用工具代码，按职责分层：

```text
lib/
  auth/          # 认证：Auth.js、邮箱/手机号登录注册、会话、安全回跳
  db/            # 数据访问：Prisma、Redis 客户端单例
  utils/         # 通用工具：样式合并等
  generated/     # 自动生成代码（Prisma Client），勿手动修改
```

## 导入约定

| 模块 | 推荐导入 |
|------|----------|
| 认证（服务端） | `@/lib/auth` |
| 认证（客户端纯工具） | `@/lib/auth/safe-callback-url` 或 `@/lib/auth/client` |
| 数据库 / 缓存 | `@/lib/db` |
| 工具函数 | `@/lib/utils` |
| Prisma 类型 | `@/lib/generated/prisma/client` |
