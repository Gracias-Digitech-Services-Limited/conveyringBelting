import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'

import { Users } from './collections/Users'
import { Pages } from './collections/Pages'
import { Media } from './collections/Media'
import { StaffCards } from './collections/StaffCards'
import { ContactSubmissions } from './collections/ContactSubmissions'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'
import { SERVER_URL } from './lib/serverUrl'
import { sesEmailAdapter } from './lib/sesEmailAdapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const useS3 = Boolean(process.env.S3_BUCKET)

export default buildConfig({
  serverURL: SERVER_URL,
  admin: {
    user: Users.slug,
    theme: 'light',
    // Present the admin as "the website editor" rather than as Payload - the client shouldn't
    // need to know what CMS it runs on.
    meta: {
      titleSuffix: ' - Conveyor Belting Ireland',
    },
    components: {
      graphics: {
        Logo: '/components/admin/Branding#AdminLogo',
        Icon: '/components/admin/Branding#AdminIcon',
      },
      beforeDashboard: ['/components/admin/Welcome#Welcome'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Order sets the admin sidebar/dashboard order: day-to-day content first, account admin last.
  collections: [Pages, Media, StaffCards, ContactSubmissions, Users],
  globals: [SiteSettings, Navigation],
  editor: lexicalEditor(),
  // Admin emails ("Forgot password") go through Amazon SES when EMAIL_TRANSPORT=ses - set that
  // only where AWS credentials exist (on EC2: the instance's IAM role). Without it, Payload
  // just writes emails to the server log, which is what local dev and the Vercel review use.
  ...(process.env.EMAIL_TRANSPORT === 'ses' && process.env.SES_FROM_EMAIL
    ? {
        email: sesEmailAdapter({
          fromAddress: process.env.SES_FROM_EMAIL,
          fromName: 'Conveyor Belting Ireland',
          region: process.env.AWS_REGION,
        }),
      }
    : {}),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  plugins: [
    // Only enable S3 storage when bucket credentials are provided - falls back to local disk storage otherwise.
    ...(useS3
      ? [
          s3Storage({
            collections: {
              media: process.env.S3_PUBLIC_URL
                ? {
                    // Serve files directly from R2's public URL instead of proxying every
                    // request through a Vercel serverless function (which was adding ~1-2s of
                    // pure overhead per image on top of the actual transfer).
                    disablePayloadAccessControl: true,
                    generateFileURL: ({ filename }) => `${process.env.S3_PUBLIC_URL}/${filename}`,
                  }
                : true,
            },
            bucket: process.env.S3_BUCKET || '',
            config: {
              region: process.env.S3_REGION || 'auto',
              // Cloudflare R2 is S3-compatible but needs its own endpoint (unlike real AWS S3,
              // which infers it from the region) and path-style URLs.
              ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
              forcePathStyle: true,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
  ],
})
