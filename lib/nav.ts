import { cache } from 'react'
import { getPayloadClient } from './payload'

export interface NavNode {
  text: string
  href: string
  children?: NavNode[]
}

/**
 * Seed/fallback tree - the exact live navigation from conveyorbelting.ie, captured by walking
 * the real site's rendered menu DOM (nav_menus in the WP export is a flat list that lost the
 * dropdown depth). The seed script writes this into the `navigation` global on first run, and
 * from then on the global (editable in /admin) is the source of truth - this constant only
 * matters before that global has ever been populated.
 */
export const DEFAULT_NAV: NavNode[] = [
  { text: 'Home', href: '/' },
  {
    text: 'Products',
    href: '/products',
    children: [
      {
        text: 'Download Section',
        href: '/downloads-pdf',
        children: [
          { text: 'Bakery Industry', href: '/bakery-industry' },
          { text: 'Bucket Elevator Belts', href: '/bucket-elevator-belts' },
          { text: 'Dairy Industry', href: '/dairy-industry' },
          { text: 'SuperDrive™', href: '/postivedrive' },
          { text: 'Poultry Industry', href: '/poultry-industry' },
          { text: 'V & Round Conveyor Belts', href: '/v-round-belt-profiles' },
          {
            text: 'PTB A5 Flyers',
            href: '/ptb-a4-flyer-downloads',
            children: [
              { text: 'PTB Recylcing Industry', href: '/ptb-recylcing-industry' },
              { text: 'PTB Meat Industry', href: '/ptb-meat-industry' },
              { text: 'PTB Confectionery Industry', href: '/ptb-confectionery-industry' },
              { text: 'PTB Fruit & Vegetable Industry', href: '/ptb-fruit-vegetable-industry' },
              { text: 'PTB Bakery Industry', href: '/ptb-bakery-industry' },
            ],
          },
        ],
      },
      {
        text: 'Conveyor Belting',
        href: '/belts',
        children: [
          { text: 'Synthetic Belts', href: '/synthetic-belts' },
          { text: 'Wash Flow Conveyor Belts', href: '/wash-flow-conveyor-belts' },
          { text: 'PU Conveyor Belting', href: '/pu' },
          {
            text: 'PVC Conveyor Belting',
            href: '/pvc',
            children: [
              { text: 'Aster PVC Conveyor Belts', href: '/aster-pvc-conveyor-belts' },
              { text: 'Breda PVC Conveyor Belt', href: '/breda-pvc-conveyor-belt' },
              { text: 'Drago PVC Conveyor Belting', href: '/drago-pvc-conveyor-belt' },
              { text: 'Espot PVC Conveyor Belting', href: '/espot-pvc-conveyor-belting' },
              { text: 'Febor PVC Conveyor Belting', href: '/febor-pvc-conveyor-belting' },
              { text: 'Hipro PVC Conveyor Belt', href: '/hipro-pvc-conveyor-belt' },
              { text: 'Novak PVC Conveyor Belt', href: '/novak-pvc-conveyor-belt' },
            ],
          },
        ],
      },
      { text: 'Solid PU Conveyor Belts', href: '/solid-pu' },
      { text: 'Plied Conveyor Belts', href: '/plied' },
      { text: 'V & Round Conveyor Belts', href: '/round-belts' },
      { text: 'TPE Conveyor Belting', href: '/tpe-conveyor-belting' },
      { text: 'Teflon Conveyor Belts', href: '/teflon-conveyor-belts' },
      { text: 'Silicone Conveyor Belts', href: '/silicone' },
      { text: 'Belt Accessories', href: '/belt-accessories' },
      { text: 'Modular Conveyor Belts', href: '/modular' },
      { text: 'Conveyor Accessories', href: '/conveyor-accessories' },
      { text: 'Transmission', href: '/transmission' },
      { text: 'Timing Belts', href: '/timing' },
    ],
  },
  {
    text: 'Industries',
    href: '/industries',
    children: [
      { text: 'Airports / Logistics – Conveyor Belting', href: '/airport-conveyor-belts' },
      { text: 'ATEX Approved – Conveyor Belting', href: '/atex-approved-conveyor-belts' },
      {
        text: 'Bakery – Conveyor Belting',
        href: '/bakery',
        children: [{ text: 'Bakery – Depanner Belt', href: '/bakery-depanner-belt' }],
      },
      { text: 'Bucket Elevator – Conveyor Belting', href: '/bucket-elevators' },
      { text: 'Ceramic – Conveyor Belting', href: '/ceramic' },
      { text: 'Chicken Manure Conveyor Belt', href: '/chicken-manure-conveyor-belt' },
      { text: 'Corrugated Boxes – Conveyor Belting', href: '/corrugated' },
      { text: 'Dairy Industry – Conveyor Belting', href: '/dairy-industry-conveyor-belting' },
      { text: 'Detergents – Conveyor Belting', href: '/processing' },
      { text: 'Fruit & Veg – Conveyor Belting', href: '/fruit-veg' },
      { text: 'Logistics – Conveyor Belting', href: '/logistics' },
      { text: 'Meat – Conveyor Belting', href: '/meat-industry' },
      { text: 'Snack Food Industry', href: '/snack-food-industry' },
      { text: 'Sugar / Confectionery – Conveyor Belting', href: '/sugar' },
      { text: 'Waste – Conveyor Belting', href: '/waste' },
      { text: 'Pharmaceutical – Conveyor Belting', href: '/pharmaceutical-conveyor-belts' },
    ],
  },
  {
    text: 'About Us',
    href: '/about-us',
    children: [
      { text: 'Conveyor Inspection', href: '/conveyor-inspection' },
      { text: 'Vulcanising / Splicing', href: '/vulcanising-splicing' },
      { text: 'Belt Survey', href: '/belt-survey' },
    ],
  },
  {
    text: 'Contact us',
    href: '/contact-us',
    children: [{ text: 'Terms and Conditions', href: '/terms-and-conditions' }],
  },
]

/** Reads the live `navigation` global (editable in /admin), falling back to the seed tree if it's
 * never been populated. Memoized per-request so multiple components can call this cheaply. */
export const getHeaderNav = cache(async (): Promise<NavNode[]> => {
  const payload = await getPayloadClient()
  const nav = await payload.findGlobal({ slug: 'navigation' })
  const items = nav?.items as NavNode[] | undefined
  return items?.length ? items : DEFAULT_NAV
})

/** The Products dropdown's immediate children only - for the homepage showcase grid. */
export async function getProductTopLevel(): Promise<NavNode[]> {
  const tree = await getHeaderNav()
  return tree.find((n) => n.href === '/products')?.children ?? []
}

/** The Industries dropdown's immediate children only - for the homepage showcase grid. */
export async function getIndustryTopLevel(): Promise<NavNode[]> {
  const tree = await getHeaderNav()
  return tree.find((n) => n.href === '/industries')?.children ?? []
}

function findByHref(nodes: NavNode[], href: string): NavNode | undefined {
  for (const n of nodes) {
    if (n.href === href) return n
    if (n.children) {
      const found = findByHref(n.children, href)
      if (found) return found
    }
  }
  return undefined
}

/**
 * Finds a page's own nav node (by its slug) anywhere in the tree, so a "category" page like
 * /products, /industries, /belts (Conveyor Belting) or /pvc (PVC Conveyor Belting) can render
 * its children as a browsable grid instead of the flat sub-page listing WordPress used to
 * dump into the body copy.
 */
export async function getNavNodeForSlug(slug: string): Promise<NavNode | undefined> {
  const tree = await getHeaderNav()
  return findByHref(tree, `/${slug}`)
}

function locateSiblings(
  nodes: NavNode[],
  href: string,
  sectionLabel: string,
): { label: string; items: NavNode[] } | null {
  if (nodes.some((n) => n.href === href)) {
    return { label: sectionLabel, items: nodes.filter((n) => n.href !== href) }
  }
  for (const node of nodes) {
    if (node.children) {
      const found = locateSiblings(node.children, href, sectionLabel)
      if (found) return found
    }
  }
  return null
}

/**
 * For a CMS page's slug, finds where it sits in the nav tree and returns its sibling links
 * (e.g. on an "Aster PVC Conveyor Belt" page, the other PVC belt types) - powers the "related
 * pages" grid on generic pages. Falls back to the section's top-level items if the page is a
 * direct child of Products/Industries rather than nested further down.
 */
export async function getRelatedNavGroup(
  slug: string,
): Promise<{ label: string; items: NavNode[] } | null> {
  const href = `/${slug}`
  const tree = await getHeaderNav()
  const products = tree.find((n) => n.href === '/products')
  const industries = tree.find((n) => n.href === '/industries')

  if (products?.children) {
    const found = locateSiblings(products.children, href, 'More Products')
    if (found) return found
  }
  if (industries?.children) {
    const found = locateSiblings(industries.children, href, 'More Industries')
    if (found) return found
  }
  return null
}
