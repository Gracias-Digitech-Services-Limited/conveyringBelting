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

export interface LexicalDocument {
  root: {
    type: 'root'
    format: ''
    indent: 0
    version: 1
    children: Array<LexicalParagraphNode | LexicalHeadingNode>
    direction: 'ltr'
  }
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

/** The old theme signed off almost every page with the company address/phone in the body copy -
 * useful once, redundant once the header/footer/contact page already carry it everywhere else. */
export function isBoilerplateAddress(body: string): boolean {
  return /@ptbltd\.ie|T:\s*00353|K32 C925/i.test(body)
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
