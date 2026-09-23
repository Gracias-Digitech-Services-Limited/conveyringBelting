import type { CollectionConfig } from 'payload'

export const StaffCards: CollectionConfig = {
  slug: 'staff-cards',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'title', 'email', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
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
        description: 'Used in the card URL: /card/[slug]',
      },
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
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
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
      name: 'wpId',
      type: 'number',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
