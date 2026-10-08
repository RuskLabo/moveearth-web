import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Item ids (namespace:path) this page explains. MoveEarth's in-game wiki opens
        // the page when a player points at one of them and presses the wiki key.
        items: z.array(z.string().regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/)).optional(),
      }),
    }),
  }),
};
