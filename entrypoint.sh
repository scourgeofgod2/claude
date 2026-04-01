#!/bin/bash
# OpenClaude Container Entrypoint Script
# Keeps the container alive and provides utility functions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
cat << "EOF"
   ___                   ____ _                 _      
  / _ \ _ __   ___ _ __ / ___| | __ _ _   _  __| | ___ 
 | | | | '_ \ / _ \ '_ \| |   | |/ _` | | | |/ _` |/ _ \
 | |_| | |_) |  __/ | | | |___| | (_| | |_| | (_| |  __/
  \___/| .__/ \___|_| |_|\____|_|\__,_|\__,_|\__,_|\___|
       |_|                                               
EOF
echo -e "${NC}"

echo -e "${GREEN}OpenClaude Docker Container${NC}"
echo -e "${YELLOW}Version: $(openclaude --version 2>/dev/null || echo 'unknown')${NC}"
echo ""

# Display environment info
echo -e "${BLUE}=== Environment Configuration ===${NC}"
echo "Provider: ${CLAUDE_CODE_USE_OPENAI:+OpenAI-compatible}"
echo "Model: ${OPENAI_MODEL:-not set}"
echo "Base URL: ${OPENAI_BASE_URL:-https://api.openai.com/v1}"
echo "Workspace: /workspace"
echo "Config: /root/.openclaude"
echo ""

# Check if API key is set (not needed for local providers)
if [[ -z "$OPENAI_API_KEY" && "$OPENAI_BASE_URL" != *"localhost"* && "$OPENAI_BASE_URL" != *"127.0.0.1"* && "$OPENAI_BASE_URL" != *"host.docker.internal"* ]]; then
    echo -e "${YELLOW}⚠️  Warning: OPENAI_API_KEY is not set${NC}"
    echo -e "${YELLOW}   For remote providers, you need to set this variable${NC}"
    echo ""
fi

# Verify openclaude is available
if command -v openclaude &> /dev/null; then
    echo -e "${GREEN}✓ openclaude CLI is available${NC}"
else
    echo -e "${RED}✗ openclaude CLI not found${NC}"
fi
echo ""

# Usage instructions
echo -e "${BLUE}=== Usage Instructions ===${NC}"
echo "To use OpenClaude, connect to this container:"
echo ""
echo -e "  ${GREEN}docker exec -it openclaude bash${NC}"
echo ""
echo "Then run openclaude:"
echo ""
echo -e "  ${GREEN}openclaude${NC}"
echo ""
echo "Or run directly without entering the container:"
echo ""
echo -e "  ${GREEN}docker exec -it openclaude openclaude${NC}"
echo ""
echo -e "${BLUE}=== Container is now running ===${NC}"
echo -e "Container will stay alive until stopped."
echo ""

# Create a health check file
touch /tmp/healthy

# Execute the CMD from Dockerfile or passed arguments
if [ $# -eq 0 ]; then
    # No arguments, keep container alive
    exec tail -f /dev/null
else
    # Execute passed arguments
    exec "$@"
fi