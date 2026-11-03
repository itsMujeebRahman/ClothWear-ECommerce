import { LuShoppingBasket as BasketIcon } from "react-icons/lu";
import { defineArrayMember, defineField, defineType } from "sanity";

export const orderTypes = defineType({
  name: "order",
  title: "Order",
  type: "document",
  icon: BasketIcon,
  fields: [
    defineField({
      name: "orderNumber",
      title: "Order Number",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    {
      name: "invoice",
      type: "object",
      fields: [
        { name: "id", type: "string" },
        { name: "number", type: "string" },
        { name: "hosted_invoice_url", type: "url" },
      ],
    },
    defineField({
      name: "stripeCheckoutSessionId",
      title: "Stripe Checkout Session Id",
      type: "string",
    }),
    defineField({
      name: "stripeEventId",
      title: "Stripe Event Id",
      type: "string",
    }),
    defineField({
      name: "stripeCustomerId",
      title: "Stripe Customer Id",
      type: "string",
      description: "The Stripe customer object id (cus_...), not the email.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "clerkUserId",
      title: "Clerk User Id",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "customerName",
      title: "Customer Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "email",
      title: "Customer Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "stripePaymentIntentId",
      title: "Stripe Payment Intent ID",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "products",
      title: "Products",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "product",
              title: "Product Bought",
              type: "reference",
              to: [{ type: "product" }],
            }),
            defineField({
              name: "name",
              title: "Purchased name",
              type: "string",
              description:
                "Historical product name captured at payment time. Product documents can change later.",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "originalPrice",
              title: "Original unit price",
              type: "number",
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: "unitPrice",
              title: "Paid unit price",
              type: "number",
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: "discountPercent",
              title: "Discount percentage applied",
              type: "number",
              validation: (Rule) => Rule.required().min(0).max(100),
            }),
            defineField({
              name: "quantity",
              title: "Quantity Purchased",
              type: "number",
              validation: (Rule) => Rule.required().integer().min(1),
            }),
            defineField({
              name: "lineTotal",
              title: "Line total",
              type: "number",
              validation: (Rule) => Rule.required().min(0),
            }),
          ],
          preview: {
            select: {
              product: "product.name",
              quantity: "quantity",
              image: "product.images",
              price: "unitPrice",
              currency: "product.currency",
            },
            prepare(select) {
              const name =
                typeof select.product === "string" ? select.product : "Product";
              const quantity =
                typeof select.quantity === "number" ? select.quantity : 0;
              const price =
                typeof select.price === "number" ? select.price : 0;
              const images = Array.isArray(select.image) ? select.image : [];
              return {
                title: `${name} x ${quantity}`,
                subtitle: `${price * quantity}`,
                media: images[0],
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "subtotal",
      title: "Subtotal (before discounts)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "totalPrice",
      title: "Total Price",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "amountDiscount",
      title: "Amount Discount",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "status",
      title: "Order Status",
      type: "string",
      options: {
        list: [
          {
            title: "Pending",
            value: "pending",
          },
          {
            title: "Paid",
            value: "paid",
          },
          {
            title: "Shipped",
            value: "shipped",
          },
          {
            title: "Delivered",
            value: "delivered",
          },
          {
            title: "Cancelled",
            value: "cancelled",
          },
        ],
      },
    }),
    defineField({
      name: "inventoryStatus",
      title: "Inventory status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Updated", value: "updated" },
          { title: "Needs review", value: "insufficient_stock" },
        ],
      },
    }),
    defineField({
      name: "inventoryUpdated",
      title: "Inventory updated",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "inventoryUpdatedAt",
      title: "Inventory updated at",
      type: "datetime",
    }),
    defineField({
      name: "orderDate",
      title: "Order Date",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      name: "customerName",
      amount: "totalPrice",
      currency: "currency",
      orderId: "orderNumber",
      email: "email",
    },
    prepare(select) {
      const orderId =
        typeof select.orderId === "string" ? select.orderId : "";
      const orderIdSnippet = orderId
        ? `${orderId.slice(0, 5)}...${orderId.slice(-5)}`
        : "Unknown order";
      const name =
        typeof select.name === "string" ? select.name : "Unknown customer";
      const amount =
        typeof select.amount === "number" ? select.amount : 0;
      const currency =
        typeof select.currency === "string" ? select.currency : "";
      return {
        title: `${name} (${orderIdSnippet})`,
        subtitle: `${amount} ${currency}, ${select.email ?? ""}`,
        media: BasketIcon,
      };
    },
  },
});
