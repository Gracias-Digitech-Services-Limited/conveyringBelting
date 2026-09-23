import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
  },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf', 'video/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: 'Alt text carried over from the WordPress media library - used for accessibility and SEO.',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'wpId',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Original WordPress attachment ID (used to re-link content during migration).',
      },
      index: true,
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Original WordPress source URL this file was migrated from.',
      },
    },
  ],
}
