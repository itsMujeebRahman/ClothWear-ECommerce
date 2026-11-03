import Stripe from "stripe";
import { getStripe } from "../stripe/client.js";
import { getReadClient } from "../sanity/client.js";
import { PRODUCTS_BY_IDS_QUERY } from "../../src/lib/sanity/queries.js";
import type { PRODUCTS_BY_IDS_QUERY_RESULT } from "../../src/types/sanity.types.js";
import { serverEnv } from "../config.js";
import { getCustomerIdentity } from "../auth.js";
import { HttpError } from "../lib/errors.js";
import { getServerImageUrl } from "../sanity/image.js";
import {
  buildCheckoutSummary,
  parseCheckoutRequest,
} from "../validation/checkout.js";
import { createOrderNumber } from "./fulfillment.js";

export interface CheckoutSessionResult {
  url: string;
  orderNumber: string;
}

async function getOrCreateStripeCustomer(
  stripe: Stripe,
  identity: { clerkUserId: string; email: string; name: string },
): Promise<Stripe.Customer> {
  const existing = await stripe.customers.list({
    email: identity.email,
    limit: 1,
  });
  const customer = existing.data.find((item) => !item.deleted);
  if (customer) {
    return customer;
  }

  return stripe.customers.create({
    email: identity.email,
    name: identity.name,
    metadata: {
      clerkUserId: identity.clerkUserId,
    },
  });
}

function appUrl(path: string): string {
  return `${serverEnv.appUrl.replace(/\/$/, "")}${path}`;
}

/**
 * Creates a Stripe Checkout session from server-fetched products. The request
 * only supplies product ids and quantities; identity, names, prices, discounts
 * and stock all come from Clerk/Sanity on the server.
 */
export async function createCheckoutSession(
  clerkUserId: string,
  body: unknown,
): Promise<CheckoutSessionResult> {
  const cart = parseCheckoutRequest(body);
  const products = (await getReadClient().fetch(PRODUCTS_BY_IDS_QUERY, {
    ids: cart.map((item) => item.productId),
  })) as PRODUCTS_BY_IDS_QUERY_RESULT;

  const summary = buildCheckoutSummary(cart, products);
  const productsById = new Map(products.map((product) => [product._id, product]));
  const identity = await getCustomerIdentity(clerkUserId);
  const stripe = getStripe();
  const customer = await getOrCreateStripeCustomer(stripe, identity);
  const orderNumber = createOrderNumber();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    summary.lines.map((line) => {
      const product = productsById.get(line.productId);
      const imageUrl = getServerImageUrl(product?.images?.[0]);

      return {
        quantity: line.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(line.unitPrice * 100),
          product_data: {
            name: line.name.slice(0, 250),
            description:
              line.discountPercent > 0
                ? `${line.discountPercent}% off the original price`
                : undefined,
            metadata: {
              id: line.productId,
              originalPrice: line.originalUnitPrice.toFixed(2),
              discountPercent: String(line.discountPercent),
            },
            images: imageUrl ? [imageUrl] : undefined,
          },
        },
      };
    });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      invoice_creation: {
        enabled: true,
      },
      customer: customer.id,
      client_reference_id: clerkUserId,
      metadata: {
        orderNumber,
        clerkUserId,
        customerName: identity.name,
        customerEmail: identity.email,
      },
      payment_intent_data: {
        metadata: {
          orderNumber,
          clerkUserId,
        },
      },
      success_url: `${appUrl("/success")}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: appUrl("/cart"),
      line_items: lineItems,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return { url: session.url, orderNumber };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Stripe checkout session creation failed", error);
    throw new HttpError(
      502,
      "checkout_failed",
      "We could not start checkout. Please try again.",
    );
  }
}
