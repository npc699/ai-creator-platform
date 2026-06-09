// 素材库：列出当前用户上传/生成的资源，供编辑器插入引用。
import { AssetsPage } from "@/components/pages";
import { ContentPanel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** 路由 `/assets`；Date 序列化为 ISO 字符串以便传入 Client Component。 */
export default async function AssetsRoute() {
  const user = await getCurrentUser();

  const assets = user
    ? await prisma.asset.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          url: true,
          mimeType: true,
          source: true,
          createdAt: true,
        },
      })
    : [];

  const items = assets.map((asset) => ({
    ...asset,
    createdAt: asset.createdAt.toISOString(),
  }));

  return (
    <ContentPanel>
      <AssetsPage initialItems={items} />
    </ContentPanel>
  );
}
