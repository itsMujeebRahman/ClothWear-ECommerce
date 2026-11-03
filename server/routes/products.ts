import { Router } from "express";
import type { QueryParams } from "@sanity/client";
import { getReadClient } from "../sanity/client.js";
import { HttpError } from "../lib/errors.js";
import {
  CATEGORIES_QUERY,
  PRODUCTS_BY_CATEGORY_QUERY,
  PRODUCTS_BY_VARIANT_QUERY,
  PRODUCTS_QUERY,
  PRODUCTS_SEARCH_QUERY,
  PRODUCT_BY_SLUG_QUERY,
} from "../../src/lib/sanity/queries.js";
import { productType } from "../../src/constants/index.js";
import type { StoreProduct } from "../../src/types/product.js";

const router = Router();
const validVariants: ReadonlySet<string> = new Set(
  productType.map((variant) => variant.value),
);

function isProductVariant(value: string): value is NonNullable<StoreProduct["variant"]> {
  return validVariants.has(value);
}

function escapeSearchTerm(value: string): string {
  return value
    .replace(/[*?%\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function readSingleQuery(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

router.get("/products", async (req, res, next) => {
  try {
    const search = escapeSearchTerm(readSingleQuery(req.query.search));
    const category = readSingleQuery(req.query.category);
    const variant = readSingleQuery(req.query.variant);

    let products;

    if (search) {
      products = await getReadClient().fetch(PRODUCTS_SEARCH_QUERY, {
        search: `${search}*`,
      });
    } else if (category) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category)) {
        throw new HttpError(400, "invalid_category", "Invalid category.");
      }
      products = await getReadClient().fetch(PRODUCTS_BY_CATEGORY_QUERY, {
        categorySlug: category,
      });
    } else if (variant) {
      if (!isProductVariant(variant)) {
        throw new HttpError(400, "invalid_variant", "Invalid product variant.");
      }
      const params = { productVariant: variant } satisfies QueryParams;
      products = await getReadClient().fetch(
        PRODUCTS_BY_VARIANT_QUERY,
        params,
      );
    } else {
      products = await getReadClient().fetch(PRODUCTS_QUERY);
    }

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get("/products/:slug", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new HttpError(400, "invalid_slug", "Invalid product slug.");
    }

    const product = await getReadClient().fetch(PRODUCT_BY_SLUG_QUERY, {
      slug,
    });

    if (!product) {
      throw new HttpError(404, "not_found", "Product not found.");
    }

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await getReadClient().fetch(CATEGORIES_QUERY);
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

export default router;
