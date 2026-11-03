import { Router } from "express";
import { requireAuthenticatedUserId } from "../auth.js";
import { getReadClient } from "../sanity/client.js";
import { MY_ORDERS_QUERY } from "../../src/lib/sanity/queries.js";

const router = Router();

/**
 * Orders are always filtered by the verified Clerk user id. The browser never
 * receives another user's orders, even if it guesses query parameters.
 */
router.get("/orders", async (req, res, next) => {
  try {
    const userId = await requireAuthenticatedUserId(req);
    const orders = await getReadClient().fetch(MY_ORDERS_QUERY, { userId });

    res.set("Cache-Control", "private, no-store");
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

export default router;
