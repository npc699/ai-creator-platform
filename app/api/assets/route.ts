import { NextResponse } from "next/server";

import { saveRemoteImage, saveUploadedImage } from "@/lib/assets/storage";
import { validateImageUploadFile } from "@/lib/assets/validate-image-file";
import { serializeAsset } from "@/lib/assets/serialize";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assetRegisterSchema } from "@/lib/validations/asset";

export const runtime = "nodejs";

const MAX_ASSETS_LIST = 100;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const assets = await prisma.asset.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: MAX_ASSETS_LIST,
  });

  return NextResponse.json({
    assets: assets.map(serializeAsset),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再上传素材" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  // AI 生图：先下载临时外链到本站 uploads，避免 24h 签名过期后无法访问。
  if (contentType.includes("application/json")) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
    }

    const parsed = assetRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "素材参数无效" },
        { status: 400 }
      );
    }

    let saved;
    try {
      saved = await saveRemoteImage({
        userId: user.id,
        remoteUrl: parsed.data.url,
        originalName: parsed.data.name,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "保存 AI 图片失败";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        url: saved.url,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        source: "AI",
      },
    });

    return NextResponse.json({ asset: serializeAsset(asset) });
  }

  // 本地上传：multipart 写盘 + 入库。
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "请提供图片文件" }, { status: 400 });
  }

  const validationError = validateImageUploadFile(fileEntry);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const buffer = Buffer.from(await fileEntry.arrayBuffer());
  const mimeType = fileEntry.type || "application/octet-stream";

  try {
    const saved = await saveUploadedImage({
      userId: user.id,
      buffer,
      mimeType,
      originalName: fileEntry.name,
    });

    const asset = await prisma.asset.create({
      data: {
        userId: user.id,
        name: fileEntry.name,
        url: saved.url,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        source: "UPLOAD",
      },
    });

    return NextResponse.json({ asset: serializeAsset(asset) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "图片上传失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
