export interface OrderLineRecord {
  _key: string;
  product: {
    _type: "reference";
    _ref: string;
    _weak?: boolean;
  };
  name: string;
  originalPrice: number;
  unitPrice: number;
  discountPercent: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderInvoice {
  id?: string | null;
  number?: string | null;
  hosted_invoice_url?: string | null;
}

export interface OrderRecord {
  _id: string;
  _type: "order";
  _rev?: string;
  orderNumber: string;
  invoice?: OrderInvoice | null;
  stripeCheckoutSessionId: string;
  stripeEventId?: string | null;
  stripeCustomerId: string;
  clerkUserId: string;
  customerName: string;
  email: string;
  stripePaymentIntentId: string;
  products: OrderLineRecord[];
  subtotal: number;
  totalPrice: number;
  currency: string;
  amountDiscount: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  inventoryStatus?: "pending" | "updated" | "insufficient_stock" | null;
  inventoryUpdated?: boolean | null;
  inventoryUpdatedAt?: string | null;
  orderDate: string;
}

export interface InventoryOutcome {
  order: OrderRecord;
  updated: boolean;
  reason?: "insufficient_stock" | "already_updated";
}
