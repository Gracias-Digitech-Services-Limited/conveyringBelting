import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminFieldAccess } from '@/lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    // WordPress-style roles: only Administrators manage the user list, but - same as WP -
    // any logged-in user can still see/update their own profile.
    read: ({ req }) => {
      if (req.user?.role === 'admin') return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    create: isAdmin,
    update: ({ req }) => {
      if (req.user?.role === 'admin') return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: {
        // Only admins can promote/demote a user - an editor can't grant themselves admin rights.
        update: isAdminFieldAccess,
      },
    },
  ],
}
