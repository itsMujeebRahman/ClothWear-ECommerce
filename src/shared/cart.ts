export const MAX_QUANTITY_PER_ITEM = 10;
export const MAX_TOTAL_ITEMS = 50;
export const MAX_CART_LINES = 20;

export interface StockAwareProduct {
  stock?: number | null;
}

/**
 * Products without a finite stock value are treated as unavailable. This is
 * intentionally conservative: it is better to hide an unmanaged product than
 * to sell inventory that cannot be tracked.
 */
export function getAvailableStock(product: StockAwareProduct): number {
  if (typeof product.stock !== "number" || !Number.isFinite(product.stock)) {
    return 0;
  }
  return Math.max(0, Math.floor(product.stock));
}

export function getMaxPurchasableQuantity(product: StockAwareProduct): number {
  return Math.min(MAX_QUANTITY_PER_ITEM, getAvailableStock(product));
}

export function canIncreaseQuantity(
  product: StockAwareProduct,
  currentQuantity: number,
): boolean {
  return currentQuantity < getMaxPurchasableQuantity(product);
}
