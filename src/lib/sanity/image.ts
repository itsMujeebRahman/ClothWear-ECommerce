import createImageUrlBuilder, {
  type SanityImageSource,
} from "@sanity/image-url";
import { dataset, projectId } from "@/lib/sanity/env";
import type { StoreProduct } from "@/types/product";

let builder: ReturnType<typeof createImageUrlBuilder> | null = null;

function getBuilder() {
  if (!projectId || !dataset) {
    return null;
  }
  if (!builder) {
    builder = createImageUrlBuilder({ projectId, dataset });
  }
  return builder;
}

function hasUsableAsset(
  source: SanityImageSource | null | undefined,
): source is SanityImageSource {
  if (!source) {
    return false;
  }
  if (typeof source === "string") {
    return source.trim().length > 0;
  }
  if (typeof source !== "object") {
    return false;
  }

  if ("asset" in source && source.asset) {
    const asset = source.asset as { _ref?: string; _id?: string };
    return Boolean(asset._ref || asset._id);
  }

  if ("_ref" in source && typeof source._ref === "string") {
    return source._ref.trim().length > 0;
  }

  return false;
}

/**
 * Returns a usable CDN URL or null. Never throws for a missing/empty image, so
 * callers can render their own fallback.
 */
export function getImageUrl(
  source: SanityImageSource | null | undefined,
  width?: number,
  height?: number,
): string | null {
  if (!hasUsableAsset(source)) {
    return null;
  }

  const imageBuilder = getBuilder();
  if (!imageBuilder) {
    return null;
  }

  try {
    let image = imageBuilder.image(source);
    if (width) {
      image = image.width(width);
    }
    if (height) {
      image = image.height(height);
    }
    return image.url() || null;
  } catch {
    return null;
  }
}

export function getProductImageUrl(
  product: Pick<StoreProduct, "images"> | null | undefined,
): string | null {
  const firstImage = product?.images?.[0];
  return getImageUrl(firstImage, 800, 800);
}

/** @deprecated Prefer getImageUrl, which is null-safe. */
export const urlFor = (source: SanityImageSource) => {
  const imageBuilder = getBuilder();
  if (!imageBuilder) {
    throw new Error("Sanity image builder is not configured");
  }
  return imageBuilder.image(source);
};
