import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod/v4'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      // Specify the type of content in this collection
      type: 'page',
      // Load every file inside the `content` directory
      source: {
        include: 'blog/**',
        exclude: ['blog/private/**'],
      },
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.date(),
        tags: z.array(z.string()).optional(),
        draft: z.boolean().default(false),
      }),
    }),
    dictionary: defineCollection({
      type: 'data',
      source: {
        include: 'dictionary/**',
      },
      schema: z.object({
        title: z.string(),
        body: z.record(z.string(), z.string().or(z.array(z.string()))),
      }),
    }),
    messages: defineCollection({
      type: 'data',
      source: {
        include: 'messages/**',
      },
      schema: z.object({
        messages: z.object({
          name: z.string(),
          content: z.string(),
          date: z.date(),
        }),
      }),
    }),
  },
})
