import "server-only";

import { auth } from "./config";

export async function getCurrentUser() {
  const session = await auth();

  // session callback 已按数据库校验；无 user.id 表示未登录或用户已删除。
  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}
