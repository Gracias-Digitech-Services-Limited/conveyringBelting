import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'needsCopy'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL path segment, e.g. "bakery-industry" for /bakery-industry',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        description: 'Optional parent page, used for breadcrumbs / nested paths.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Published', value: 'publish' },
        { label: 'Draft', value: 'draft' },
        { label: 'Private', value: 'private' },
      ],
    },
    {
      name: 'needsCopy',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Flagged during migration - this page had no content in the old WordPress export and needs new copy written.',
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'embeds',
      type: 'group',
      admin: {
        description: 'YouTube video / PDF embeds carried over from the live site - the plain-text WordPress export dropped these, so they are restored separately (see data/conveyorbelting-embeds-supplement.json).',
      },
      fields: [
        {
          name: 'youtubeVideoId',
          type: 'text',
        },
        {
          name: 'youtubeTitle',
          type: 'text',
        },
        {
          name: 'pdfAttachment',
          type: 'relationship',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
        },
        {
          name: 'metaDescription',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'migration',
      type: 'group',
      admin: {
        position: 'sidebar',
        description: 'Read-only metadata carried over from the WordPress export, kept for redirect and audit purposes.',
      },
      fields: [
        {
          name: 'wpId',
          type: 'number',
          admin: { readOnly: true },
          index: true,
        },
        {
          name: 'legacyUrl',
          type: 'text',
          admin: { readOnly: true },
        },
        {
          name: 'contentType',
          type: 'select',
          options: [
            { label: 'Page', value: 'page' },
            { label: 'Blog Post', value: 'post' },
          ],
          defaultValue: 'page',
        },
        {
          name: 'modifiedAt',
          type: 'date',
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
