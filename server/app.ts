import { existsSync } from "node:fs";
import path from "node:path";
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";
import { serverEnv } from "./config.js";
import { HttpError } from "./lib/errors.js";
import checkoutRoutes from "./routes/checkout.js";
import liveRoutes from "./routes/live.js";
import orderRoutes from "./routes/orders.js";
import productRoutes from "./routes/products.js";
import webhookRoutes from "./routes/webhook.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  const allowedOrigin = (() => {
    try {
      return new URL(serverEnv.appUrl).origin;
    } catch {
      return null;
    }
  })();

  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
    });

    const origin = req.headers.origin;
    if (allowedOrigin && origin === allowedOrigin) {
      res.set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        Vary: "Origin",
      });
    }

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });

  // The webhook needs the raw body for Stripe signature verification, so it
  // must be mounted before the JSON body parser.
  app.use("/api/webhook", webhookRoutes);

  app.use(express.json({ limit: "200kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", productRoutes);
  app.use("/api", orderRoutes);
  app.use("/api", checkoutRoutes);
  app.use("/api", liveRoutes);

  app.use("/api", ((_req, res) => {
    res.status(404).json({
      error: "not_found",
      message: "API route not found.",
    });
  }) satisfies RequestHandler);

  const clientDist = path.resolve(process.cwd(), "dist/client");
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false }));
    app.use(((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, "index.html"));
    }) satisfies RequestHandler);
  }

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (res.headersSent) {
      return;
    }

    if (error instanceof HttpError) {
      res.status(error.status).json({
        error: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
      return;
    }

    const bodyError = error as { type?: string; status?: number };
    if (bodyError.type === "entity.parse.failed") {
      res.status(400).json({
        error: "invalid_json",
        message: "The request body is not valid JSON.",
      });
      return;
    }

    console.error("Unhandled API error", error);
    res.status(500).json({
      error: "internal_error",
      message: "Something went wrong. Please try again.",
    });
  };

  app.use(errorHandler);

  return app;
}
