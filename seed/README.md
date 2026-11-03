# Sanity sample catalog

`categories.json` contains Men, Women, and Unisex. `products.json` contains 10
sample products matching the product schema. Prices use the storefront's dollar
convention: `price` is the original price and `discount` is a percentage off.
Images are intentionally omitted so the image fallback can be verified.

Validate the JSON without connecting to Sanity:

```bash
npm run seed:dry
```

Set the Sanity values in `.env` (see `.env.example`):

- `VITE_SANITY_PROJECT_ID` / `VITE_SANITY_DATASET` (or the `SANITY_*` variants)
- `SANITY_API_TOKEN` with Editor/write permissions

Then import:

```bash
npm run seed:sanity
```

The script loads `.env` with `dotenv`, creates published documents, and prints
the project and dataset it is writing to. Confirm those values before importing.

Categories are created first, and products reference the returned Sanity IDs.
Existing documents with the same type and slug are skipped, preserving edits and
images. Rerunning resumes a partially completed import. Run one import at a
time; duplicate detection is not a concurrency lock. A slug with only a draft or
multiple published matches must be resolved in Studio before retrying.

Product images are omitted from the seed on purpose. Cards, search results, the
product page, cart and order history all render a designed fallback when an
image is missing or broken. To add real images, run the standalone Studio with
`npm run studio`, upload images, and publish the changes.

Edit JSON before the first import. Later JSON changes do not overwrite existing
documents; edit those entries in Studio. Changing a slug in JSON creates a new
entry on the next import.
