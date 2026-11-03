import { useState } from "react";
import { LuImageOff as ImageOff } from "react-icons/lu";
import { getImageUrl } from "@/lib/sanity/image";
import { cn } from "@/lib/utils";
import type { StoreProduct } from "@/types/product";

type ProductImageSource = NonNullable<StoreProduct["images"]>[number];

interface Props {
  source?: ProductImageSource | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
  eager?: boolean;
}

/**
 * Sanity image with a designed fallback. Products without images (or with a
 * broken asset reference) still render a complete card, search row, cart row
 * and order row.
 */
export default function ProductImage({
  source,
  alt,
  className,
  fallbackClassName,
  width,
  height,
  eager = false,
}: Props) {
  const src = getImageUrl(source, width, height);
  // Track the source that failed rather than a boolean: when the URL changes,
  // the previous failure no longer applies, so no reset effect is required.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = src !== null && failedSrc === src;

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-100 text-zinc-400",
          className,
          fallbackClassName,
        )}
        role="img"
        aria-label={`${alt} image unavailable`}
        style={
          !className && !fallbackClassName && width && height
            ? { width, height }
            : undefined
        }
      >
        <ImageOff size={24} className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
