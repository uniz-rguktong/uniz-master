# ── Stage 1: Install dependencies ──────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies and generate Prisma Client
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

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

# ── Stage 4: Production App runner ──────────────────────────
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
CMD ["node", "server.js"]

# ── Stage 5: Notification Worker runner ─────────────────────
FROM base-runner AS worker

ENV NODE_ENV=production

# Worker needs full source and full node_modules (including devDeps for ts-node)
COPY --from=builder /app ./

# Optional: ensure chromium-browser is findable
RUN ln -sf /usr/bin/chromium-browser /usr/bin/chromium

# Worker entry point
CMD ["npm", "run", "worker:notifications"]
