// 服务端获取当前登录用户的统一入口，封装 auth() 并归一化「未登录」为 null。
// 业务代码应优先使用本函数，而非直接调用 auth()。
import "server-only";

import { auth } from "./config";

/** 返回当前会话用户；未登录或用户已删除时返回 null。 */
export async function getCurrentUser() {
  const session = await auth();

  // session callback 已按数据库校验；无 user.id 表示未登录或用户已删除。
  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}
