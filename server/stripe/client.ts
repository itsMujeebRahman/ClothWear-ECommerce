import Stripe from "stripe";
import { requireEnv, serverEnv } from "../config.js";
import { MissingConfigurationError } from "../lib/errors.js";

/**
 * Stripe is initialized lazily so that browsing the cart (and the rest of the
 * storefront/API) never requires a Stripe key. The key is only read when a
 * checkout session, invoice, or webhook is actually handled.
 */
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripe) {
    return stripe;
  }

  if (!serverEnv.stripe.secretKey) {
    throw new MissingConfigurationError(
      "Checkout is temporarily unavailable. Stripe is not configured.",
    );
  }

  stripe = new Stripe(serverEnv.stripe.secretKey, {
    apiVersion: "2026-10-28.endive",
    appInfo: {
      name: "ClothWear",
      version: "1.0.0",
    },
  });

  return stripe;
}

export function getWebhookSecret(): string {
  const secret = requireEnv(
    serverEnv.stripe.webhookSecret,
    "STRIPE_WEBHOOK_SECRET",
  );
  if (!secret) {
    throw new MissingConfigurationError(
      "Stripe webhook secret is not configured.",
    );
  }
  return secret;
}
