import type {
  MY_ORDERS_QUERY_RESULT,
  PRODUCT_BY_SLUG_QUERY_RESULT,
} from "@/types/sanity.types";

export type ProductDetail = PRODUCT_BY_SLUG_QUERY_RESULT;
export type Order = MY_ORDERS_QUERY_RESULT[number];

export type CheckoutResponse = {
  url: string;
  orderNumber: string;
};

export type CheckoutSessionResponse =
  | { status: "paid"; order: Order }
  | { status: "processing"; paymentStatus?: string | null }
  | { status: "expired" };
