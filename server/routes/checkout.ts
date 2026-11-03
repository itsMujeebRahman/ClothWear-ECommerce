import { Router } from "express";
import { requireAuthenticatedUserId } from "../auth.js";
import { getStripe } from "../stripe/client.js";
import { HttpError } from "../lib/errors.js";
import { createCheckoutSession } from "../services/checkout.js";
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

router.post("/checkout", async (req, res, next) => {
  try {
    const userId = await requireAuthenticatedUserId(req);
    const result = await createCheckoutSession(userId, req.body);
    res.set("Cache-Control", "no-store");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Verifies the Stripe session server-side for the success page. If Stripe's
 * webhook is delayed, this endpoint performs the same idempotent fulfillment
 * as the webhook, so a paid customer still gets an order.
 */
router.get("/checkout/session", async (req, res, next) => {
  try {
    const userId = await requireAuthenticatedUserId(req);
    const sessionId =
      typeof req.query.session_id === "string"
        ? req.query.session_id.trim()
        : "";

    if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
      throw new HttpError(400, "invalid_session", "Invalid checkout session.");
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.clerkUserId !== userId) {
      throw new HttpError(
        403,
        "forbidden",
        "This checkout session belongs to another account.",
      );
    }

    if (session.status === "expired") {
      res.set("Cache-Control", "no-store");
      res.json({ status: "expired" });
      return;
    }

    if (session.payment_status !== "paid") {
      res.set("Cache-Control", "no-store");
      res.json({
        status: "processing",
        paymentStatus: session.payment_status,
      });
      return;
    }

    const existing = await fulfillmentRepository.findOrderBySessionId(
      session.id,
    );

    if (existing) {
      res.set("Cache-Control", "no-store");
      res.json({ status: "paid", order: existing });
      return;
    }

    // Invoice retrieval and fulfillment happen inside this try so failures are
    // retried by the shopper (and by Stripe's webhook), not swallowed.
    const invoice = await retrieveInvoiceForSession(stripe, session);
    const lineItems = await listAllCheckoutLineItems(stripe, session.id);
    const result = await fulfillPaidCheckoutSession(
      session,
      lineItems,
      toOrderInvoice(invoice),
      fulfillmentRepository,
    );

    res.set("Cache-Control", "no-store");
    res.json({ status: "paid", order: result.order });
  } catch (error) {
    if (error instanceof PaymentNotCompletedError) {
      res.set("Cache-Control", "no-store");
      res.json({ status: "processing", paymentStatus: "unpaid" });
      return;
    }
    next(error);
  }
});

export default router;
