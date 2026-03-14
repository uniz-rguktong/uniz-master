# --- STAGE 1: Dependencies ---
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Install dependencies
RUN npm ci || npm install

# --- STAGE 2: Builder ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

ARG DIRECT_URL
ENV DIRECT_URL=$DIRECT_URL

ARG REDIS_URL
ENV REDIS_URL=$REDIS_URL

ARG R2_PUBLIC_URL
ENV R2_PUBLIC_URL=$R2_PUBLIC_URL

ARG NEXT_PUBLIC_ASSETS_URL
ENV NEXT_PUBLIC_ASSETS_URL=$NEXT_PUBLIC_ASSETS_URL

ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL

RUN npm run build

# --- STAGE 3: Worker ---
FROM node:22-alpine AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
# tsx is needed
RUN npm install -g tsx
CMD ["tsx", "src/worker/notificationWorker.ts"]

# --- STAGE 4: Runner (App) ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install prisma and sharp for production
RUN npm install -g prisma@6.19.2
RUN npm install sharp@0.34.5

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["./scripts/start.sh"]
