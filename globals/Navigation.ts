import type { Field, GlobalConfig } from 'payload'
import { isAdmin } from '@/lib/access'

/**
 * The real menu goes 4 levels deep (Products > Conveyor Belting > PVC Conveyor Belting > each
 * PVC type) - Payload array fields can nest, so this generates that fixed-depth structure
 * instead of hand-writing it 4 times. `remainingDepth` is how many more nested "Sub-items"
 * arrays are still allowed below this level.
 */
function navItemFields(remainingDepth: number): Field[] {
  const fields: Field[] = [
    { name: 'text', type: 'text', required: true, label: 'Label' },
    { name: 'href', type: 'text', required: true, label: 'Link (e.g. /about-us)' },
  ]
  if (remainingDepth > 0) {
    fields.push({
      name: 'children',
      type: 'array',
      label: 'Sub-items',
      fields: navItemFields(remainingDepth - 1),
    })
  }
  return fields
}

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation Menu',
  admin: {
    description: 'The header navigation menu - matches WordPress\'s Appearance > Menus.',
  },
  access: {
    read: () => true,
    // Menu editing is an Administrator-level capability in WordPress too (Editors don't get
    // "edit_theme_options" by default) - keep that split here.
    update: isAdmin,
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Menu Items',
      fields: navItemFields(3),
    },
  ],
}
