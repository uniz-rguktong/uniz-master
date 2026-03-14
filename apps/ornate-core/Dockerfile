# ── Stage 1: Install dependencies ──────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies and generate Prisma Client
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci || npm install

# Set binary target for Alpine
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
RUN npx prisma generate

# ── Stage 2: Build the application ────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy node_modules and prisma client from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

ARG DIRECT_URL
ENV DIRECT_URL=$DIRECT_URL

ARG REDIS_URL
ENV REDIS_URL=$REDIS_URL

ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL

ARG R2_ENDPOINT
ENV R2_ENDPOINT=$R2_ENDPOINT

ARG R2_ACCESS_KEY_ID
ENV R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID

ARG R2_SECRET_ACCESS_KEY
ENV R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY

ARG R2_PUBLIC_DOMAIN
ENV R2_PUBLIC_DOMAIN=$R2_PUBLIC_DOMAIN

RUN npm run build

# ── Stage 3: Base runner (Puppeteer & Fonts) ────────────────
FROM node:22-alpine AS base-runner
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    chromium \
    # Fonts for professional certificates
    font-noto-emoji \
    font-noto-cjk \
    font-noto-arabic

# Tell Puppeteer to use the system chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# ── Stage 4: Notification Worker runner ─────────────────────
FROM base-runner AS worker

ENV NODE_ENV=production

# Worker needs full source and full node_modules (including devDeps for ts-node)
COPY --from=builder /app ./

# Optional: ensure chromium-browser is findable
RUN ln -sf /usr/bin/chromium-browser /usr/bin/chromium

# Worker entry point
CMD ["npm", "run", "worker:notifications"]

# ── Stage 5: Production App runner ──────────────────────────
FROM base-runner AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh
COPY --from=builder /app/prisma ./prisma
# Ensure custom Prisma client is included if Next.js standalone misses it
COPY --from=builder /app/src/lib/generated ./src/lib/generated

# Optional: ensure chromium-browser is findable by browserManager.ts
RUN ln -sf /usr/bin/chromium-browser /usr/bin/chromium

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Main app entry point
CMD ["./scripts/start.sh"]
