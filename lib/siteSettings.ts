import { cache } from 'react'
import { getPayloadClient } from './payload'
import type { SiteSetting } from '@/payload-types'

const DEFAULTS: SiteSetting = {
  id: 'default',
  siteTitle: 'Conveyor Belting Ireland',
  tagline: 'Taking the tension out of your belting needs',
  contact: {
    address: 'Elmgrove, Gormanston, Co. Meath, K32 C925',
    phone: '00353 1800 93 8765',
    email: 'justask@ptbltd.ie',
  },
  homepageHero: {
    eyebrow: 'PTB Innovation Ltd',
    heading: 'Conveyor Belting Ireland',
    primaryCtaLabel: 'Get a Quote',
    primaryCtaHref: '/contact-us',
    secondaryCtaLabel: 'Browse Industries',
    secondaryCtaHref: '/industries',
  },
  trustBadges: [
    { label: '24/7 Onsite Fitting', detail: 'Emergency call-out throughout Ireland' },
    { label: 'ROI & Northern Ireland', detail: 'Nationwide supply and fitting' },
    { label: 'FDA & EU Food-Grade', detail: 'Compliant belts for food processing' },
    { label: 'European Manufacturers', detail: 'Backed by leading belt makers' },
  ],
  contactPageIntro:
    "Tell us about your application and we'll come back with belt samples, a survey, or a quote. We offer a 24/7 onsite fitting service throughout Ireland and Northern Ireland.",
}

/** Reads the live `site-settings` global (editable in /admin), falling back to sensible
 * defaults if it's never been populated. Memoized per-request. */
export const getSiteSettings = cache(async (): Promise<SiteSetting> => {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  return settings?.siteTitle ? settings : DEFAULTS
})
