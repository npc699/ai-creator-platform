import Image from "next/image";

export type AssetListItem = {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
  createdAt: Date;
};

type AssetGridProps = {
  items: AssetListItem[];
};

function isImageAsset(mimeType: string | null) {
  return mimeType?.startsWith("image/") ?? false;
}

export function AssetGrid({ items }: AssetGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <article
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
          key={item.id}
        >
          <div className="relative aspect-square bg-zinc-100">
            {isImageAsset(item.mimeType) ? (
              <Image
                alt={item.name}
                className="object-cover"
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                src={item.url}
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center px-3 text-center text-xs font-medium text-zinc-500">
                {item.mimeType ?? "文件"}
              </div>
            )}
          </div>
          <div className="space-y-1 p-3">
            <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
            <p className="text-xs text-zinc-500">
              {item.createdAt.toLocaleString("zh-CN", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
