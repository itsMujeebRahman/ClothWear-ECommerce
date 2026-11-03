import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  buildOrderRecord,
  DuplicateOrderError,
  fulfillPaidCheckoutSession,
  orderDocumentIdForSession,
  PaymentNotCompletedError,
  type FulfillmentRepository,
} from "../server/services/fulfillment";
import type { OrderRecord } from "../server/types/orders";

function stripeProduct(
  metadata: Record<string, string> = {
    id: "product-1",
    originalPrice: "20.00",
    discountPercent: "25",
  },
  name = "Classic Tee",
): Stripe.Product {
  return {
    id: "prod_123",
    object: "product",
    name,
    metadata,
  } as Stripe.Product;
}

function lineItem(
  overrides: {
    id?: string;
    quantity?: number;
    unitAmount?: number;
    amountTotal?: number;
    product?: Stripe.Product;
    description?: string;
  } = {},
): Stripe.LineItem {
  const quantity = overrides.quantity ?? 2;
  const unitAmount = overrides.unitAmount ?? 1500;

  return {
    id: overrides.id ?? "li_123",
    object: "line_item",
    amount_subtotal: unitAmount * quantity,
    amount_total: overrides.amountTotal ?? unitAmount * quantity,
    amount_discount: 0,
    amount_tax: 0,
    adjustable_quantity: null,
    currency: "usd",
    description: overrides.description ?? "Classic Tee",
    metadata: {},
    price: {
      id: "price_123",
      object: "price",
      currency: "usd",
      product: overrides.product ?? stripeProduct(),
      unit_amount: unitAmount,
    } as Stripe.Price,
    quantity,
  } as unknown as Stripe.LineItem;
}

const emptyCustomerDetails: NonNullable<
  Stripe.Checkout.Session["customer_details"]
> = {
  address: null,
  business_name: null,
  email: null,
  individual_name: null,
  name: null,
  phone: null,
  tax_exempt: "none",
  tax_ids: null,
};

function checkoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    object: "checkout.session",
    amount_total: 3000,
    currency: "usd",
    customer: "cus_123",
    customer_details: {
      ...emptyCustomerDetails,
      name: "Ada Lovelace",
      email: "ada@example.com",
    },
    customer_email: null,
    metadata: {
      clerkUserId: "user_123",
      orderNumber: "ORD-1",
      customerName: "Ada Lovelace",
      customerEmail: "ada@example.com",
    },
    payment_intent: "pi_123",
    payment_status: "paid",
    ...overrides,
  } as Stripe.Checkout.Session;
}

interface TestRepository {
  repository: FulfillmentRepository;
  createdOrders: OrderRecord[];
  inventoryOrders: OrderRecord[];
  findOrderBySessionId: ReturnType<typeof vi.fn>;
  createOrder: ReturnType<typeof vi.fn>;
  ensureInventory: ReturnType<typeof vi.fn>;
}

function createRepository(): TestRepository {
  let stored: OrderRecord | null = null;
  const createdOrders: OrderRecord[] = [];
  const inventoryOrders: OrderRecord[] = [];

  const findOrderBySessionId = vi.fn(async (sessionId: string) => {
    return stored?.stripeCheckoutSessionId === sessionId ? stored : null;
  });

  const createOrder = vi.fn(async (order: OrderRecord) => {
    // Emulates Sanity's atomic document create: the check and reservation
    // happen before the first await so a concurrent caller sees the winner.
    if (stored) {
      throw new DuplicateOrderError(order.stripeCheckoutSessionId);
    }
    stored = order;
    createdOrders.push(order);
    return order;
  });

  const ensureInventory = vi.fn(async (order: OrderRecord) => {
    inventoryOrders.push(order);
    return {
      order: {
        ...order,
        inventoryStatus: "updated" as const,
        inventoryUpdated: true,
      },
      updated: true,
    };
  });

  return {
    repository: {
      findOrderBySessionId,
      createOrder,
      ensureInventory,
    },
    createdOrders,
    inventoryOrders,
    findOrderBySessionId,
    createOrder,
    ensureInventory,
  };
}

describe("buildOrderRecord", () => {
  it("builds an order with a deterministic id and authoritative totals", () => {
    const session = checkoutSession();
    const order = buildOrderRecord({
      session,
      lineItems: [lineItem()],
      invoice: {
        id: "in_123",
        number: "INV-1",
        hosted_invoice_url: "https://example.com/invoice",
      },
      eventId: "evt_123",
    });

    expect(order._id).toBe(orderDocumentIdForSession("cs_test_123"));
    expect(order._id).toBe("order.cs_test_123");
    expect(order).toMatchObject({
      orderNumber: "ORD-1",
      stripeCheckoutSessionId: "cs_test_123",
      stripeEventId: "evt_123",
      stripeCustomerId: "cus_123",
      clerkUserId: "user_123",
      customerName: "Ada Lovelace",
      email: "ada@example.com",
      stripePaymentIntentId: "pi_123",
      subtotal: 40,
      totalPrice: 30,
      currency: "usd",
      amountDiscount: 10,
      status: "paid",
      inventoryStatus: "pending",
      inventoryUpdated: false,
      invoice: {
        id: "in_123",
        number: "INV-1",
        hosted_invoice_url: "https://example.com/invoice",
      },
    });

    expect(order.products).toHaveLength(1);
    expect(order.products[0]).toMatchObject({
      product: { _type: "reference", _ref: "product-1" },
      name: "Classic Tee",
      originalPrice: 20,
      unitPrice: 15,
      discountPercent: 25,
      quantity: 2,
      lineTotal: 30,
    });
    expect(order.products[0]?._key).toEqual(expect.any(String));
  });

  it("derives the total from line items when Stripe omits amount_total", () => {
    const order = buildOrderRecord({
      session: checkoutSession({ amount_total: null }),
      lineItems: [lineItem()],
      invoice: null,
    });

    expect(order.totalPrice).toBe(30);
    expect(order.amountDiscount).toBe(10);
  });

  it("falls back to session customer details and a derived order number", () => {
    const order = buildOrderRecord({
      session: checkoutSession({
        metadata: { clerkUserId: "user_123" },
        customer_details: { ...emptyCustomerDetails, email: null },
        customer_email: "fallback@example.com",
        customer: { id: "cus_456" } as Stripe.Customer,
      }),
      lineItems: [lineItem()],
      invoice: null,
    });

    expect(order.customerName).toBe("Customer");
    expect(order.email).toBe("fallback@example.com");
    expect(order.stripeCustomerId).toBe("cus_456");
    expect(order.orderNumber).toBe("STRIPE-CS_TEST_123");
  });

  it("requires the Clerk user, customer, email and line items", () => {
    expect(() =>
      buildOrderRecord({
        session: checkoutSession({ metadata: {} }),
        lineItems: [lineItem()],
        invoice: null,
      }),
    ).toThrow("Clerk user id");

    expect(() =>
      buildOrderRecord({
        session: checkoutSession({ customer: null }),
        lineItems: [lineItem()],
        invoice: null,
      }),
    ).toThrow("customer id");

    expect(() =>
      buildOrderRecord({
        session: checkoutSession({
          metadata: { clerkUserId: "user_123" },
          customer_details: { ...emptyCustomerDetails, email: null },
          customer_email: null,
        }),
        lineItems: [lineItem()],
        invoice: null,
      }),
    ).toThrow("email");

    expect(() =>
      buildOrderRecord({
        session: checkoutSession(),
        lineItems: [],
        invoice: null,
      }),
    ).toThrow("no line items");
  });

  it("requires the Sanity product id on each Stripe line item", () => {
    expect(() =>
      buildOrderRecord({
        session: checkoutSession(),
        lineItems: [lineItem({ product: stripeProduct({}) })],
        invoice: null,
      }),
    ).toThrow("Sanity product id");
  });

  it("rejects invalid line item quantities", () => {
    expect(() =>
      buildOrderRecord({
        session: checkoutSession(),
        lineItems: [lineItem({ quantity: 0 })],
        invoice: null,
      }),
    ).toThrow("invalid quantity");
  });

  it("maps pageable line items and falls back when discount metadata is absent", () => {
    const order = buildOrderRecord({
      session: checkoutSession({ amount_total: 4000 }),
      lineItems: [
        lineItem({
          id: "li_1",
          product: stripeProduct({
            id: "product-1",
            originalPrice: "20.00",
          }),
          amountTotal: 4000,
        }),
      ],
      invoice: null,
    });

    expect(order.amountDiscount).toBe(0);
    expect(order.products[0]?.discountPercent).toBe(0);
    expect(order.products[0]?.originalPrice).toBe(20);
  });
});

describe("fulfillPaidCheckoutSession", () => {
  it("creates an order and applies inventory on the first delivery", async () => {
    const { repository, createOrder, ensureInventory } = createRepository();
    const session = checkoutSession();

    const result = await fulfillPaidCheckoutSession(
      session,
      [lineItem()],
      null,
      repository,
      { eventId: "evt_123" },
    );

    expect(result.created).toBe(true);
    expect(result.order._id).toBe("order.cs_test_123");
    expect(result.order.stripeEventId).toBe("evt_123");
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(ensureInventory).toHaveBeenCalledTimes(1);
  });

  it("treats repeated webhook deliveries as the same fulfilled order", async () => {
    const { repository, createOrder, ensureInventory } = createRepository();
    const session = checkoutSession();

    const first = await fulfillPaidCheckoutSession(
      session,
      [lineItem()],
      null,
      repository,
      { eventId: "evt_1" },
    );
    const second = await fulfillPaidCheckoutSession(
      session,
      [lineItem()],
      null,
      repository,
      { eventId: "evt_2" },
    );

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.order._id).toBe(first.order._id);
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(ensureInventory).toHaveBeenCalledTimes(2);
    expect(second.order.inventoryUpdated).toBe(true);
  });

  it("does not need line items again when the order already exists", async () => {
    const { repository, createOrder } = createRepository();
    const session = checkoutSession();

    await fulfillPaidCheckoutSession(session, [lineItem()], null, repository);
    const retry = await fulfillPaidCheckoutSession(
      session,
      [],
      null,
      repository,
    );

    expect(retry.created).toBe(false);
    expect(createOrder).toHaveBeenCalledTimes(1);
  });

  it("handles two simultaneous deliveries without creating duplicate orders", async () => {
    const { repository, createOrder, ensureInventory } = createRepository();
    const session = checkoutSession();

    const results = await Promise.all([
      fulfillPaidCheckoutSession(session, [lineItem()], null, repository),
      fulfillPaidCheckoutSession(session, [lineItem()], null, repository),
    ]);

    expect(results.map((result) => result.created).sort()).toEqual([
      false,
      true,
    ]);
    expect(new Set(results.map((result) => result.order._id))).toEqual(
      new Set(["order.cs_test_123"]),
    );
    // Both deliveries tried to create; the loser recovered the winning order.
    expect(createOrder).toHaveBeenCalledTimes(2);
    expect(ensureInventory).toHaveBeenCalledTimes(2);
  });

  it("rejects sessions that Stripe has not marked paid", async () => {
    const { repository, createOrder } = createRepository();

    await expect(
      fulfillPaidCheckoutSession(
        checkoutSession({ payment_status: "unpaid" }),
        [lineItem()],
        null,
        repository,
      ),
    ).rejects.toBeInstanceOf(PaymentNotCompletedError);

    expect(createOrder).not.toHaveBeenCalled();
  });

  it("propagates repository failures so Stripe can retry the webhook", async () => {
    const { repository, createOrder } = createRepository();
    createOrder.mockRejectedValueOnce(new Error("Sanity unavailable"));

    await expect(
      fulfillPaidCheckoutSession(
        checkoutSession(),
        [lineItem()],
        null,
        repository,
      ),
    ).rejects.toThrow("Sanity unavailable");
  });
});
