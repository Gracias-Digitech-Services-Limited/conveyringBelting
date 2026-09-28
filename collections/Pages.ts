import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    group: 'Website',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
    hideAPIURL: true,
    description: 'The pages of your website - text, images, videos and how each appears in Google.',
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
      label: 'Page address',
      admin: {
        position: 'sidebar',
        description: 'The end of the web address, e.g. "bakery-industry" for /bakery-industry. Changing this breaks existing links.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: 'Visibility',
      options: [
        { label: 'Published', value: 'publish' },
        { label: 'Draft', value: 'draft' },
        { label: 'Private', value: 'private' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Only Published pages appear on the website.',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'pages',
      label: 'Parent page',
      admin: {
        position: 'sidebar',
        description: 'Optional - the page this one sits under, for breadcrumbs.',
      },
    },
    {
      name: 'needsCopy',
      type: 'checkbox',
      defaultValue: false,
      label: 'Needs new text',
      admin: {
        description: 'Tick if this page still needs its text written - it shows a placeholder on the website until then.',
        position: 'sidebar',
      },
    },
    {
      // Unnamed tabs only change the editing layout - the fields inside are still stored at the
      // top level (content, embeds, seo), so no data migration or frontend change is needed.
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'content',
              type: 'richText',
              label: false,
            },
          ],
        },
        {
          label: 'Video & PDF',
          fields: [
            {
              name: 'embeds',
              type: 'group',
              label: false,
              admin: {
                description: 'Optional - a YouTube video and/or a PDF shown below the page text.',
              },
              fields: [
                {
                  name: 'youtubeVideoId',
                  type: 'text',
                  label: 'YouTube video ID',
                  admin: {
                    description: 'The part after "v=" in the YouTube link, e.g. dQw4w9WgXcQ',
                  },
                },
                {
                  name: 'youtubeTitle',
                  type: 'text',
                  label: 'Video title',
                },
                {
                  name: 'pdfAttachment',
                  type: 'relationship',
                  relationTo: 'media',
                  label: 'PDF',
                },
              ],
            },
          ],
        },
        {
          label: 'Google / SEO',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: false,
              admin: {
                description: 'How this page appears in Google search results. Leave blank to use the page title.',
              },
              fields: [
                {
                  name: 'metaTitle',
                  type: 'text',
                  label: 'Title in Google',
                  admin: { description: 'Around 50-60 characters.' },
                },
                {
                  name: 'metaDescription',
                  type: 'textarea',
                  label: 'Description in Google',
                  admin: { description: 'Around 150-160 characters.' },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      // WordPress migration metadata - used by code (legacy redirects, sitemap dates), never
      // edited by hand, so it's kept out of the editing screen entirely.
      name: 'migration',
      type: 'group',
      admin: { hidden: true },
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
