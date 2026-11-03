import { Router, type Request, type Response } from "express";
import express from "express";
import type Stripe from "stripe";
import { getStripe, getWebhookSecret } from "../stripe/client.js";
import { isHttpError } from "../lib/errors.js";
import {
  listAllCheckoutLineItems,
  retrieveInvoiceForSession,
  toOrderInvoice,
} from "../services/stripeHelpers.js";
import {
  fulfillPaidCheckoutSession,
  PaymentNotCompletedError,
} from "../services/fulfillment.js";
import { fulfillmentRepository } from "../services/orderRepository.js";

const router = Router();

function getSignature(req: Request): string | null {
  const header = req.headers["stripe-signature"];
  if (typeof header === "string" && header.trim()) {
    return header;
  }
  return null;
}

router.post(
  "/",
  express.raw({ type: "application/json", limit: "1mb" }),
  async (req: Request, res: Response) => {
    const signature = getSignature(req);
    if (!signature) {
      res.status(400).json({ error: "missing_signature" });
      return;
    }

    let stripe: Stripe;
    try {
      stripe = getStripe();
    } catch (error) {
      console.error("Stripe webhook is not configured", error);
      res.status(503).json({ error: "webhook_unavailable" });
      return;
    }

    let event: Stripe.Event;
    try {
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : typeof req.body === "string"
          ? req.body
          : "";
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        getWebhookSecret(),
      );
    } catch (error) {
      console.error("Stripe webhook signature verification failed", error);
      res.status(400).json({ error: "invalid_signature" });
      return;
    }

    if (
      event.type !== "checkout.session.completed" &&
      event.type !== "checkout.session.async_payment_succeeded"
    ) {
      res.json({ received: true });
      return;
    }

    const session = event.data.object;
    if (session.payment_status !== "paid") {
      res.json({ received: true, pending: true });
      return;
    }

    try {
      // Invoice retrieval, line-item pagination and order/inventory writes are
      // all inside this boundary. Any failure returns 500 so Stripe retries;
      // fulfillment itself is idempotent.
      const invoice = await retrieveInvoiceForSession(stripe, session);
      const lineItems = await listAllCheckoutLineItems(stripe, session.id);

      await fulfillPaidCheckoutSession(
        session,
        lineItems,
        toOrderInvoice(invoice),
        fulfillmentRepository,
        { eventId: event.id },
      );

      res.json({ received: true });
    } catch (error) {
      if (error instanceof PaymentNotCompletedError) {
        res.json({ received: true, pending: true });
        return;
      }
      console.error("Stripe webhook processing failed", {
        eventId: event.id,
        eventType: event.type,
        error,
      });
      const status = isHttpError(error) && error.status === 503 ? 503 : 500;
      res.status(status).json({ error: "processing_failed" });
    }
  },
);

export default router;
