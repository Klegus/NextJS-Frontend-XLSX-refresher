# Stage 1: Build
FROM node:25-alpine AS builder

WORKDIR /app

# Narzędzia do node-gyp (czasem potrzebne dla natywnych modułów)
RUN apk add --no-cache python3 make g++

# Zainstaluj deps — używamy npm ci (standardowy, używa package-lock.json)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Kopiuj kod i build
COPY . .
RUN npm run build

# Stage 2: Runtime - standalone server only (no node_modules install, no sources)
FROM node:25-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV HOSTNAME=0.0.0.0

# All configuration is read at runtime (AUTH_MODE, SITE_URL, AZURE_AD_*, JWT_SECRET,
# API_BASE_URL) - one image works for every environment
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 5000

CMD ["node", "server.js"]
