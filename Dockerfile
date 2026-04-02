# OpenClaude Dockerfile - Node.js-based build for Coolify deployment
# Single-stage build with Node.js (Bun has CPU compatibility issues)

FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    bash

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies with npm
# Using --legacy-peer-deps for compatibility
RUN npm install --legacy-peer-deps

# Copy source code and configuration
COPY . .

# Build the application with Node.js
# This compiles TypeScript and creates dist/cli.mjs
RUN npm run build

# Production files are already in place (single stage)
# No need to copy from builder stage

# Make the binary executable
RUN chmod +x ./bin/openclaude

# Create directories for persistent data
RUN mkdir -p /root/.openclaude /workspace

# Link openclaude globally for easier access
RUN ln -s /app/bin/openclaude /usr/local/bin/openclaude

# Set working directory for openclaude operations
WORKDIR /workspace

# Environment variables (will be overridden by docker-compose or Coolify)
ENV NODE_ENV=production \
    CLAUDE_CODE_USE_OPENAI=1 \
    PATH="/app/bin:${PATH}"

# Health check to ensure container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD openclaude --version || exit 1

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port (not really needed for CLI, but useful if you add API later)
# EXPOSE 3000

# Use entrypoint to keep container alive
ENTRYPOINT ["/entrypoint.sh"]

# Default command (can be overridden)
CMD ["sleep", "infinity"]
