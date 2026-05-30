import { NextResponse } from "next/server";

import { saveRemoteImage, saveUploadedImage } from "@/lib/assets/storage";
import { validateImageUploadFile } from "@/lib/assets/validate-image-file";
import { getCurrentUser } from "@/lib/auth";
import { remoteImagePersistSchema } from "@/lib/validations/remote-image";

export const runtime = "nodejs";

// 落盘并返回 URL，不写入 Asset 表；供封面、插入图片、粘贴/拖入等场景使用。
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再上传图片" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  // AI 等临时外链：下载到本站 uploads，避免签名过期；不入素材库。
  if (contentType.includes("application/json")) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
    }

    const parsed = remoteImagePersistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "图片地址无效" },
        { status: 400 }
      );
    }

    try {
      const saved = await saveRemoteImage({
        userId: user.id,
        remoteUrl: parsed.data.url,
        originalName: "cover.jpg",
      });

      return NextResponse.json({
        url: saved.url,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "图片保存失败";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

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

    return NextResponse.json({
      url: saved.url,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "图片上传失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
