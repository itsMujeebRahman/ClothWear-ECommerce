import { describe, expect, it } from "vitest";
import {
  calculateCartTotals,
  clampDiscount,
  formatAmount,
  fromCents,
  getFinalUnitPrice,
  getOriginalUnitPrice,
  getUnitDiscount,
  isValidPrice,
  priceLine,
  toCents,
} from "@/shared/pricing";

describe("money conversion", () => {
  it("round-trips amounts through integer cents", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(fromCents(1999)).toBe(19.99);
    expect(getOriginalUnitPrice(0.1 + 0.2)).toBe(0.3);
  });
});

describe("clampDiscount", () => {
  it("clamps to the 0-100 range", () => {
    expect(clampDiscount(-10)).toBe(0);
    expect(clampDiscount(0)).toBe(0);
    expect(clampDiscount(15)).toBe(15);
    expect(clampDiscount(100)).toBe(100);
    expect(clampDiscount(150)).toBe(100);
  });

  it("treats missing and non-finite values as no discount", () => {
    expect(clampDiscount(undefined)).toBe(0);
    expect(clampDiscount(null)).toBe(0);
    expect(clampDiscount(Number.NaN)).toBe(0);
    expect(clampDiscount(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("isValidPrice", () => {
  it("accepts only positive finite numbers", () => {
    expect(isValidPrice(1)).toBe(true);
    expect(isValidPrice(0.01)).toBe(true);
    expect(isValidPrice(0)).toBe(false);
    expect(isValidPrice(-1)).toBe(false);
    expect(isValidPrice(Number.NaN)).toBe(false);
    expect(isValidPrice(undefined)).toBe(false);
  });
});

describe("getFinalUnitPrice", () => {
  it("applies a percentage discount with cent-safe rounding", () => {
    expect(getFinalUnitPrice(19.99, 15)).toBe(16.99);
    expect(getFinalUnitPrice(0.1, 10)).toBe(0.09);
    expect(getFinalUnitPrice(10, 33)).toBe(6.7);
  });

  it("returns the original price when there is no discount", () => {
    expect(getFinalUnitPrice(25, 0)).toBe(25);
    expect(getFinalUnitPrice(25, null)).toBe(25);
  });

  it("never returns a negative price", () => {
    expect(getFinalUnitPrice(25, 100)).toBe(0);
    expect(getFinalUnitPrice(25, 150)).toBe(0);
  });

  it("returns zero for invalid prices", () => {
    expect(getFinalUnitPrice(0, 10)).toBe(0);
    expect(getFinalUnitPrice(-5, 10)).toBe(0);
    expect(getFinalUnitPrice(undefined, 10)).toBe(0);
  });
});

describe("getUnitDiscount", () => {
  it("returns the difference between list and final price", () => {
    expect(getUnitDiscount(19.99, 15)).toBe(3);
    expect(getUnitDiscount(10, 0)).toBe(0);
    expect(getUnitDiscount(10, 100)).toBe(10);
  });
});

describe("priceLine", () => {
  it("prices a line from the authoritative product values", () => {
    expect(priceLine(25.5, 10, 3)).toEqual({
      originalUnitPrice: 25.5,
      unitPrice: 22.95,
      discountPercent: 10,
      quantity: 3,
      lineOriginalTotal: 76.5,
      lineTotal: 68.85,
    });
  });

  it("clamps an invalid discount before calculating", () => {
    const line = priceLine(20, 150, 2);
    expect(line.discountPercent).toBe(100);
    expect(line.unitPrice).toBe(0);
    expect(line.lineTotal).toBe(0);
  });
});

describe("calculateCartTotals", () => {
  it("sums lines in cents so totals stay exact", () => {
    const totals = calculateCartTotals([
      priceLine(19.99, 15, 2),
      priceLine(5, 0, 1),
    ]);

    expect(totals).toEqual({
      itemCount: 3,
      subtotal: 44.98,
      discount: 6,
      total: 38.98,
    });
  });

  it("returns zero totals for an empty cart", () => {
    expect(calculateCartTotals([])).toEqual({
      itemCount: 0,
      subtotal: 0,
      discount: 0,
      total: 0,
    });
  });
});

describe("formatAmount", () => {
  it("formats values as US dollars and handles invalid input", () => {
    expect(formatAmount(1234.5)).toBe("$1,234.50");
    expect(formatAmount(null)).toBe("$0.00");
    expect(formatAmount(Number.NaN)).toBe("$0.00");
  });
});
