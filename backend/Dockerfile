# ── Stage 1: Build & prune ────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm run db:generate

# Remove dev dependencies in-place — runner copies the result, no re-download needed
RUN npm prune --omit=dev

# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Copy pruned node_modules — includes Prisma CLI, client, and all prod deps
COPY --from=builder /app/node_modules ./node_modules

# Schema and migrations
COPY prisma ./prisma

# Startup script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./entrypoint.sh"]
