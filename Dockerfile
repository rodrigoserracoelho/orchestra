# ---- Stage 1: Build the React frontend ----
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./

# Per-instance branding. BRANDING names a directory under branding/ whose
# contents overlay frontend/public (logo.png, logo-dark.png, favicon.ico);
# ORG_NAME/ORG_LEGAL_NAME are
# baked into the bundle. See branding/README.md.
ARG BRANDING=example
COPY branding/${BRANDING}/ ./public/

# BASE_PATH: /orchestra/ for subpath deployment, / for root deployment
ARG BASE_PATH=/orchestra/
ARG ORG_NAME=Orchestra
ARG ORG_LEGAL_NAME=""
ARG LOGO_WORDMARK=false
ARG LOGO_EXT=svg
RUN VITE_BASE_PATH=$BASE_PATH \
    VITE_ORG_NAME="$ORG_NAME" \
    VITE_ORG_LEGAL_NAME="${ORG_LEGAL_NAME:-$ORG_NAME}" \
    VITE_LOGO_WORDMARK="$LOGO_WORDMARK" \
    VITE_LOGO_EXT="$LOGO_EXT" \
    npm run build
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
