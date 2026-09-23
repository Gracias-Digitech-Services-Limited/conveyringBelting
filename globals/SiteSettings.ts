import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/lib/access'

/**
 * Site-wide branding and copy that WordPress would normally split across Settings > General,
 * the Customizer (site identity, homepage sections) and widgets (footer contact info) - kept
 * as one global here since it's all "who we are / how to reach us" content.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'siteTitle',
      type: 'text',
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
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'address', type: 'textarea', defaultValue: 'Elmgrove, Gormanston, Co. Meath, K32 C925' },
        { name: 'phone', type: 'text', defaultValue: '00353 1800 93 8765' },
        { name: 'email', type: 'email', defaultValue: 'justask@ptbltd.ie' },
      ],
    },
    {
      name: 'homepageHero',
      type: 'group',
      label: 'Homepage Hero',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'PTB Innovation Ltd' },
        { name: 'heading', type: 'text', defaultValue: 'Conveyor Belting Ireland' },
        {
          name: 'primaryCtaLabel',
          type: 'text',
          defaultValue: 'Get a Quote',
        },
        { name: 'primaryCtaHref', type: 'text', defaultValue: '/contact-us' },
        { name: 'secondaryCtaLabel', type: 'text', defaultValue: 'Browse Industries' },
        { name: 'secondaryCtaHref', type: 'text', defaultValue: '/industries' },
      ],
    },
    {
      name: 'trustBadges',
      type: 'array',
      label: 'Homepage Trust Badges',
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
    {
      name: 'contactPageIntro',
      type: 'textarea',
      defaultValue:
        "Tell us about your application and we'll come back with belt samples, a survey, or a quote. We offer a 24/7 onsite fitting service throughout Ireland and Northern Ireland.",
    },
  ],
}
