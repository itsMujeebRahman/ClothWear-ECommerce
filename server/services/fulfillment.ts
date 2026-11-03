import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { clampDiscount } from "../../src/shared/pricing.js";
import type {
  InventoryOutcome,
  OrderInvoice,
  OrderLineRecord,
  OrderRecord,
} from "../types/orders.js";

export class DuplicateOrderError extends Error {
  constructor(sessionId: string) {
    super(`Order for checkout session ${sessionId} already exists.`);
    this.name = "DuplicateOrderError";
  }
}

export class PaymentNotCompletedError extends Error {
  constructor() {
    super("The checkout session has not been paid.");
    this.name = "PaymentNotCompletedError";
  }
}

export interface FulfillmentRepository {
  findOrderBySessionId(sessionId: string): Promise<OrderRecord | null>;
  createOrder(order: OrderRecord): Promise<OrderRecord>;
  ensureInventory(order: OrderRecord): Promise<InventoryOutcome>;
}

export interface FulfillmentResult {
  order: OrderRecord;
  created: boolean;
}

export function orderDocumentIdForSession(sessionId: string): string {
  return `order.${sessionId}`;
}

function readMetadata(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getStripeId(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!value) {
    return null;
  }
  return typeof value === "string" ? value : value.id;
}

function getPaymentIntentId(
  value: string | Stripe.PaymentIntent | null | undefined,
): string {
  if (!value) {
    return "";
  }
  return typeof value === "string" ? value : value.id;
}

export function buildOrderLinesFromStripe(
  lineItems: Stripe.LineItem[],
): OrderLineRecord[] {
  return lineItems.map((item) => {
    if (!item.price) {
      throw new Error(`Stripe line item ${item.id} has no price.`);
    }

    const product =
      typeof item.price.product === "object" && item.price.product
        ? (item.price.product as Stripe.Product)
        : null;
    const productId = readMetadata(product?.metadata, "id");
    if (!productId) {
      throw new Error(
        `Stripe line item ${item.id} is missing its Sanity product id.`,
      );
    }

    const quantity = item.quantity ?? 0;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Stripe line item ${item.id} has an invalid quantity.`);
    }

    const unitCents =
      typeof item.price.unit_amount === "number"
        ? item.price.unit_amount
        : 0;
    const unitPrice = unitCents / 100;

    const metadataOriginalPrice = Number(
      readMetadata(product?.metadata, "originalPrice"),
    );
    const originalPrice =
      Number.isFinite(metadataOriginalPrice) && metadataOriginalPrice > 0
        ? metadataOriginalPrice
        : unitPrice;

    const metadataDiscount = Number(
      readMetadata(product?.metadata, "discountPercent"),
    );
    const discountPercent = Number.isFinite(metadataDiscount)
      ? clampDiscount(metadataDiscount)
      : 0;

    const lineTotal =
      typeof item.amount_total === "number"
        ? item.amount_total / 100
        : unitPrice * quantity;

    return {
      _key: randomUUID(),
      product: {
        _type: "reference",
        _ref: productId,
      },
      name: item.description || product?.name || "Product",
      originalPrice,
      unitPrice,
      discountPercent,
      quantity,
      lineTotal,
    };
  });
}

export function buildOrderRecord({
  session,
  lineItems,
  invoice,
  eventId,
}: {
  session: Stripe.Checkout.Session;
  lineItems: Stripe.LineItem[];
  invoice: OrderInvoice | null;
  eventId?: string;
}): OrderRecord {
  const clerkUserId = readMetadata(session.metadata, "clerkUserId");
  if (!clerkUserId) {
    throw new Error("Checkout session is missing the Clerk user id.");
  }

  const stripeCustomerId = getStripeId(session.customer);
  if (!stripeCustomerId) {
    throw new Error("Checkout session is missing the Stripe customer id.");
  }

  const customerName =
    readMetadata(session.metadata, "customerName") ??
    session.customer_details?.name ??
    "Customer";
  const email =
    readMetadata(session.metadata, "customerEmail") ??
    session.customer_details?.email ??
    session.customer_email ??
    "";
  if (!email) {
    throw new Error("Checkout session is missing the customer email.");
  }

  const products = buildOrderLinesFromStripe(lineItems);
  if (!products.length) {
    throw new Error("Checkout session has no line items.");
  }

  const subtotal = products.reduce(
    (total, line) => total + line.originalPrice * line.quantity,
    0,
  );
  const totalPrice =
    typeof session.amount_total === "number"
      ? session.amount_total / 100
      : products.reduce((total, line) => total + line.lineTotal, 0);
  const amountDiscount = Math.max(0, Math.round((subtotal - totalPrice) * 100) / 100);

  const orderNumber =
    readMetadata(session.metadata, "orderNumber") ??
    `STRIPE-${session.id.slice(-12).toUpperCase()}`;

  return {
    _id: orderDocumentIdForSession(session.id),
    _type: "order",
    orderNumber,
    invoice,
    stripeCheckoutSessionId: session.id,
    stripeEventId: eventId ?? null,
    stripeCustomerId,
    clerkUserId,
    customerName,
    email,
    stripePaymentIntentId: getPaymentIntentId(session.payment_intent),
    products,
    subtotal: Math.round(subtotal * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    currency: session.currency ?? "usd",
    amountDiscount,
    status: "paid",
    inventoryStatus: "pending",
    inventoryUpdated: false,
    orderDate: new Date().toISOString(),
  };
}

/**
 * Fulfills a paid checkout session exactly once:
 * - the Sanity document id is derived from the Stripe session id, so repeated
 *   webhooks and the success-page fallback target the same document;
 * - duplicate-create errors are treated as "another request won the race" and
 *   the existing order is reused;
 * - inventory is applied with compare-and-swap semantics by the repository.
 */
export async function fulfillPaidCheckoutSession(
  session: Stripe.Checkout.Session,
  lineItems: Stripe.LineItem[],
  invoice: OrderInvoice | null,
  repository: FulfillmentRepository,
  options: { eventId?: string } = {},
): Promise<FulfillmentResult> {
  if (session.payment_status !== "paid") {
    throw new PaymentNotCompletedError();
  }

  const existing = await repository.findOrderBySessionId(session.id);
  if (existing) {
    const inventory = await repository.ensureInventory(existing);
    return { order: inventory.order, created: false };
  }

  const order = buildOrderRecord({
    session,
    lineItems,
    invoice,
    eventId: options.eventId,
  });

  try {
    const created = await repository.createOrder(order);
    const inventory = await repository.ensureInventory(created);
    return { order: inventory.order, created: true };
  } catch (error) {
    if (!(error instanceof DuplicateOrderError)) {
      throw error;
    }

    const concurrentOrder = await repository.findOrderBySessionId(session.id);
    if (!concurrentOrder) {
      throw error;
    }
    const inventory = await repository.ensureInventory(concurrentOrder);
    return { order: inventory.order, created: false };
  }
}

export function createOrderNumber(): string {
  return randomUUID();
}
