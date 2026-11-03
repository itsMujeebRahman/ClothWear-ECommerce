import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import nextEnv from '@next/env';
import { createClient } from 'next-sanity';

const dryRun = process.argv.includes('--dry-run');
const unknownArgs = process.argv.slice(2).filter((arg) => arg !== '--dry-run');
if (unknownArgs.length) throw new Error(`Unknown arguments: ${unknownArgs.join(', ')}`);

async function readData(name) {
  return JSON.parse(await readFile(new URL(`../seed/${name}.json`, import.meta.url), 'utf8'));
}

function validate(categories, products) {
  const checkSlugs = (items, label) => {
    if (!Array.isArray(items)) throw new Error(`${label} must be an array`);
    const slugs = new Set();
    for (const item of items) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug ?? '') || slugs.has(item.slug)) {
        throw new Error(`Invalid or duplicate ${label} slug: ${item.slug}`);
      }
      slugs.add(item.slug);
    }
    return slugs;
  };
  const categorySlugs = checkSlugs(categories, 'category');
  checkSlugs(products, 'product');
  for (const category of categories) {
    if (!category.title?.trim()) throw new Error(`Missing category title: ${category.slug}`);
  }
  for (const product of products) {
    if (!product.name?.trim()) throw new Error(`Missing product name: ${product.slug}`);
    for (const key of ['price', 'discount', 'stock']) {
      if (!Number.isFinite(product[key]) || product[key] < 0) {
        throw new Error(`Invalid ${key} on ${product.slug}`);
      }
    }
    if (product.discount > 100 || !Number.isInteger(product.stock)) {
      throw new Error(`Invalid discount or stock on ${product.slug}`);
    }
    if (!['new', 'hot', 'sale'].includes(product.status) ||
        !['tshirt', 'jacket', 'pants', 'hoodie', 'short', 'others'].includes(product.variant)) {
      throw new Error(`Invalid status or variant on ${product.slug}`);
    }
    if (!Array.isArray(product.categorySlugs) || !product.categorySlugs.length ||
        product.categorySlugs.some((slug) => !categorySlugs.has(slug))) {
      throw new Error(`Unknown or missing categories on ${product.slug}`);
    }
  }
}

async function main() {
  const [categories, products] = await Promise.all([readData('categories'), readData('products')]);
  validate(categories, products);
  if (dryRun) {
    console.log(`Validated ${categories.length} categories and ${products.length} products. No network requests or writes made.`);
    return;
  }

  nextEnv.loadEnvConfig(process.cwd(), true);
  const required = ['NEXT_PUBLIC_SANITY_PROJECT_ID', 'NEXT_PUBLIC_SANITY_DATASET', 'SANITY_API_TOKEN'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-05-20',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
    perspective: 'raw',
  });
  console.log(`Seeding project ${client.config().projectId}, dataset ${client.config().dataset}`);

  // Use the actual returned document IDs for references. Existing documents
  // (including drafts) are skipped so later Studio edits and images survive.
  async function findOrCreate(type, slug, fields) {
    const matches = await client.fetch(
      '*[_type == $type && slug.current == $slug]{_id}', { type, slug },
    );
    if (matches.length) {
      const published = matches.filter((doc) => !doc._id.startsWith('drafts.') && !doc._id.startsWith('versions.'));
      if (published.length !== 1) {
        throw new Error(`Expected one published ${type} for slug "${slug}". Resolve duplicates or publish its draft in Studio, then rerun.`);
      }
      console.log(`Skipped existing ${type}: ${slug}`);
      return published[0];
    }
    const document = await client.create({ _type: type, ...fields, slug: { _type: 'slug', current: slug } });
    console.log(`Created ${type}: ${slug}`);
    return document;
  }

  const categoryIds = new Map();
  for (const { slug, title, description } of categories) {
    const category = await findOrCreate('category', slug, { title, description });
    categoryIds.set(slug, category._id);
  }
  for (const product of products) {
    const { slug, categorySlugs, name, intro, description, price, discount, stock, status, variant } = product;
    await findOrCreate('product', slug, {
      name, intro, description, price, discount, stock, status, variant,
      images: [],
      categories: categorySlugs.map((categorySlug) => ({
        _type: 'reference', _key: randomUUID(), _ref: categoryIds.get(categorySlug),
      })),
    });
  }
  console.log('Seed complete. Add images in /studio and publish your changes.');
}

main().catch((error) => {
  // Avoid logging request objects or headers that may contain credentials.
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
});
