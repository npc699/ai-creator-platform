// 素材库：列出当前用户上传/生成的资源，供编辑器插入引用。
import { AssetsPageContent } from "@/components/page-content";
import { ContentPanel } from "@/components/content-panel";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** 路由 `/assets`；Date 序列化为 ISO 字符串以便传入 Client Component。 */
export default async function AssetsPage() {
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
    // Prisma Date 不可直接跨 RSC→Client 边界传递。
    createdAt: asset.createdAt.toISOString(),
  }));
  return (
    <ContentPanel>
      <AssetsPageContent initialItems={items} />
    </ContentPanel>
  );
}
