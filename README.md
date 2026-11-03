# ClothsWear

ClothsWear is a clothing storefront with a Vite + React single-page app, an
Express API, and a Sanity Studio for content editing. Clerk handles sign-in and
Stripe handles checkout and webhooks.

## Architecture

| Path      | Purpose                                                                 |
| --------- | ----------------------------------------------------------------------- |
| `src/`    | React 19 SPA: pages, components, hooks, Zustand cart, shared pricing     |
| `server/` | Express 5 API: products, categories, orders, checkout, Stripe webhooks  |
| `sanity/` | Sanity Studio schema and configuration                                  |
| `tests/`  | Vitest coverage for pricing, checkout validation and fulfillment        |
| `seed/`   | Optional sample catalog that can be imported into Sanity                |

The Sanity dataset is private. The browser never receives a Sanity token;
product and category reads go through the API, which uses a server-side Viewer
token. Orders require a Clerk session JWT, and the API always filters orders by
the verified `sub` claim. Browser-supplied user ids, prices, discounts and stock
values are never trusted.

### Pricing convention

- `price` is the original/list price.
- `discount` is a percentage off that price (`0`–`100`).
- The charged unit price is `price * (1 - discount / 100)`.
- Money is calculated in integer cents in `src/shared/pricing.ts`, shared by the
  storefront and the API.

### Checkout and webhook guarantees

- The API rebuilds every cart line from Sanity before creating a Stripe session.
- The order document id is derived from the Stripe checkout session id, so the
  webhook and success-page verification target the same order.
- Fulfillment treats duplicate document creation as a concurrent winner, reuses
  the existing order, and applies inventory with Sanity revision-based
  compare-and-swap updates. Repeated webhook deliveries are safe.
- Stripe is initialized lazily. Browsing products and the cart does not require
  a Stripe key.

## Requirements

- Node.js 22.12 or newer
- A Sanity project (private dataset recommended)
- A Clerk application
- A Stripe account (only needed for checkout)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Fill in the values described below. Do not commit `.env` or expose server
   tokens to the browser.

3. Generate Sanity TypeScript types (uses the local Sanity CLI):

   ```bash
   npm run typegen
   ```

4. Optionally import the sample catalog:

   ```bash
   npm run seed:dry
   npm run seed:sanity
   ```

5. Start the SPA and API together:

   ```bash
   npm run dev
   ```

   - Storefront: <http://localhost:5173>
   - API: <http://localhost:3001>
   - Sanity Studio (separate process): `npm run studio` → <http://localhost:3333>

Vite proxies `/api` to the API server in development. In production the Express
server serves the built SPA and API from the same origin.

## Environment variables

| Variable                     | Scope  | Required | Notes                                                              |
| ---------------------------- | ------ | -------- | ------------------------------------------------------------------ |
| `APP_URL`                    | server | yes      | Public storefront URL used for Stripe success/cancel redirects.    |
| `PORT`                       | server | no       | API port; defaults to `3001`.                                      |
| `VITE_API_URL`               | client | no       | API origin when it is not same-origin. Leave blank for localhost.  |
| `VITE_SANITY_PROJECT_ID`     | both   | yes      | Sanity project id.                                                 |
| `VITE_SANITY_DATASET`        | both   | yes      | Sanity dataset name.                                               |
| `VITE_SANITY_API_VERSION`    | both   | no       | Defaults to `2025-05-20`.                                          |
| `SANITY_API_READ_TOKEN`      | server | yes      | Viewer token for the private dataset. Never expose to the browser. |
| `SANITY_API_TOKEN`           | server | yes      | Editor/write token used for orders and inventory.                  |
| `VITE_CLERK_PUBLISHABLE_KEY` | client | yes      | Clerk publishable key.                                             |
| `CLERK_SECRET_KEY`           | server | yes      | Clerk secret key used to verify JWTs and read the customer.        |
| `CLERK_AUTHORIZED_PARTIES`   | server | no       | Comma-separated allowed origins for Clerk token verification.      |
| `STRIPE_SECRET_KEY`          | server | checkout | Stripe secret key. The storefront still runs without it.           |
| `STRIPE_WEBHOOK_SECRET`      | server | checkout | Stripe webhook signing secret (`whsec_...`).                       |

Server-side `SANITY_PROJECT_ID`, `SANITY_DATASET` and `SANITY_API_VERSION` are
also accepted and take precedence over the `VITE_*` values.

## Stripe webhook

Forward Stripe events to the API during development:

```bash
stripe listen --forward-to localhost:3001/api/webhook
```

Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`, then restart the
API. The webhook handles `checkout.session.completed` and
`checkout.session.async_payment_succeeded`.

The success page verifies the session with Stripe and can perform the same
idempotent fulfillment if the webhook is delayed.

## Scripts

| Command              | Description                                               |
| -------------------- | --------------------------------------------------------- |
| `npm run dev`        | Run the Vite dev server and API watcher together.         |
| `npm run dev:web`    | Run only the Vite dev server.                             |
| `npm run dev:api`    | Run only the API with `tsx watch`.                        |
| `npm run build`      | Type-check, build the SPA, then bundle the API with tsup. |
| `npm start`          | Serve the production build from `dist/`.                  |
| `npm run typecheck`  | Run `tsc --noEmit`.                                       |
| `npm run lint`       | Run ESLint across the repository.                         |
| `npm test`           | Run the Vitest suite once.                                |
| `npm run test:watch` | Run Vitest in watch mode.                                 |
| `npm run typegen`    | Extract the Sanity schema and regenerate types.           |
| `npm run studio`     | Start Sanity Studio locally.                              |
| `npm run studio:build` | Build the standalone Sanity Studio.                     |
| `npm run seed:sanity`| Import the sample catalog into Sanity.                    |
| `npm run seed:dry`   | Validate seed JSON without network requests.              |

## Production

```bash
npm run build
NODE_ENV=production npm start
```

`npm start` serves `dist/client` and falls back to `index.html` for client-side
routes. Set `APP_URL` to the public HTTPS origin and configure the Clerk and
Stripe dashboards with the same production URLs. Keep the API behind HTTPS so
Clerk JWTs and Stripe webhooks are protected in transit.

## Tests

The Vitest suite covers:

- cent-safe pricing, discounts and cart totals;
- checkout request validation, authoritative server-side repricing, stock
  limits and error details;
- webhook/order idempotency, including simultaneous duplicate deliveries;
- image-less product fallback rendering.

Run it with:

```bash
npm test
```
