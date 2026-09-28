import type { CollectionConfig } from 'payload'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  labels: {
    singular: 'Enquiry',
    plural: 'Enquiries',
  },
  admin: {
    group: 'Inbox',
    useAsTitle: 'email',
    defaultColumns: ['name', 'company', 'email', 'createdAt'],
    hideAPIURL: true,
    description: 'Messages sent through the website contact form. A copy is also emailed to you.',
  },
  access: {
    // Only logged-in admin users can read submissions. Nobody creates them through the admin or
    // REST API - the contact form's server action uses the Local API, which bypasses access
    // control, so this only hides the pointless "Create New" button (and blocks API spam).
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'company',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
    },
  ],
}
