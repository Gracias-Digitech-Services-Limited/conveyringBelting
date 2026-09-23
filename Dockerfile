# Single-container deploy for one EC2 instance - build once, run with `next start`.
# Payload's dynamic requires don't play well with Next's `output: standalone` tracing,
# so this keeps the full node_modules in the runtime image rather than trying to slim it.
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time env vars are only needed if next.config.ts/payload.config.ts read them
# at build time (e.g. to generate static redirects) - runtime secrets are supplied
# via `docker run --env-file .env` instead, not baked into the image.
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_HCAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_HCAPTCHA_SITE_KEY=$NEXT_PUBLIC_HCAPTCHA_SITE_KEY
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder /app/payload.config.ts ./payload.config.ts
COPY --from=builder /app/collections ./collections
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/payload-types.ts ./payload-types.ts

RUN mkdir -p /app/media && chown -R nextjs:nodejs /app/media
VOLUME ["/app/media"]

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
