/**
 * Money helpers shared by the storefront and the API.
 *
 * Convention used across the app:
 * - `price` on a product is the original (list) price.
 * - `discount` is a percentage off that original price.
 * - The final/charged unit price is `price - discount`.
 */
export const CENTS_PER_UNIT = 100;

export function toCents(amount: number): number {
  return Math.round(amount * CENTS_PER_UNIT);
}

export function fromCents(cents: number): number {
  return cents / CENTS_PER_UNIT;
}

export function clampDiscount(discount: number | null | undefined): number {
  const value = Number(discount);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

export function isValidPrice(price: number | null | undefined): price is number {
  return typeof price === "number" && Number.isFinite(price) && price > 0;
}

export function getOriginalUnitPrice(price: number): number {
  return fromCents(toCents(price));
}

export function getFinalUnitPrice(
  price: number | null | undefined,
  discount: number | null | undefined,
): number {
  if (!isValidPrice(price)) {
    return 0;
  }
  const originalCents = toCents(price);
  const discountPercent = clampDiscount(discount);
  return fromCents(
    Math.round((originalCents * (100 - discountPercent)) / 100),
  );
}

export function getUnitDiscount(
  price: number | null | undefined,
  discount: number | null | undefined,
): number {
  if (!isValidPrice(price)) {
    return 0;
  }
  return fromCents(toCents(price) - toCents(getFinalUnitPrice(price, discount)));
}

export interface PricedLine {
  originalUnitPrice: number;
  unitPrice: number;
  discountPercent: number;
  quantity: number;
  lineOriginalTotal: number;
  lineTotal: number;
}

export function priceLine(
  price: number,
  discount: number | null | undefined,
  quantity: number,
): PricedLine {
  const originalCents = toCents(price);
  const unitPriceCents = toCents(getFinalUnitPrice(price, discount));
  return {
    originalUnitPrice: fromCents(originalCents),
    unitPrice: fromCents(unitPriceCents),
    discountPercent: clampDiscount(discount),
    quantity,
    lineOriginalTotal: fromCents(originalCents * quantity),
    lineTotal: fromCents(unitPriceCents * quantity),
  };
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
}

export function calculateCartTotals(lines: PricedLine[]): CartTotals {
  const cents = lines.reduce(
    (totals, line) => ({
      subtotal: totals.subtotal + toCents(line.lineOriginalTotal),
      total: totals.total + toCents(line.lineTotal),
      itemCount: totals.itemCount + line.quantity,
    }),
    { subtotal: 0, total: 0, itemCount: 0 },
  );

  return {
    itemCount: cents.itemCount,
    subtotal: fromCents(cents.subtotal),
    discount: fromCents(Math.max(0, cents.subtotal - cents.total)),
    total: fromCents(cents.total),
  };
}

export function formatAmount(amount: number | null | undefined): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}
