import { isDuplicateDocumentError, getReadClient, getWriteClient } from "../sanity/client.js";
import {
  ORDER_BY_SESSION_QUERY,
  ORDER_FOR_INVENTORY_QUERY,
  PRODUCT_STOCK_BY_IDS_QUERY,
} from "../../src/lib/sanity/queries.js";
import type {
  ORDER_BY_SESSION_QUERY_RESULT,
  ORDER_FOR_INVENTORY_QUERY_RESULT,
  PRODUCT_STOCK_BY_IDS_QUERY_RESULT,
} from "../../src/types/sanity.types.js";
import type {
  InventoryOutcome,
  OrderLineRecord,
  OrderRecord,
} from "../types/orders.js";
import {
  DuplicateOrderError,
  orderDocumentIdForSession,
  type FulfillmentRepository,
} from "./fulfillment.js";

type RawOrder = NonNullable<ORDER_BY_SESSION_QUERY_RESULT>;
type InventoryOrder = NonNullable<ORDER_FOR_INVENTORY_QUERY_RESULT>;
type StockProduct = PRODUCT_STOCK_BY_IDS_QUERY_RESULT[number];

function normalizeLine(
  line: NonNullable<RawOrder["products"]>[number],
): OrderLineRecord | null {
  const ref = line.productId ?? line.product?._id;
  if (!ref) {
    return null;
  }

  const unitPrice =
    typeof line.unitPrice === "number" ? line.unitPrice : 0;
  const quantity = typeof line.quantity === "number" ? line.quantity : 0;

  return {
    _key: line._key,
    product: { _type: "reference", _ref: ref },
    name: line.name ?? line.product?.name ?? "Product",
    originalPrice:
      typeof line.originalPrice === "number" ? line.originalPrice : unitPrice,
    unitPrice,
    discountPercent:
      typeof line.discountPercent === "number" ? line.discountPercent : 0,
    quantity,
    lineTotal:
      typeof line.lineTotal === "number" ? line.lineTotal : unitPrice * quantity,
  };
}

function normalizeOrder(raw: RawOrder): OrderRecord {
  const products = (raw.products ?? [])
    .map(normalizeLine)
    .filter((line): line is OrderLineRecord => line !== null);

  const totalPrice =
    typeof raw.totalPrice === "number" ? raw.totalPrice : 0;
  const amountDiscount =
    typeof raw.amountDiscount === "number" ? raw.amountDiscount : 0;

  return {
    _id: raw._id,
    _type: "order",
    _rev: raw._rev,
    orderNumber: raw.orderNumber ?? "Unknown order",
    invoice: raw.invoice ?? null,
    stripeCheckoutSessionId: raw.stripeCheckoutSessionId ?? "",
    stripeEventId: null,
    stripeCustomerId: raw.stripeCustomerId ?? "",
    clerkUserId: raw.clerkUserId ?? "",
    customerName: raw.customerName ?? "Customer",
    email: raw.email ?? "",
    stripePaymentIntentId: raw.stripePaymentIntentId ?? "",
    products,
    subtotal:
      typeof raw.subtotal === "number"
        ? raw.subtotal
        : Math.round((totalPrice + amountDiscount) * 100) / 100,
    totalPrice,
    currency: raw.currency ?? "usd",
    amountDiscount,
    status: raw.status ?? "paid",
    inventoryStatus: raw.inventoryStatus ?? "pending",
    inventoryUpdated: raw.inventoryUpdated ?? false,
    inventoryUpdatedAt: null,
    orderDate: raw.orderDate ?? new Date().toISOString(),
  };
}

export const fulfillmentRepository: FulfillmentRepository = {
  async findOrderBySessionId(sessionId) {
    const raw = await getReadClient().fetch(ORDER_BY_SESSION_QUERY, {
      sessionId,
    });
    return raw ? normalizeOrder(raw) : null;
  },

  async createOrder(order) {
    const doc = {
      ...order,
      _id: orderDocumentIdForSession(order.stripeCheckoutSessionId),
    };

    try {
      const created = await getWriteClient().create(doc);
      return {
        ...order,
        _id: created._id,
        _rev: created._rev,
      };
    } catch (error) {
      if (isDuplicateDocumentError(error)) {
        throw new DuplicateOrderError(order.stripeCheckoutSessionId);
      }
      throw error;
    }
  },

  async ensureInventory(order) {
    return ensureInventory(order);
  },
};

async function markInventoryIssue(
  order: InventoryOrder,
  current: OrderRecord,
): Promise<InventoryOutcome> {
  const timestamp = new Date().toISOString();
  try {
    await getWriteClient()
      .patch(order._id)
      .ifRevisionId(order._rev)
      .set({
        inventoryStatus: "insufficient_stock",
        inventoryUpdated: false,
        inventoryUpdatedAt: timestamp,
      })
      .commit();
  } catch {
    // A concurrent fulfiller may have changed the order. The next webhook
    // retry will re-read and reconcile it.
  }

  return {
    order: {
      ...current,
      inventoryStatus: "insufficient_stock",
      inventoryUpdated: false,
      inventoryUpdatedAt: timestamp,
    },
    updated: false,
    reason: "insufficient_stock",
  };
}

async function ensureInventory(order: OrderRecord): Promise<InventoryOutcome> {
  if (order.inventoryUpdated) {
    return {
      order,
      updated: false,
      reason: "already_updated",
    };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const inventoryOrder = await getReadClient().fetch(
      ORDER_FOR_INVENTORY_QUERY,
      { id: order._id },
    );

    if (!inventoryOrder) {
      throw new Error(`Order ${order._id} disappeared during fulfillment.`);
    }

    if (inventoryOrder.inventoryUpdated) {
      return {
        order: { ...order, inventoryUpdated: true, inventoryStatus: "updated" },
        updated: false,
        reason: "already_updated",
      };
    }

    if (inventoryOrder.inventoryStatus === "insufficient_stock") {
      return {
        order: {
          ...order,
          inventoryStatus: "insufficient_stock",
          inventoryUpdated: false,
        },
        updated: false,
        reason: "insufficient_stock",
      };
    }

    const lines = inventoryOrder.products ?? [];
    const productIds = [
      ...new Set(
        lines
          .map((line) => line.product?._ref)
          .filter((ref): ref is string => Boolean(ref)),
      ),
    ];

    const products = productIds.length
      ? await getReadClient().fetch(PRODUCT_STOCK_BY_IDS_QUERY, {
          ids: productIds,
        })
      : [];

    const productsById = new Map<string, StockProduct>(
      products.map((product) => [product._id, product]),
    );

    const missingProduct = lines.some((line) => {
      const ref = line.product?._ref;
      return !ref || !productsById.has(ref);
    });
    if (missingProduct) {
      return markInventoryIssue(inventoryOrder, order);
    }

    const quantities = new Map<string, number>();
    for (const line of lines) {
      const ref = line.product?._ref;
      const quantity = line.quantity ?? 0;
      if (!ref || !Number.isInteger(quantity) || quantity <= 0) {
        return markInventoryIssue(inventoryOrder, order);
      }
      quantities.set(ref, (quantities.get(ref) ?? 0) + quantity);
    }

    const insufficient = [...quantities.entries()].find(([productId, quantity]) => {
      const product = productsById.get(productId);
      const stock = product?.stock;
      return (
        !product ||
        typeof stock !== "number" ||
        !Number.isFinite(stock) ||
        stock < quantity
      );
    });
    if (insufficient) {
      return markInventoryIssue(inventoryOrder, order);
    }

    const timestamp = new Date().toISOString();
    const transaction = getWriteClient().transaction();

    for (const [productId, quantity] of quantities) {
      const product = productsById.get(productId);
      const stock = product?.stock;
      if (!product || typeof stock !== "number") {
        return markInventoryIssue(inventoryOrder, order);
      }
      transaction.patch(product._id, (patch) =>
        patch.ifRevisionId(product._rev).set({ stock: stock - quantity }),
      );
    }

    transaction.patch(inventoryOrder._id, (patch) =>
      patch.ifRevisionId(inventoryOrder._rev).set({
        inventoryStatus: "updated",
        inventoryUpdated: true,
        inventoryUpdatedAt: timestamp,
      }),
    );

    try {
      await transaction.commit();
      return {
        order: {
          ...order,
          inventoryStatus: "updated",
          inventoryUpdated: true,
          inventoryUpdatedAt: timestamp,
        },
        updated: true,
      };
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      // A product or the order changed between our read and commit. Retry the
      // read/validate/compare-and-swap loop so stock can never go negative.
    }
  }

  throw new Error(`Could not safely update inventory for order ${order._id}.`);
}
