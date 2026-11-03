import createImageUrlBuilder from "@sanity/image-url";
import { serverEnv } from "../config.js";

let builder: ReturnType<typeof createImageUrlBuilder> | null = null;

function getBuilder() {
  if (!serverEnv.sanity.projectId || !serverEnv.sanity.dataset) {
    return null;
  }
  if (!builder) {
    builder = createImageUrlBuilder({
      projectId: serverEnv.sanity.projectId,
      dataset: serverEnv.sanity.dataset,
    });
  }
  return builder;
}

interface ImageWithAsset {
  asset?: {
    _ref?: string;
    _id?: string;
  };
}

export function getServerImageUrl(
  image: ImageWithAsset | null | undefined,
): string | null {
  if (!image?.asset?._ref && !image?.asset?._id) {
    return null;
  }
  const imageBuilder = getBuilder();
  if (!imageBuilder) {
    return null;
  }
  try {
    return imageBuilder.image(image).width(800).height(800).url() || null;
  } catch {
    return null;
  }
}
