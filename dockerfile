# Stage 1: Building the code
FROM node:18 AS builder

WORKDIR /app

# Install dependencies for node-gyp
RUN apt-get update && apt-get install -y python3 build-essential

# Copy package files
COPY package*.json ./

# Ustaw zmienne środowiskowe dla czasu budowania
ARG NEXT_PUBLIC_API_URL
ARG AZURE_AD_CLIENT_ID
ARG AZURE_AD_TENANT_ID
ARG AZURE_AD_CLIENT_SECRET
ARG REDIRECT_URI
ARG JWT_SECRET

# Set environment variables for build time
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV JWT_SECRET=$JWT_SECRET
ENV NEXT_PUBLIC_AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID
ENV NEXT_PUBLIC_AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID
ENV REDIRECT_URI=$REDIRECT_URI

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

# Set environment variables for runtime
ENV NODE_ENV=production
ENV PORT=5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV JWT_SECRET=$JWT_SECRET
ENV NEXT_PUBLIC_AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID
ENV NEXT_PUBLIC_AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID
ENV NEXT_PUBLIC_REDIRECT_URI=$NEXT_PUBLIC_REDIRECT_URI
ENV REDIRECT_URI=$REDIRECT_URI

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]