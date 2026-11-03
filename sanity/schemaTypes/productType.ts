import { LuShoppingCart as TrolleyIcon } from "react-icons/lu";
import { defineField, defineType } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: TrolleyIcon,
  fields: [
    defineField({
      name: "name",
      title: "Product Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "images",
      title: "Product Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "intro",
      title: "Product Intro",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "string",
    }),
    defineField({
      name: "price",
      title: "Original price",
      type: "number",
      description:
        "The original/list price. The discount percentage is applied to this value.",
      validation: (Rule) => Rule.required().min(0.01),
    }),
    defineField({
      name: "discount",
      title: "Discount percentage",
      type: "number",
      description: "Percentage off the original price (0-100).",
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: "categories",
      title: "Category",
      type: "array",
      of: [{ type: "reference", to: { type: "category" } }],
    }),
    defineField({
      name: "stock",
      title: "Stock",
      type: "number",
      description:
        "Available units. Products without a stock value cannot be purchased.",
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: "status",
      title: "Product Status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Hot", value: "hot" },
          { title: "Sale", value: "sale" },
        ],
      },
    }),
    defineField({
      name: "variant",
      title: "Product Variant",
      type: "string",
      options: {
        list: [
          { title: "Tshirt", value: "tshirt" },
          { title: "Jacket", value: "jacket" },
          { title: "Pants", value: "pants" },
          { title: "Hoodie", value: "hoodie" },
          { title: "Short", value: "short" },
          { title: "Others", value: "others" },
        ],
      },
    }),
  ],

  preview: {
    select: {
      title: "name",
      media: "images",
      subtitle: "price",
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      const images = Array.isArray(media) ? media : [];
      const image = images[0];
      return {
        title,
        subtitle: `$${subtitle}`,
        media: image,
      };
    },
  },
});
