// Auth.js 核心配置：Credentials 登录、JWT 会话、authorize 与 callbacks。
// 导出 handlers 供 API 路由，auth/signIn/signOut 供服务端调用。
import "server-only";

import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { findUserByIdentifier, parseAuthIdentifier } from "./identifier";
import { findActiveUserById } from "./session-user";
import { credentialsSchema } from "./schemas";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 本地 production 模式（next start）及反向代理场景需信任 Host，否则 session/signOut 报 UntrustedHost 并与 proxy 形成重定向环。
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    // 使用 JWT 存储会话（无状态），而不是数据库会话（有状态）
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "邮箱或手机号", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 使用 credentialsSchema 校验输入，失败返回 null
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const identifier = parseAuthIdentifier(
          parsedCredentials.data.identifier
        );

        if (!identifier) {
          return null;
        }

        // 按邮箱或手机号查询用户，若不存在或没有 passwordHash 则拒绝登录。
        const user = await findUserByIdentifier(identifier);

        if (!user?.passwordHash) {
          return null;
        }

        // 只在用户存在后比较哈希，避免任何场景暴露已存储的密码数据。
        const passwordMatches = await bcrypt.compare(
          parsedCredentials.data.password,
          user.passwordHash
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // 将数据库用户 ID 和角色写入 JWT，方便服务端组件识别资源归属与权限。
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    // 每次读取 session 时回查数据库，避免 JWT 在删号后仍显示旧用户。
    async session({ session, token }) {
      if (!session.user || !token.id) {
        return session;
      }

      const dbUser = await findActiveUserById(token.id);

      if (!dbUser) {
        // 清空 user，使 auth() / getCurrentUser() 视为未登录。
        return { expires: new Date(0).toISOString() };
      }

      return {
        ...session,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          phone: dbUser.phone,
          name: dbUser.name,
          image: dbUser.image,
          role: dbUser.role,
        },
      };
    },
  },
});
