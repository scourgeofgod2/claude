# OpenClaude Dockerfile - Bun-based build for Coolify deployment
# Multi-stage build: Bun for building, Node.js for runtime

# ============================================================================
# Stage 1: Builder - Build with Bun
# ============================================================================
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files first for better layer caching
COPY package.json bun.lock ./

# Install dependencies with Bun (much faster than npm)
# --frozen-lockfile ensures reproducible builds
RUN bun install --frozen-lockfile

# Copy source code and configuration
COPY . .

# Build the application with Bun
# This compiles TypeScript and creates dist/cli.mjs
RUN bun run build

# ============================================================================
# Stage 2: Production Runtime - Run with Node.js
# ============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    bash \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/README.md ./README.md

# Copy node_modules from builder (already installed by Bun)
COPY --from=builder /app/node_modules ./node_modules

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
COPY --from=builder /app/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port (not really needed for CLI, but useful if you add API later)
# EXPOSE 3000

# Use entrypoint to keep container alive
ENTRYPOINT ["/entrypoint.sh"]

# Default command (can be overridden)
CMD ["sleep", "infinity"]
