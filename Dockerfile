# Multi-stage build for optimal image size and security

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Remove dev dependencies to reduce size
RUN pnpm prune --prod

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

# Health check script
COPY <<EOF /usr/local/bin/healthcheck.sh
#!/bin/sh
curl -f http://localhost:80/health || exit 1
EOF

RUN chmod +x /usr/local/bin/healthcheck.sh

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
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]