import type { CollectionConfig } from 'payload'
import { revalidateAfterChange, revalidateAfterDelete } from '@/lib/revalidate'

/**
 * Publishing uses Payload's own draft system as the single source of truth: "Save Draft" keeps
 * changes private, "Publish changes" puts them live, "Unpublish" takes a page down. The website
 * only ever shows published pages (see app/(frontend)/[[...slug]]/page.tsx), and logged-in
 * editors can see an unpublished page in the real design via the Preview button.
 *
 * (This replaced a separate WordPress-style "Visibility" select that the website read instead -
 * two competing "draft" states that disagreed with each other. Its old values are still in the
 * database, unused; scripts/publish-live-pages.ts converted them once.)
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    group: 'Website',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
    hideAPIURL: true,
    description:
      'The pages of your website. "Save Draft" keeps changes private, "Preview" shows them in the website design, and "Publish changes" puts them live.',
    // Opens the page on the real site in preview mode, showing unpublished changes. The route
    // checks the editor is logged in before enabling it.
    preview: (doc) =>
      typeof doc?.slug === 'string' && doc.slug ? `/next/preview?slug=${encodeURIComponent(doc.slug)}` : null,
  },
  access: {
    // Visitors (and the public REST/GraphQL API) only ever get published pages - drafts stay
    // private to logged-in editors. The website itself reads via the Local API, which filters
    // on _status explicitly.
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
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
