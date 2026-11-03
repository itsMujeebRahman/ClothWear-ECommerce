import { Router } from "express";
import { getReadClient } from "../sanity/client.js";

const router = Router();

/**
 * Server-sent invalidations for public product/category changes. No product
 * rows or tokens are sent to the browser; only a signal that cached storefront
 * queries should be refreshed.
 */
router.get("/live", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  let closed = false;
  const heartbeat = setInterval(() => {
    if (!closed) {
      res.write(": heartbeat\n\n");
    }
  }, 25_000);

  const subscription = getReadClient()
    .listen('*[_type in ["product", "category"]]')
    .subscribe({
      next: () => {
        if (!closed) {
          res.write("event: invalidate\ndata: {}\n\n");
        }
      },
      error: (error) => {
        console.error("Sanity live subscription failed", error);
        if (!closed) {
          res.write("event: error\ndata: {}\n\n");
        }
      },
    });

  const cleanup = () => {
    if (closed) {
      return;
    }
    closed = true;
    clearInterval(heartbeat);
    subscription.unsubscribe();
    res.end();
  };

  req.on("close", cleanup);
  req.on("aborted", cleanup);
});

export default router;
