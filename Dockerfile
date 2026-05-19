# Stage 1: Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies if needed (e.g., for native npm modules)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# Run build which builds both frontend (vite) and backend (esbuild)
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled bundles from builder stage
COPY --from=builder /app/dist ./dist
# Keep environment vars and templates if needed
COPY --from=builder /app/package.json ./package.json

# Expose production port
EXPOSE 3001

# Start production server
CMD ["node", "dist/server.cjs"]
