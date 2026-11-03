import { z } from "zod";
import {
  MAX_CART_LINES,
  MAX_QUANTITY_PER_ITEM,
  MAX_TOTAL_ITEMS,
  getAvailableStock,
} from "../../src/shared/cart.js";
import {
  calculateCartTotals,
  clampDiscount,
  isValidPrice,
  priceLine,
  type CartTotals,
  type PricedLine,
} from "../../src/shared/pricing.js";
import { CheckoutValidationError } from "../lib/errors.js";

const productIdSchema = z
  .string()
  .trim()
  .min(1, "A product id is required.")
  .max(200, "A product id is too long.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "A product id contains unsupported characters.",
  );

const checkoutItemSchema = z.object({
  productId: productIdSchema,
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(
      MAX_QUANTITY_PER_ITEM,
      `You can buy at most ${MAX_QUANTITY_PER_ITEM} of one item.`,
    ),
});

const checkoutRequestSchema = z.object({
  items: z
    .array(checkoutItemSchema)
    .min(1, "Your cart is empty.")
    .max(MAX_CART_LINES, "There are too many different items in your cart."),
});

export interface NormalizedCartLine {
  productId: string;
  quantity: number;
}

export interface CheckoutProduct {
  _id: string;
  name?: string | null;
  price?: number | null;
  discount?: number | null;
  stock?: number | null;
}

export interface CheckoutLine extends PricedLine {
  productId: string;
  name: string;
}

export interface CheckoutSummary {
  lines: CheckoutLine[];
  totals: CartTotals;
}

export function parseCheckoutRequest(input: unknown): NormalizedCartLine[] {
  const parsed = checkoutRequestSchema.safeParse(input);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "items";
      details[key] = details[key] ?? issue.message;
    }
    throw new CheckoutValidationError(
      "invalid_cart",
      parsed.error.issues[0]?.message ?? "Your cart is invalid.",
      details,
    );
  }

  const merged = new Map<string, number>();
  for (const item of parsed.data.items) {
    const nextQuantity = (merged.get(item.productId) ?? 0) + item.quantity;
    if (nextQuantity > MAX_QUANTITY_PER_ITEM) {
      throw new CheckoutValidationError(
        "quantity_limit",
        `You can buy at most ${MAX_QUANTITY_PER_ITEM} of one item.`,
      );
    }
    merged.set(item.productId, nextQuantity);
  }

  if (merged.size > MAX_CART_LINES) {
    throw new CheckoutValidationError(
      "too_many_lines",
      "There are too many different items in your cart.",
    );
  }

  const totalQuantity = [...merged.values()].reduce(
    (total, quantity) => total + quantity,
    0,
  );
  if (totalQuantity > MAX_TOTAL_ITEMS) {
    throw new CheckoutValidationError(
      "too_many_items",
      `Your cart can contain at most ${MAX_TOTAL_ITEMS} items.`,
    );
  }

  return [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

/**
 * Builds the authoritative order lines from server-side product documents.
 * Browser-supplied names, prices, discounts and stock are never used.
 */
export function buildCheckoutSummary(
  cart: NormalizedCartLine[],
  products: CheckoutProduct[],
): CheckoutSummary {
  const productsById = new Map(products.map((product) => [product._id, product]));

  const lines: CheckoutLine[] = cart.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new CheckoutValidationError(
        "product_unavailable",
        "One of the products in your cart is no longer available.",
      );
    }

    if (!isValidPrice(product.price)) {
      throw new CheckoutValidationError(
        "invalid_price",
        `${product.name ?? "A product"} has an invalid price.`,
      );
    }

    const availableStock = getAvailableStock(product);
    if (availableStock <= 0) {
      throw new CheckoutValidationError(
        "out_of_stock",
        `${product.name ?? "A product"} is out of stock.`,
      );
    }

    if (item.quantity > availableStock) {
      throw new CheckoutValidationError(
        "insufficient_stock",
        `Only ${availableStock} of ${product.name ?? "this product"} remain in stock.`,
        { availableStock: String(availableStock) },
      );
    }

    const priced = priceLine(
      product.price,
      clampDiscount(product.discount),
      item.quantity,
    );

    return {
      productId: product._id,
      name: product.name?.trim() || "Product",
      ...priced,
    };
  });

  return {
    lines,
    totals: calculateCartTotals(lines),
  };
}
