import type { CollectionConfig } from 'payload'
import { revalidateAfterChange, revalidateAfterDelete } from '@/lib/revalidate'

/** "Mary O'Brien" -> "mary-obrien": lowercase, accents/apostrophes dropped, words hyphenated. */
function toSlug(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const StaffCards: CollectionConfig = {
  slug: 'staff-cards',
  labels: { singular: 'Business Card', plural: 'Business Cards' },
  admin: {
    group: 'Team',
    useAsTitle: 'name',
    defaultColumns: ['name', 'title', 'email', 'updatedAt'],
    hideAPIURL: true,
    description:
      'Digital business cards. Add a person and save - their card page and QR code are created automatically, ready to download and print.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    {
      // Live QR code for this card's web page, with PNG/SVG downloads - so the admin can print
      // it straight from here. Display-only (a `ui` field stores nothing).
      name: 'qrCode',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/admin/CardQrField#CardQrField' },
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Card address',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          "The end of the card's web link (/card/...). Leave blank to create it from the name. Changing it breaks QR codes already printed.",
      },
      hooks: {
        // Fill from the name when left blank, and tidy whatever was typed into a URL-safe form.
        beforeValidate: [({ value, data }) => toSlug(String(value || data?.name || ''))],
      },
      validate: (value: unknown) => (value ? true : 'Enter a name so the card address can be created.'),
    },
    {
      name: 'title',
      type: 'text',
      label: 'Job Title',
    },
    {
      name: 'org',
      type: 'text',
      label: 'Organisation',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'address',
      type: 'textarea',
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      // Carried over from WordPress but deliberately ignored by the website: cards are handed
      // out as printed QR codes, so their link must keep working whatever this says (see
      // lib/staffCards.ts). Hidden so it doesn't look like an on/off switch - delete a card to
      // take its link down.
      name: 'status',
      type: 'select',
      defaultValue: 'publish',
      admin: { hidden: true },
      options: [
        { label: 'Published', value: 'publish' },
        { label: 'Draft', value: 'draft' },
        { label: 'Private', value: 'private' },
      ],
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'qrStyle',
      type: 'group',
      label: 'QR Code Style',
      fields: [
        {
          name: 'dotsType',
          type: 'select',
          defaultValue: 'dots',
          options: [
            { label: 'Dots', value: 'dots' },
            { label: 'Rounded', value: 'rounded' },
            { label: 'Classy', value: 'classy' },
            { label: 'Square', value: 'square' },
          ],
        },
        {
          name: 'color',
          type: 'text',
          defaultValue: '#0f172a',
          admin: { description: 'Hex colour for the QR dots.' },
        },
        {
          name: 'backgroundColor',
          type: 'text',
          defaultValue: '#ffffff',
        },
      ],
    },
    {
      // WordPress migration metadata - never edited by hand.
      name: 'wpId',
      type: 'number',
      admin: { hidden: true },
    },
  ],
}
