import { revalidatePath } from 'next/cache'

/**
 * Clears Next's cached pages so an admin edit shows on the website straight away, instead of
 * after the page's `revalidate` window. The site is small, so everything is refreshed rather
 * than working out which pages a given change affects (a menu or Site Settings edit touches
 * every page anyway via the header/footer).
 *
 * Called from Payload afterChange/afterDelete hooks. Those also run from scripts (seed,
 * migrations) outside a Next request, where there's no cache to clear and revalidatePath
 * throws - hence the try/catch.
 */
export function revalidateSite() {
  try {
    revalidatePath('/', 'layout')
  } catch {
    // Not inside a Next.js request - nothing to revalidate.
  }
}

/** Payload hook adapters - hooks must hand the document back unchanged. */
export const revalidateAfterChange = <T>({ doc }: { doc: T }): T => {
  revalidateSite()
  return doc
}
export const revalidateAfterDelete = <T>({ doc }: { doc: T }): T => {
  revalidateSite()
  return doc
}
