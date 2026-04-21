# Stage 1: Building the code
FROM node:18 AS builder

WORKDIR /app

# Install dependencies for node-gyp
RUN apt-get update && apt-get install -y python3 build-essential

# Copy package files
COPY package*.json ./

# Build-time env vars (from dev): API base URLs
ARG NEXT_PUBLIC_API_BASE_URL
ARG API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL

# Build-time env vars (from auth): Azure AD + JWT
ARG AZURE_AD_CLIENT_ID
ARG AZURE_AD_TENANT_ID
ARG AZURE_AD_CLIENT_SECRET
ARG REDIRECT_URI
ARG JWT_SECRET
ENV NEXT_PUBLIC_AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID
ENV NEXT_PUBLIC_AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID
ENV REDIRECT_URI=$REDIRECT_URI
ENV JWT_SECRET=$JWT_SECRET

# Install dependencies
RUN corepack enable && yarn install --no-lockfile --verbose

# Copy app files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the built code
FROM node:18-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps --no-package-lock --verbose

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Runtime env vars (from dev)
ARG NEXT_PUBLIC_API_BASE_URL
ARG API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL

# Runtime env vars (from auth)
ENV NODE_ENV=production
ENV PORT=5000
ENV JWT_SECRET=$JWT_SECRET
ENV NEXT_PUBLIC_AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID
ENV NEXT_PUBLIC_AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID
ENV AZURE_AD_CLIENT_SECRET=$AZURE_AD_CLIENT_SECRET
ENV NEXT_PUBLIC_REDIRECT_URI=$NEXT_PUBLIC_REDIRECT_URI
ENV REDIRECT_URI=$REDIRECT_URI

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
