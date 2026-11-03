import { describe, expect, it } from "vitest";
import {
  MAX_CART_LINES,
  MAX_QUANTITY_PER_ITEM,
  MAX_TOTAL_ITEMS,
} from "@/shared/cart";
import {
  buildCheckoutSummary,
  parseCheckoutRequest,
  type CheckoutProduct,
} from "../server/validation/checkout";
import { CheckoutValidationError } from "../server/lib/errors";

function expectCheckoutError(
  action: () => unknown,
  code: string,
): CheckoutValidationError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(CheckoutValidationError);
    const checkoutError = error as CheckoutValidationError;
    expect(checkoutError.code).toBe(code);
    return checkoutError;
  }
  throw new Error(`Expected a CheckoutValidationError with code ${code}.`);
}

function product(overrides: Partial<CheckoutProduct> = {}): CheckoutProduct {
  return {
    _id: "product-1",
    name: "Classic Tee",
    price: 20,
    discount: 25,
    stock: 5,
    ...overrides,
  };
}

describe("parseCheckoutRequest", () => {
  it("accepts a valid cart and merges duplicate lines", () => {
    expect(
      parseCheckoutRequest({
        items: [
          { productId: "product-1", quantity: 2 },
          { productId: " product-1 ", quantity: 3 },
          { productId: "product-2", quantity: 1 },
        ],
      }),
    ).toEqual([
      { productId: "product-1", quantity: 5 },
      { productId: "product-2", quantity: 1 },
    ]);
  });

  it("rejects a missing or empty cart", () => {
    expectCheckoutError(() => parseCheckoutRequest({ items: [] }), "invalid_cart");
    expectCheckoutError(() => parseCheckoutRequest({}), "invalid_cart");
    expectCheckoutError(() => parseCheckoutRequest(null), "invalid_cart");
  });

  it("rejects unsupported product ids", () => {
    expectCheckoutError(
      () =>
        parseCheckoutRequest({
          items: [{ productId: "product/1", quantity: 1 }],
        }),
      "invalid_cart",
    );
  });

  it("rejects non-integer, zero and oversized quantities", () => {
    for (const quantity of [0, -1, 1.5, MAX_QUANTITY_PER_ITEM + 1]) {
      expectCheckoutError(
        () =>
          parseCheckoutRequest({
            items: [{ productId: "product-1", quantity }],
          }),
        "invalid_cart",
      );
    }
  });

  it("rejects duplicate lines whose merged quantity exceeds the limit", () => {
    const items = Array.from({ length: 2 }, () => ({
      productId: "product-1",
      quantity: MAX_QUANTITY_PER_ITEM,
    }));

    expectCheckoutError(
      () => parseCheckoutRequest({ items }),
      "quantity_limit",
    );
  });

  it("rejects more distinct lines than the cart allows", () => {
    const items = Array.from({ length: MAX_CART_LINES + 1 }, (_, index) => ({
      productId: `product-${index}`,
      quantity: 1,
    }));

    expectCheckoutError(
      () => parseCheckoutRequest({ items }),
      "invalid_cart",
    );
  });

  it("rejects a cart whose total quantity exceeds the limit", () => {
    const lineCount = Math.ceil(MAX_TOTAL_ITEMS / MAX_QUANTITY_PER_ITEM) + 1;
    const items = Array.from({ length: lineCount }, (_, index) => ({
      productId: `product-${index}`,
      quantity: MAX_QUANTITY_PER_ITEM,
    }));

    expectCheckoutError(
      () => parseCheckoutRequest({ items }),
      "too_many_items",
    );
  });
});

describe("buildCheckoutSummary", () => {
  it("prices the cart from server-side product documents", () => {
    const summary = buildCheckoutSummary(
      [
        { productId: "product-1", quantity: 2 },
        { productId: "product-2", quantity: 1 },
      ],
      [
        product(),
        product({ _id: "product-2", name: "Mug", price: 10, discount: 0 }),
      ],
    );

    expect(summary.lines).toEqual([
      {
        productId: "product-1",
        name: "Classic Tee",
        originalUnitPrice: 20,
        unitPrice: 15,
        discountPercent: 25,
        quantity: 2,
        lineOriginalTotal: 40,
        lineTotal: 30,
      },
      {
        productId: "product-2",
        name: "Mug",
        originalUnitPrice: 10,
        unitPrice: 10,
        discountPercent: 0,
        quantity: 1,
        lineOriginalTotal: 10,
        lineTotal: 10,
      },
    ]);

    expect(summary.totals).toEqual({
      itemCount: 3,
      subtotal: 50,
      discount: 10,
      total: 40,
    });
  });

  it("uses a safe fallback name and clamps invalid discounts", () => {
    const summary = buildCheckoutSummary(
      [{ productId: "product-1", quantity: 1 }],
      [product({ name: "   ", discount: 250 })],
    );

    expect(summary.lines[0]?.name).toBe("Product");
    expect(summary.lines[0]?.discountPercent).toBe(100);
    expect(summary.lines[0]?.unitPrice).toBe(0);
  });

  it("rejects products that no longer exist", () => {
    expectCheckoutError(
      () => buildCheckoutSummary([{ productId: "missing", quantity: 1 }], []),
      "product_unavailable",
    );
  });

  it("rejects invalid prices", () => {
    for (const price of [0, -5, null, Number.NaN]) {
      expectCheckoutError(
        () =>
          buildCheckoutSummary(
            [{ productId: "product-1", quantity: 1 }],
            [product({ price })],
          ),
        "invalid_price",
      );
    }
  });

  it("rejects products without finite stock", () => {
    for (const stock of [0, -1, null, undefined, Number.NaN]) {
      expectCheckoutError(
        () =>
          buildCheckoutSummary(
            [{ productId: "product-1", quantity: 1 }],
            [product({ stock })],
          ),
        "out_of_stock",
      );
    }
  });

  it("rejects quantities above the available stock and reports the remainder", () => {
    const error = expectCheckoutError(
      () =>
        buildCheckoutSummary(
          [{ productId: "product-1", quantity: 4 }],
          [product({ stock: 3 })],
        ),
      "insufficient_stock",
    );

    expect(error.details).toEqual({ availableStock: "3" });
  });

  it("floors fractional stock before comparing quantities", () => {
    expectCheckoutError(
      () =>
        buildCheckoutSummary(
          [{ productId: "product-1", quantity: 3 }],
          [product({ stock: 2.9 })],
        ),
      "insufficient_stock",
    );
  });
});
