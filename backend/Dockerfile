# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run db:generate

# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Compiled app
COPY --from=builder /app/dist ./dist

# Prisma runtime client (generated in builder)
COPY --from=builder /app/node_modules/@prisma     ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma     ./node_modules/.prisma

# Prisma CLI — needed for "prisma migrate deploy" at startup
COPY --from=builder /app/node_modules/prisma      ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Schema and migrations
COPY prisma ./prisma

# Startup script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./entrypoint.sh"]
