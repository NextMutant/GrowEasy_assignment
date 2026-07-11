# Build Stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package lock and package json
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/ 2>/dev/null || :

# Install dependencies for backend
WORKDIR /app/backend
RUN npm ci

# Copy full sources
WORKDIR /app
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build backend
WORKDIR /app/backend
RUN npm run build

# Production Stage
FROM node:18-alpine
WORKDIR /app

# Copy package files and compiled dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
