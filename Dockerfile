# ==============================================================================
# Multi-Stage Dockerfile for Chitrabazaar (Hugging Face Docker Spaces)
# Next.js Modular Monolith + Headless Sharp Media Worker
# Zero Credit Card Required • Port 7860 • Multi-Process Supervisor
# ==============================================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl bash
WORKDIR /app

# Stage 1: Dependencies Cache
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# Stage 2: Build Application & Standalone Bundle
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# Stage 3: Production Runner (Unified Multi-Process Container)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7860
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and schema
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/node_modules ./node_modules

# Copy standalone Next.js server bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy and set permissions for multi-process supervisor
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 7860

# Health check probe pinging the Next.js liveness endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:7860/api/health || exit 1

# Launch the unified container supervisor (Web Monolith + Sharp Worker)
ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]
