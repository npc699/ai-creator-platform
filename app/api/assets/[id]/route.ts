import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { deleteLocalUploadFile, isLocalUploadUrl } from "@/lib/assets/storage";
import { serializeAsset } from "@/lib/assets/serialize";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assetRenameSchema } from "@/lib/validations/asset";

export const runtime = "nodejs";

async function loadOwnedAsset(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "请先登录" }, { status: 401 }) } as const;
  }

  const asset = await prisma.asset.findUnique({
    where: { id },
  });

  if (!asset) {
    return { error: NextResponse.json({ error: "素材不存在" }, { status: 404 }) } as const;
  }

  if (asset.userId !== user.id) {
    return { error: NextResponse.json({ error: "无权访问该素材" }, { status: 403 }) } as const;
  }

  return { user, asset } as const;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/assets/[id]">
) {
  const { id } = await context.params;
  const result = await loadOwnedAsset(id);
  if ("error" in result) {
    return result.error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = assetRenameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "素材参数无效" },
      { status: 400 }
    );
  }

  const updated = await prisma.asset.update({
    where: { id },
    data: { name: parsed.data.name },
  });

  return NextResponse.json({ asset: serializeAsset(updated) });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/assets/[id]">
) {
  const { id } = await context.params;
  const result = await loadOwnedAsset(id);
  if ("error" in result) {
    return result.error;
  }

  const { asset } = result;

  await prisma.asset.delete({ where: { id } });

  if (isLocalUploadUrl(asset.url)) {
    await deleteLocalUploadFile(asset.url);
  }

  return NextResponse.json({ ok: true });
}
