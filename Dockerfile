# ---- Stage 1: Build the React frontend ----
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./

# BASE_PATH: /orchestra/ for subpath deployment, / for root deployment
ARG BASE_PATH=/orchestra/
RUN VITE_BASE_PATH=$BASE_PATH npm run build
# Output lands in /app/backend/public (via vite.config.js outDir)

# ---- Stage 2: Production backend ----
FROM node:18-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production

# Copy backend source
COPY backend/ ./

# Copy the built frontend from stage 1
COPY --from=frontend-build /app/backend/public ./public

# Don't run as root
RUN addgroup -S orchestra && adduser -S orchestra -G orchestra \
    && chown -R orchestra:orchestra /app
USER orchestra

EXPOSE 3001

CMD ["node", "server.js"]
