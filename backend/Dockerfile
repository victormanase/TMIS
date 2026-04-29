# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl

ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

WORKDIR /app

COPY package*.json ./
# Cache npm downloads across builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

# Split into separate layers so each caches independently
RUN npm run build
RUN npm run db:generate
RUN npm prune --omit=dev

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./entrypoint.sh"]