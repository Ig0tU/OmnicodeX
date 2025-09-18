# Multi-stage build for optimal image size and security

# Base stage with security updates
FROM node:20-alpine AS base

# Install security updates and required tools
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Build stage
FROM base AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies using npm ci for faster, reproducible builds
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Set build environment variables
ARG VITE_APP_VERSION
ARG VITE_BUILD_DATE
ARG VITE_GIT_HASH
ARG NODE_ENV=production

ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_BUILD_DATE=${VITE_BUILD_DATE}
ENV VITE_GIT_HASH=${VITE_GIT_HASH}
ENV NODE_ENV=${NODE_ENV}

# Run quality checks
RUN npm run lint && npm run typecheck

# Build the application
RUN npm run build

# Generate build manifest
RUN find dist -type f -exec sha256sum {} \; > dist/build-manifest.txt

# Runtime stage
FROM nginx:alpine AS runtime

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cloudide -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=cloudide:nodejs /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directory for nginx logs
RUN mkdir -p /var/log/nginx && \
    chown cloudide:nodejs /var/log/nginx

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:8080/health || exit 1' > /usr/local/bin/healthcheck.sh && \
    chmod +x /usr/local/bin/healthcheck.sh

# Security hardening
RUN rm -rf /usr/share/nginx/html/index.html \
    /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R cloudide:nodejs /usr/share/nginx/html \
    /var/cache/nginx \
    /var/run \
    /etc/nginx

# Switch to non-root user
USER cloudide

# Expose port
EXPOSE 8080

# Add metadata labels
LABEL maintainer="Terragon Labs <support@terragonlabs.com>"
LABEL version="${VITE_APP_VERSION}"
LABEL description="CloudIDE - Autonomous Development Environment"
LABEL org.opencontainers.image.source="https://github.com/terragon-labs/cloudide"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]