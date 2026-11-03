import { defineQuery } from "groq";

/**
 * Every GROQ query lives in this file and is registered with `defineQuery` so
 * Sanity TypeGen can generate exact result types. Keep the query strings and
 * the generated `src/types/sanity.types.ts` in sync with `npm run typegen`.
 */

export const PRODUCT_BY_SLUG_QUERY = defineQuery(
  `*[_type == "product" && slug.current == $slug][0]{
    _id, _type, _createdAt, _updatedAt, _rev,
    name, slug, images, intro, description, price, discount, categories,
    stock, status, variant
  }`,
);

export const PRODUCTS_QUERY = defineQuery(
  `*[_type == "product"] | order(name asc){
    _id, _type, _createdAt, _updatedAt, _rev,
    name, slug, images, intro, description, price, discount, categories,
    stock, status, variant
  }`,
);

export const PRODUCTS_BY_VARIANT_QUERY = defineQuery(
  `*[_type == "product" && variant == $productVariant] | order(name asc){
    _id, _type, _createdAt, _updatedAt, _rev,
    name, slug, images, intro, description, price, discount, categories,
    stock, status, variant
  }`,
);

export const PRODUCTS_BY_CATEGORY_QUERY = defineQuery(
  `*[
    _type == "product" &&
    references(*[_type == "category" && slug.current == $categorySlug]._id)
  ] | order(name asc){
    _id, _type, _createdAt, _updatedAt, _rev,
    name, slug, images, intro, description, price, discount, categories,
    stock, status, variant
  }`,
);

export const PRODUCTS_SEARCH_QUERY = defineQuery(
  `*[_type == "product" && name match $search] | order(name asc)[0...20]{
    _id, _type, _createdAt, _updatedAt, _rev,
    name, slug, images, intro, description, price, discount, categories,
    stock, status, variant
  }`,
);

export const PRODUCTS_BY_IDS_QUERY = defineQuery(
  `*[_type == "product" && _id in $ids]{
    _id, _type, _createdAt, _updatedAt, _rev,
    name, slug, images, intro, description, price, discount, categories,
    stock, status, variant
  }`,
);

export const CATEGORIES_QUERY = defineQuery(
  `*[_type == "category"] | order(title asc){
    _id, _type, _createdAt, _updatedAt, _rev,
    title, slug, description, image
  }`,
);

export const MY_ORDERS_QUERY = defineQuery(
  `*[_type == "order" && clerkUserId == $userId] | order(orderDate desc){
    _id, _type, _createdAt, _updatedAt, _rev,
    orderNumber, invoice, stripeCheckoutSessionId, stripeCustomerId,
    clerkUserId, customerName, email, stripePaymentIntentId,
    products[]{
      _key, name, originalPrice, unitPrice, discountPercent, quantity, lineTotal,
      product->{
        _id, _type, _createdAt, _updatedAt, _rev,
        name, slug, images, intro, description, price, discount, categories,
        stock, status, variant
      }
    },
    subtotal, totalPrice, currency, amountDiscount, status, orderDate,
    inventoryStatus
  }`,
);

export const ORDER_BY_SESSION_QUERY = defineQuery(
  `*[_type == "order" && stripeCheckoutSessionId == $sessionId][0]{
    _id, _type, _createdAt, _updatedAt, _rev,
    orderNumber, invoice, stripeCheckoutSessionId, stripeCustomerId,
    clerkUserId, customerName, email, stripePaymentIntentId,
    products[]{
      _key, name, originalPrice, unitPrice, discountPercent, quantity, lineTotal,
      "productId": product._ref,
      product->{
        _id, _type, _createdAt, _updatedAt, _rev,
        name, slug, images, intro, description, price, discount, categories,
        stock, status, variant
      }
    },
    subtotal, totalPrice, currency, amountDiscount, status, orderDate,
    inventoryStatus, inventoryUpdated
  }`,
);

export const ORDER_FOR_INVENTORY_QUERY = defineQuery(
  `*[_type == "order" && _id == $id][0]{
    _id, _rev, orderNumber, stripeCheckoutSessionId, inventoryStatus,
    inventoryUpdated, products[]{ _key, quantity, product }
  }`,
);

export const PRODUCT_STOCK_BY_IDS_QUERY = defineQuery(
  `*[_type == "product" && _id in $ids]{ _id, _rev, name, stock }`,
);
