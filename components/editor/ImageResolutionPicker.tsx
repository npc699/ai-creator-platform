import { AI_IMAGE_SIZES, type AiImageSize } from "@/lib/ai/image-schema";
import { cn } from "@/lib/utils";

type ImageResolutionPickerProps = {
  value: AiImageSize;
  onChange: (size: AiImageSize) => void;
  disabled?: boolean;
};

/** Seedream 5.0 方式 1：2K/3K/4K 档位；宽高比由 prompt 自然语言描述。 */
export function ImageResolutionPicker({
  value,
  onChange,
  disabled = false,
}: ImageResolutionPickerProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-500">分辨率</p>
      <div className="grid grid-cols-3 gap-2">
        {AI_IMAGE_SIZES.map((item) => {
          const isActive = value === item;

          return (
            <button
              aria-pressed={isActive}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition",
                isActive
                  ? "border-brand-border bg-brand-surface text-brand-primary"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              )}
              disabled={disabled}
              key={item}
              onClick={() => onChange(item)}
              onPointerDown={(event) => {
                event.preventDefault();
              }}
              type="button"
            >
              {item}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-5 text-zinc-400">
        宽高比请在描述中说明，例如「16:9 横图」「竖版海报」
      </p>
    </div>
  );
}
