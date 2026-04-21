# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Narzędzia do node-gyp (czasem potrzebne dla natywnych modułów)
RUN apk add --no-cache python3 make g++

# Zainstaluj deps — używamy npm ci (standardowy, używa package-lock.json)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Build-time env vars (publiczne — wbudowane w bundle JS)
# Sekrety (CLIENT_SECRET, JWT_SECRET) są tylko runtime — nie powinny być w obrazie
ARG NEXT_PUBLIC_API_BASE_URL
ARG API_BASE_URL
ARG NEXT_PUBLIC_AZURE_AD_CLIENT_ID
ARG NEXT_PUBLIC_AZURE_AD_TENANT_ID
ARG NEXT_PUBLIC_REDIRECT_URI

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL
ENV NEXT_PUBLIC_AZURE_AD_CLIENT_ID=$NEXT_PUBLIC_AZURE_AD_CLIENT_ID
ENV NEXT_PUBLIC_AZURE_AD_TENANT_ID=$NEXT_PUBLIC_AZURE_AD_TENANT_ID
ENV NEXT_PUBLIC_REDIRECT_URI=$NEXT_PUBLIC_REDIRECT_URI

# Kopiuj kod i build
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Tylko production deps
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Kopiuj zbudowaną aplikację
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Runtime env vars — te są podawane przy `docker run -e ...`
# Nie są zapisane w obrazie; wartości placeholder dla Next.js są wyżej
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]
