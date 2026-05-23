import type { Asset } from "@/lib/generated/prisma/client";

export type SerializedAsset = {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  source: "UPLOAD" | "AI";
  createdAt: string;
  updatedAt: string;
};

export function serializeAsset(asset: Asset): SerializedAsset {
  return {
    id: asset.id,
    name: asset.name,
    url: asset.url,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    source: asset.source,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}
