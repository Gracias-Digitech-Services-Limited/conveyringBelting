# Conveyor Belting Ireland

Next.js 16 (App Router) + Payload CMS 3 (running in-process, not a separate service) + MongoDB.
Rebuilds conveyorbelting.ie from a WordPress export - see `/data` for the source JSON files this
whole site is seeded from.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Payload CMS 3**, mounted as a Next.js plugin under `app/(payload)` - no separate backend process
- **MongoDB Atlas** (M0 free tier works fine) via `@payloadcms/db-mongodb`
- **AWS SES** for the contact form notification email
- **S3** (optional) for media storage in production, via `@payloadcms/storage-s3`

## Collections

| Collection            | Purpose                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| `pages`                 | Every WP page/post, with richText body, SEO fields, migration metadata |
| `media`                 | Upload collection - alt/caption preserved from the WP media library    |
| `staff-cards`           | The 4 digital business cards (`/card/[slug]`)                         |
| `contact-submissions`   | Contact form leads (admin-only read)                                  |
| `users`                 | Payload admin accounts                                                |

## First-time setup

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URI, PAYLOAD_SECRET, etc.
```

Generate a secret: `openssl rand -base64 32` (or use the one already in `.env` for local dev).

Point `DATABASE_URI` at a MongoDB Atlas cluster (or a local `mongodb://127.0.0.1:27017/conveyorbelting`
for development).

```bash
npm run dev
```

Visit `http://localhost:3000/admin` and create the first admin user.

## Migrating content from WordPress

The three export files in `/data` are the source of truth - the seed script doesn't hardcode any
business content, it only transforms what's in those JSON files.

```bash
npm run seed
```

This will:

1. Download and create a `media` document for every item in `conveyorbelting-site-assets-export.json`
   (skips gracefully - with a warning - if a source URL is no longer reachable).
2. Create a `pages` document for every page + blog post in `conveyorbelting-all-pages-export.json`,
   converting `content_text` into richText, carrying over status/slug/SEO, and flagging the 6 pages
   that had empty content in WordPress with `needsCopy: true` (visible in the admin sidebar).
3. Create the 4 `staff-cards` documents from `conveyorbelting-qrcards-forms-export.json`, linking
   their photo/logo to the migrated media.

Safe to re-run - it upserts by the original WordPress ID instead of duplicating documents.

## Site structure

- `app/(frontend)/[[...slug]]` - renders any `pages` document (root `/` resolves to the page with
  slug `home`, matching the old `page_on_front` setting)
- `app/(frontend)/contact-us` - contact form (Name, Company*, Email*, Phone, Message - matching the
  original WPForms schema), submits via a Server Action to `contact-submissions` + sends an SES
  notification email. Honeypot field + optional hCaptcha replace the old custom "15 + 6 = ?" captcha.
- `app/(frontend)/card/[slug]` - staff digital business card: vCard download + a dot-style QR code
  (via `qr-code-styling`) that links back to the card
- `app/(payload)` - the Payload admin panel and REST/GraphQL API, mounted at `/admin` and `/api`
- `lib/nav.ts` - builds the header navigation from `nav_menus` in the site-assets export (grouped
  into Products / Industries / Download Section dropdowns - the export only captured link text +
  href, not depth, so grouping is reconstructed from the known slugs)
- `lib/legacyRedirects.ts` - generates the `next.config.ts` `redirects()` list from every page's old
  `url`, so existing search rankings survive the move

## Deployment (single EC2 instance, no load balancer)

Two options are included - pick one:

### Option A: Docker

```bash
docker build -t conveyorbelting .
docker run -d --name conveyorbelting -p 3000:3000 --env-file .env -v conveyorbelting_media:/app/media conveyorbelting
```

### Option B: PM2 + Nginx

```bash
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 save
```

Then point Nginx at `127.0.0.1:3000` - see `deploy/nginx.conf.example` (includes TLS via Let's
Encrypt and a `www` -> apex redirect).

In both cases:

- Set `DATABASE_URI` to your MongoDB Atlas connection string
- Set `S3_BUCKET` (+ credentials) to store uploaded media in S3 instead of the local `/app/media`
  volume - recommended once you're off a single instance, or if you want uploads to survive a
  redeploy without the volume
- Set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` with `ses:SendEmail` permission for the contact
  form notification
