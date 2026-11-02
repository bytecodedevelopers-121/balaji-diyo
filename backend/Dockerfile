# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and tsconfig
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (devDeps needed for tsc + @types/*)
RUN npm ci

# Copy Prisma schema first so we can generate the client
COPY prisma/ ./prisma/

# Generate Prisma client (creates @prisma/client types)
RUN npx prisma generate

# Copy the rest of the source
COPY src/ ./src/

# Compile TypeScript → JavaScript
RUN npm run build


# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma schema + re-generate client in production image
COPY prisma/ ./prisma/
RUN npx prisma generate

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]