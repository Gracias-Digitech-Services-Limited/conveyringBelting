import type { Metadata } from 'next'
import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'

import { importMap } from '../importMap'

type Args = {
  params: Promise<{ segments?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Payload's own types require `segments`/searchParams values to always be defined, but Next's
// optional catch-all route genuinely omits them for the bare `/admin` URL - Payload handles that
// fine at runtime, so this is just bridging the two type signatures.
type PayloadArgs = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params: params as PayloadArgs['params'], searchParams: searchParams as PayloadArgs['searchParams'] })

const Page = ({ params, searchParams }: Args) =>
  RootPage({
    config,
    params: params as PayloadArgs['params'],
    searchParams: searchParams as PayloadArgs['searchParams'],
    importMap,
  })

export default Page
