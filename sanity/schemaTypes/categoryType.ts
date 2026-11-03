import { LuTag as TagIcon } from "react-icons/lu";
import {defineField, defineType} from 'sanity'

export const categoryType = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
    defineField({
      name: 'description',
      type: 'text',
    }),
    defineField({
      name: "image",
      title: "category Image",
      type: "image",
      options:{
        hotspot: true,
      },
    }),
  ],
  preview:{
    select:{
      title:"title",
      subtitle:"description",
      media:"image",
    },
  },
});
