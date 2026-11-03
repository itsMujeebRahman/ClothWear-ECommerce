import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductImage from "@/components/product/ProductImage";

describe("ProductImage", () => {
  it("renders a complete fallback for products without images", () => {
    const markup = renderToStaticMarkup(
      createElement(ProductImage, {
        source: undefined,
        alt: "Classic Tee",
        width: 500,
        height: 500,
        className: "w-full h-72",
      }),
    );

    expect(markup).toContain('role="img"');
    expect(markup).toContain("Classic Tee image unavailable");
    expect(markup).toContain("w-full h-72");
    expect(markup).not.toContain("<img");
  });

  it("renders a fallback for an image reference without an asset", () => {
    const markup = renderToStaticMarkup(
      createElement(ProductImage, {
        source: {
          _type: "image",
          _key: "broken-image",
        } as NonNullable<
          Parameters<typeof ProductImage>[0]["source"]
        >,
        alt: "Broken product",
      }),
    );

    expect(markup).toContain("Broken product image unavailable");
    expect(markup).not.toContain("<img");
  });
});
