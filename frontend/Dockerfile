# Build Stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package lock and package json
COPY frontend/package*.json ./frontend/
# COPY shared/package*.json ./shared/  # optional, removed for Docker compatibility

# Install dependencies for frontend
WORKDIR /app/frontend
RUN npm ci

# Copy full sources
WORKDIR /app
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build frontend
WORKDIR /app/frontend
ENV NEXT_PUBLIC_API_URL=http://localhost:3000
RUN npm run build

# Production Stage
FROM node:18-alpine
WORKDIR /app

# Copy package files, public, next assets, and node_modules
COPY --from=builder /app/frontend/package*.json ./frontend/
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules

WORKDIR /app/frontend
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["npm", "start"]
