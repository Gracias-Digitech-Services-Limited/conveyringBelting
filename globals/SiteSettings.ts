import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/lib/access'
import { revalidateAfterChange } from '@/lib/revalidate'

/**
 * Site-wide branding and copy that WordPress would normally split across Settings > General,
 * the Customizer (site identity, homepage sections) and widgets (footer contact info) - kept
 * as one global here since it's all "who we are / how to reach us" content.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    hideAPIURL: true,
    description: 'Homepage text, contact details and branding used across the whole website.',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
  },
  fields: [
    {
      // Unnamed tabs only group the editing screen - every field is still stored at the top
      // level, so lib/siteSettings.ts and existing data are unaffected.
      type: 'tabs',
      tabs: [
        {
          label: 'Homepage',
          fields: [
            {
              name: 'homepageHero',
              type: 'group',
              label: 'Top banner',
              fields: [
                { name: 'eyebrow', type: 'text', label: 'Small text above the heading', defaultValue: 'PTB Innovation Ltd' },
                { name: 'heading', type: 'text', defaultValue: 'Conveyor Belting Ireland' },
                {
                  type: 'row',
                  fields: [
                    { name: 'primaryCtaLabel', type: 'text', label: 'Main button text', defaultValue: 'Get a Quote' },
                    { name: 'primaryCtaHref', type: 'text', label: 'Main button link', defaultValue: '/contact-us' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'secondaryCtaLabel', type: 'text', label: 'Second button text', defaultValue: 'Browse Industries' },
                    { name: 'secondaryCtaHref', type: 'text', label: 'Second button link', defaultValue: '/industries' },
                  ],
                },
              ],
            },
            {
              name: 'trustBadges',
              type: 'array',
              label: 'Highlights under the banner',
              labels: { singular: 'Highlight', plural: 'Highlights' },
              minRows: 0,
              maxRows: 4,
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'detail', type: 'text' },
              ],
              defaultValue: [
                { label: '24/7 Onsite Fitting', detail: 'Emergency call-out throughout Ireland' },
                { label: 'ROI & Northern Ireland', detail: 'Nationwide supply and fitting' },
                { label: 'FDA & EU Food-Grade', detail: 'Compliant belts for food processing' },
                { label: 'European Manufacturers', detail: 'Backed by leading belt makers' },
              ],
            },
          ],
        },
        {
          label: 'Contact details',
          fields: [
            {
              name: 'contact',
              type: 'group',
              label: false,
              admin: { description: 'Shown in the footer and on the contact page.' },
              fields: [
                {
                  name: 'address',
                  type: 'textarea',
                  defaultValue: 'Unit 4, Site 30-31 Duleek Business Park, Duleek, County Meath, A92 NN29',
                },
                { name: 'phone', type: 'text', defaultValue: '00353 1800 93 8765' },
                { name: 'email', type: 'email', defaultValue: 'justask@ptbltd.ie' },
              ],
            },
            {
              name: 'contactPageIntro',
              type: 'textarea',
              label: 'Contact page introduction',
              defaultValue:
                "Tell us about your application and we'll come back with belt samples, a survey, or a quote. We offer a 24/7 onsite fitting service throughout Ireland and Northern Ireland.",
            },
          ],
        },
        {
          label: 'Branding',
          fields: [
            {
              name: 'siteTitle',
              type: 'text',
              label: 'Website name',
              required: true,
              defaultValue: 'Conveyor Belting Ireland',
            },
            {
              name: 'tagline',
              type: 'text',
              defaultValue: 'Taking the tension out of your belting needs',
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
      ],
    },
  ],
}
