# Sanity sample catalog

`categories.json` contains Men, Women, and Unisex. `products.json` contains 10
sample products matching the existing product schema. Prices use the storefront's
existing dollar convention. Images are intentionally omitted.

Validate the JSON without connecting to Sanity:

```bash
npm run seed:sanity -- --dry-run
```

Set `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and
`SANITY_API_TOKEN` (Editor permissions) in `.env`, then import:

```bash
npm run seed:sanity
```

The script uses Next.js environment loading, including `.env.local` overrides.
Check the printed project and dataset when running. It creates published content,
so imported products can appear immediately on the storefront.

Categories are created first, and products reference their returned Sanity IDs.
Existing documents with the same type and slug are skipped, preserving edits
and images. Rerunning resumes a partially completed import. Run one import at a
time; duplicate detection is not a concurrency lock. A slug with only a draft or
multiple published matches must be resolved in Studio before retrying.

Open `/studio` after importing, upload images for each product and category,
and publish the changes. Some existing storefront components expect a product
image, so add images before browsing the seeded products on the storefront.

Edit JSON before the first import. Later JSON changes do not overwrite existing
documents; edit those entries in Studio. Changing a slug in JSON creates a new
entry on the next import.
