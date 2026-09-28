import type { CollectionConfig } from 'payload'
import { revalidateAfterChange, revalidateAfterDelete } from '@/lib/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image or File', plural: 'Images & Files' },
  admin: {
    group: 'Media Library',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    hideAPIURL: true,
    description: 'Photos, PDFs and videos used across the website. Upload once, then pick them on any page.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    // Pages embed images/PDFs by reference, so alt text or file changes need a site refresh.
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf', 'video/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt text',
      admin: {
        description: 'Describe the image in a few words (e.g. "PVC conveyor belt on a bakery line"). Helps Google and visitors using screen readers.',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
    // WordPress migration metadata - used by the seed script to re-link content, never edited.
    {
      name: 'wpId',
      type: 'number',
      admin: { hidden: true },
      index: true,
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: { hidden: true },
    },
  ],
}
