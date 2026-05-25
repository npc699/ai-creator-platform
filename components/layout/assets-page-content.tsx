"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { AssetAddPanel } from "@/components/layout/asset-add-panel";
import { AssetGrid, type AssetListItem } from "@/components/layout/asset-grid";
import type { EditorAsset } from "@/lib/editor/assets-api";
import { btnEditorHeaderGhost } from "@/lib/utils/brand";

type AssetsPageContentProps = {
  initialItems: AssetListItem[];
};

function toListItem(asset: EditorAsset): AssetListItem {
  return {
    id: asset.id,
    name: asset.name,
    url: asset.url,
    mimeType: asset.mimeType ?? null,
    source: asset.source,
    createdAt: asset.createdAt,
  };
}

export function AssetsPageContent({ initialItems }: AssetsPageContentProps) {
  const [items, setItems] = useState(initialItems);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const aiAssetCount = items.filter((item) => item.source === "AI").length;

  const handleAssetAdded = (asset: EditorAsset) => {
    const mapped = toListItem(asset);
    setItems((current) => [mapped, ...current.filter((item) => item.id !== mapped.id)]);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">素材库</h2>
        <button
          className={btnEditorHeaderGhost}
          onClick={() => setShowAddPanel(true)}
          type="button"
        >
          <Plus className="h-4 w-4" />
          添加素材
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm text-zinc-600">还没有素材，点击右上角添加图片</p>
        </div>
      ) : (
        <AssetGrid items={items} onItemsChange={setItems} />
      )}

      {showAddPanel ? (
        <AssetAddPanel
          aiAssetCount={aiAssetCount}
          onAssetAdded={handleAssetAdded}
          onClose={() => setShowAddPanel(false)}
        />
      ) : null}
    </>
  );
}
