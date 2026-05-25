import { NextResponse } from "next/server";

import { saveUploadedImage } from "@/lib/assets/storage";
import { validateImageUploadFile } from "@/lib/assets/validate-image-file";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

// 仅落盘并返回 URL，不写入 Asset 表；供「插入图片」、粘贴/拖入等直插正文场景使用。
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再上传图片" }, { status: 401 });
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
