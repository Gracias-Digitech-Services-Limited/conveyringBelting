import { decodeWpEntities } from './wpData'
import type { Page } from '@/payload-types'

// Payload's generated type for `Page['content']` is deliberately loose (derived from a JSON
// schema, with index signatures on every node) - the strongly-typed builders below produce the
// exact same shape at runtime, so the return type is cast once here rather than threading a loose
// type through every helper.
type PayloadRichText = NonNullable<Page['content']>

/** Minimal Lexical node shapes - enough to build a valid Payload richText document from plain text. */
interface LexicalTextNode {
  type: 'text'
  text: string
  format: number
  style: string
  mode: 'normal'
  detail: number
  version: 1
}

interface LexicalParagraphNode {
  type: 'paragraph'
  format: ''
  indent: 0
  version: 1
  children: LexicalTextNode[]
  direction: 'ltr'
  textFormat: 0
  textStyle: ''
}

interface LexicalHeadingNode {
  type: 'heading'
  tag: 'h3'
  format: ''
  indent: 0
  version: 1
  children: LexicalTextNode[]
  direction: 'ltr'
}

/** Payload's built-in lexical Upload node (`@payloadcms/richtext-lexical`'s UploadFeature) -
 * a block-level decorator node embedding a `media` relationship inline in the document. */
interface LexicalUploadNode {
  type: 'upload'
  version: 3
  format: ''
  id: string
  relationTo: 'media'
  value: string
  fields: null
}

export interface LexicalDocument {
  root: {
    type: 'root'
    format: ''
    indent: 0
    version: 1
    children: Array<LexicalParagraphNode | LexicalHeadingNode | LexicalUploadNode>
    direction: 'ltr'
  }
}

function randomNodeId(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function uploadNode(mediaId: string): LexicalUploadNode {
  return {
    type: 'upload',
    version: 3,
    format: '',
    id: randomNodeId(),
    relationTo: 'media',
    value: mediaId,
    fields: null,
  }
}

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'image'
  text?: string
  mediaId?: string
}

/**
 * Builds a richText document from an ordered sequence of blocks (paragraph/heading text, or an
 * already-resolved media doc id for an image) - used for the pages whose live body content
 * interleaves photos with prose, restored via data/conveyorbelting-content-images-supplement.json
 * since the plain-text export dropped them. Unlike `plainTextToLexical`, block type and order are
 * taken as given rather than guessed from blank lines.
 */
export function blocksToLexical(blocks: ContentBlock[]): PayloadRichText {
  const children = blocks
    .map((b) => {
      if (b.type === 'image') return b.mediaId ? uploadNode(b.mediaId) : null
      const text = decodeWpEntities(b.text || '').trim()
      if (!text) return null
      return b.type === 'heading' ? heading(text) : paragraph(text)
    })
    .filter((n): n is LexicalParagraphNode | LexicalHeadingNode | LexicalUploadNode => n !== null)

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: children.length ? children : [paragraph('')],
      direction: 'ltr',
    },
  } as unknown as PayloadRichText
}

function textNode(text: string): LexicalTextNode {
  return { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }
}

function paragraph(text: string): LexicalParagraphNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: [textNode(text)],
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
  }
}

function heading(text: string): LexicalHeadingNode {
  return {
    type: 'heading',
    tag: 'h3',
    format: '',
    indent: 0,
    version: 1,
    children: [textNode(text)],
    direction: 'ltr',
  }
}

/**
 * Turns the cleaned plain-text export from WordPress into a Lexical richText document.
 * Blank-line-separated blocks become paragraphs; short standalone lines (no trailing
 * punctuation, under ~60 chars) are treated as sub-headings, matching how these pages
 * read in the original theme (short bold lead-ins between paragraphs of copy).
 */
export function plainTextToLexical(rawText: string): PayloadRichText {
  const text = decodeWpEntities(rawText || '').trim()

  if (!text) {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [paragraph('')],
        direction: 'ltr',
      },
    } as unknown as PayloadRichText
  }

  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.replace(/\n+/g, ' ').trim())
    .filter(Boolean)

  const children = blocks.map((block) => {
    const looksLikeHeading = block.length < 60 && !/[.!?]$/.test(block) && !block.includes(':')
    return looksLikeHeading ? heading(block) : paragraph(block)
  })

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: children.length ? children : [paragraph(text)],
      direction: 'ltr',
    },
  } as unknown as PayloadRichText
}

interface LooseLexicalNode {
  type?: string
  children?: LooseLexicalNode[]
  text?: string
  [key: string]: unknown
}

function collectText(node: LooseLexicalNode): string {
  if (typeof node.text === 'string') return node.text
  if (!node.children) return ''
  return node.children.map(collectText).join('')
}

export interface TextSection {
  heading: string | null
  body: string
}

/**
 * Walks a page's richText content and groups it into heading/body sections - used by the
 * homepage to turn the migrated "Investment / Team / Application / Support" copy into cards
 * instead of one long block of text. Works on any richText doc (hand-edited or migrated),
 * not just the shape `plainTextToLexical` produces.
 */
export function extractTextSections(doc: PayloadRichText | null | undefined): TextSection[] {
  const nodes = ((doc as { root?: { children?: LooseLexicalNode[] } })?.root?.children ??
    []) as LooseLexicalNode[]

  const sections: TextSection[] = []
  let current: TextSection = { heading: null, body: '' }

  for (const node of nodes) {
    const text = collectText(node).trim()
    if (!text) continue

    if (node.type === 'heading') {
      if (current.heading || current.body) sections.push(current)
      current = { heading: text, body: '' }
    } else {
      current.body = current.body ? `${current.body} ${text}` : text
    }
  }
  if (current.heading || current.body) sections.push(current)

  return sections
}

/** The old theme signed off almost every page with the company's (now outdated) address/phone
 * in the body copy - useful once, redundant once the header/footer/contact page already carry
 * the current details everywhere else. The WP export sometimes splits the sign-off across
 * several nodes (company name on its own line, then address, then phone, then email) rather
 * than one clean paragraph, and at least one real sentence happens to end with the support
 * email inline ("...upon request justask@ptbltd.ie") - so this can't just check for the
 * presence of a token. Instead, a line counts as boilerplate only if it's made up entirely of
 * these tokens (plus stray punctuation) with no other prose left over. */
const ADDRESS_TOKEN_RE =
  /K32 C925|(?:justask|sales)@ptbltd\.ie|[TM]:\s*\+?00?353[\d\s()]*|\+353[\d\s()]*|Unit\s*\d+,?\s*|Elmgrove|Gormanston|County Meath|Co\.?\s*Meath|PTB Innovation Ltd|ProTech Belting Ireland/gi

export function isBoilerplateAddress(body: string): boolean {
  const trimmed = body.trim()
  if (!trimmed || !new RegExp(ADDRESS_TOKEN_RE.source, 'i').test(trimmed)) return false
  const residue = trimmed
    .replace(new RegExp(ADDRESS_TOKEN_RE.source, 'gi'), '')
    .replace(/[\s:,.\-–|]+/g, '')
  return residue.length === 0
}

/**
 * Drops boilerplate address/contact sign-off nodes from a page's richText content - the
 * generic page renderer (unlike the homepage and hub-page intros) otherwise shows this raw
 * migrated content verbatim, duplicating the current header/footer contact info with a stale
 * one (old phone number, missing unit number). Non-address content is left untouched.
 */
export function stripBoilerplateAddress(
  doc: PayloadRichText | null | undefined,
): PayloadRichText | null {
  if (!doc) return null
  const root = (doc as { root?: { children?: LooseLexicalNode[] } }).root
  const children = (root?.children ?? []) as LooseLexicalNode[]
  const filtered = children.filter((node) => !isBoilerplateAddress(collectText(node)))

  return {
    ...doc,
    root: { ...root, children: filtered },
  } as unknown as PayloadRichText
}

/** Whether a page's richText content has anything left to show after stripping boilerplate -
 * a handful of migrated pages were nothing but the address sign-off, so they need the same
 * "awaiting copy" treatment as a genuinely empty page rather than rendering blank. */
export function hasVisibleContent(doc: PayloadRichText | null | undefined): boolean {
  const children = ((doc as { root?: { children?: LooseLexicalNode[] } })?.root?.children ??
    []) as LooseLexicalNode[]
  return children.some((node) => node.type === 'upload' || collectText(node).trim().length > 0)
}

/**
 * The lead-in paragraph of a page's content (the text before the first heading), with the
 * boilerplate address signed off. Used for "hub" pages (Products, Industries, and their nested
 * categories) where the rest of the body was just a flat list of sub-page names WordPress
 * dumped inline - that list is replaced by an actual clickable grid, so only the real
 * descriptive intro is worth keeping.
 */
export function getIntroText(doc: PayloadRichText | null | undefined): string | null {
  const intro = extractTextSections(doc).find((s) => !s.heading && !isBoilerplateAddress(s.body))
  return intro?.body || null
}
