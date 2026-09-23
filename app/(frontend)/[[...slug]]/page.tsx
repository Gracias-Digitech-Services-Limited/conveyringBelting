import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { RichText } from '@/components/RichText'
import { HomePage } from '@/components/site/HomePage'
import { Reveal } from '@/components/site/Reveal'
import { HoverCard } from '@/components/site/HoverCard'
import { getNavNodeForSlug, getRelatedNavGroup } from '@/lib/nav'
import { getIntroText } from '@/lib/richtext'
import type { Page } from '@/payload-types'

export const revalidate = 60

async function getPage(slug: string): Promise<Page | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug }, status: { not_equals: 'private' } },
    limit: 1,
  })
  return (result.docs[0] as Page) ?? null
}

function resolveSlug(slugParts?: string[]): string {
  if (!slugParts || slugParts.length === 0) return 'home'
  return slugParts.join('/')
}

type Args = { params: Promise<{ slug?: string[] }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(resolveSlug(slug))
  if (!page) return {}
  return {
    title: page.seo?.metaTitle || page.title,
    description: page.seo?.metaDescription || undefined,
  }
}

export default async function CmsPage({ params }: Args) {
  const { slug } = await params
  const resolvedSlug = resolveSlug(slug)
  const page = await getPage(resolvedSlug)

  if (!page) notFound()

  if (resolvedSlug === 'home') {
    return <HomePage page={page} />
  }

  // A "hub" page (Products, Industries, or a nested category like Conveyor Belting or PVC
  // Conveyor Belting) gets its nav children rendered as a browsable grid instead of the flat
  // list of sub-page names WordPress used to dump as plain text into the body copy.
  const navNode = await getNavNodeForSlug(resolvedSlug)
  const isHub = Boolean(navNode?.children?.length)
  const related = isHub ? null : await getRelatedNavGroup(resolvedSlug)
  const introText = isHub ? getIntroText(page.content) : null

  return (
    <article>
      <div className="border-b border-border-subtle bg-muted">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <nav className="mb-3 text-sm text-text-faint">
            <Link href="/" className="hover:text-brand-amber">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text-muted">{page.title}</span>
          </nav>
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {page.title}
            </h1>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {page.needsCopy && (
          <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            This page is still awaiting final copy from the migration - content coming soon.
          </div>
        )}

        {isHub ? (
          <>
            {introText && (
              <Reveal>
                <p className="max-w-3xl text-lg text-text-muted">{introText}</p>
              </Reveal>
            )}
            <Reveal delay={0.05}>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {navNode!.children!.map((item, i) => (
                  <Reveal key={item.href} delay={i * 0.03}>
                    <Link href={item.href} className="block h-full">
                      <HoverCard className="flex h-full items-center justify-between gap-2 rounded-lg border border-border-subtle bg-card p-5">
                        <span className="font-medium text-foreground">{item.text}</span>
                        <span className="shrink-0 text-brand-amber opacity-0 transition-opacity group-hover:opacity-100">
                          →
                        </span>
                      </HoverCard>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </>
        ) : (
          <Reveal>
            {page.content ? (
              <RichText data={page.content} />
            ) : (
              !page.needsCopy && <p className="text-text-faint">No content yet.</p>
            )}
          </Reveal>
        )}

        {related && related.items.length > 0 && (
          <Reveal delay={0.1}>
            <div className="mt-14">
              <h2 className="text-lg font-semibold text-foreground">{related.label}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {related.items.map((item) => (
                  <Link key={item.href} href={item.href} className="block">
                    <HoverCard className="rounded-md border border-border-subtle bg-card px-4 py-3 text-sm font-medium text-text-muted">
                      {item.text}
                    </HoverCard>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.15}>
          <div className="mt-12 rounded-lg border border-border-subtle bg-muted p-6">
            <p className="font-semibold text-foreground">Need help choosing the right belt?</p>
            <p className="mt-1 text-sm text-text-muted">
              Talk to our team for a survey, sample, or quote - 24/7 fitting service throughout
              Ireland.
            </p>
            <Link
              href="/contact-us"
              className="mt-4 inline-block rounded-md bg-brand-amber px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105 hover:bg-brand-amber-light"
            >
              Contact Us
            </Link>
          </div>
        </Reveal>
      </div>
    </article>
  )
}
