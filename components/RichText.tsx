import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Page } from '@/payload-types'

// Payload's generated type for the `content` field is intentionally loose (JSON schema
// derived), so it doesn't structurally match lexical's own SerializedEditorState - cast at
// the boundary rather than loosening the type everywhere this component is used.
export function RichText({
  data,
  className,
}: {
  data: NonNullable<Page['content']>
  className?: string
}) {
  return (
    <LexicalRichText
      data={data as unknown as SerializedEditorState}
      className={`prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-amber-700 dark:prose-a:text-brand-amber-light prose-a:no-underline hover:prose-a:underline ${className ?? ''}`}
    />
  )
}
