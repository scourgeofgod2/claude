# OpenClaude Dockerfile - Multi-stage build for Coolify deployment
# This creates an optimized production image for running openclaude CLI in a container

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM oven/bun:1.1.40-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies with bun
RUN bun install --frozen-lockfile --production=false

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM oven/bun:1.1.40-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and configuration
COPY . .

# Build the application
RUN bun run build

# ============================================================================
# Stage 3: Production Runtime
# ============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install bash for better shell experience and other utilities
RUN apk add --no-cache \
    bash \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user for security (optional, can run as root for convenience)
# RUN addgroup --system --gid 1001 openclaude && \
#     adduser --system --uid 1001 openclaude

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/README.md ./README.md

# Copy node_modules (production only would be ideal, but we need all deps for runtime)
COPY --from=deps /app/node_modules ./node_modules

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

# Health check to ensure container is running
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