#!/bin/bash

# CloudIDE Build Script
# Comprehensive build process with quality checks and optimizations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build configuration
BUILD_MODE=${1:-production}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_LINT=${SKIP_LINT:-false}
SKIP_TYPECHECK=${SKIP_TYPECHECK:-false}
OUTPUT_DIR=${OUTPUT_DIR:-dist}

echo -e "${BLUE}🚀 Starting CloudIDE build process...${NC}"
echo -e "${BLUE}Build mode: ${BUILD_MODE}${NC}"
echo -e "${BLUE}Output directory: ${OUTPUT_DIR}${NC}"

# Check Node.js version
NODE_VERSION=$(node --version)
echo -e "${BLUE}Node.js version: ${NODE_VERSION}${NC}"

if ! node -e "process.exit(process.version.match(/v(\d+)/)[1] >= 18 ? 0 : 1)"; then
    echo -e "${RED}❌ Node.js 18 or higher is required${NC}"
    exit 1
fi

# Set build environment variables
export NODE_ENV=${BUILD_MODE}
export VITE_APP_VERSION=${VITE_APP_VERSION:-$(git describe --tags --always 2>/dev/null || echo "dev")}
export VITE_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export VITE_GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "${BLUE}Build info:${NC}"
echo -e "  Version: ${VITE_APP_VERSION}"
echo -e "  Date: ${VITE_BUILD_DATE}"
echo -e "  Git Hash: ${VITE_GIT_HASH}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
if [ -f "package-lock.json" ]; then
    npm ci --legacy-peer-deps
else
    npm install --legacy-peer-deps
fi

# Run quality checks
if [ "$SKIP_LINT" != "true" ]; then
    echo -e "${YELLOW}🔍 Running linter...${NC}"
    npm run lint
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping linting${NC}"
fi

if [ "$SKIP_TYPECHECK" != "true" ]; then
    echo -e "${YELLOW}🔧 Running type checker...${NC}"
    npm run typecheck
    echo -e "${GREEN}✅ Type checking passed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping type checking${NC}"
fi

# Run tests
if [ "$SKIP_TESTS" != "true" ]; then
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    npm run test:run
    echo -e "${GREEN}✅ Tests passed${NC}"

    if [ "$BUILD_MODE" = "production" ]; then
        echo -e "${YELLOW}📊 Generating test coverage...${NC}"
        npm run test:coverage
        echo -e "${GREEN}✅ Coverage report generated${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping tests${NC}"
fi

# Clean previous build
echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
rm -rf ${OUTPUT_DIR}

# Build the application
echo -e "${YELLOW}🏗️  Building application...${NC}"
if [ "$BUILD_MODE" = "development" ]; then
    npm run build:dev
else
    npm run build
fi

# Verify build output
if [ ! -d "${OUTPUT_DIR}" ]; then
    echo -e "${RED}❌ Build failed - output directory not found${NC}"
    exit 1
fi

if [ ! -f "${OUTPUT_DIR}/index.html" ]; then
    echo -e "${RED}❌ Build failed - index.html not found${NC}"
    exit 1
fi

# Generate build report
echo -e "${YELLOW}📋 Generating build report...${NC}"
BUILD_REPORT="${OUTPUT_DIR}/build-report.json"

cat > ${BUILD_REPORT} << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "${VITE_APP_VERSION}",
  "gitHash": "${VITE_GIT_HASH}",
  "nodeVersion": "${NODE_VERSION}",
  "buildMode": "${BUILD_MODE}",
  "outputDir": "${OUTPUT_DIR}",
  "files": $(find ${OUTPUT_DIR} -type f -name "*.js" -o -name "*.css" -o -name "*.html" | jq -R -s 'split("\n")[:-1]'),
  "sizes": {
EOF

# Calculate file sizes
JS_SIZE=$(find ${OUTPUT_DIR} -name "*.js" -exec wc -c {} \; | awk '{total += $1} END {print total}')
CSS_SIZE=$(find ${OUTPUT_DIR} -name "*.css" -exec wc -c {} \; | awk '{total += $1} END {print total}')
TOTAL_SIZE=$(du -sb ${OUTPUT_DIR} | cut -f1)

cat >> ${BUILD_REPORT} << EOF
    "javascript": ${JS_SIZE:-0},
    "css": ${CSS_SIZE:-0},
    "total": ${TOTAL_SIZE}
  }
}
EOF

# Display build summary
echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo -e "${BLUE}Build Summary:${NC}"
echo -e "  Total size: $(numfmt --to=iec ${TOTAL_SIZE})"
echo -e "  JavaScript: $(numfmt --to=iec ${JS_SIZE:-0})"
echo -e "  CSS: $(numfmt --to=iec ${CSS_SIZE:-0})"
echo -e "  Files: $(find ${OUTPUT_DIR} -type f | wc -l)"

# Check bundle size warnings
if [ ${JS_SIZE:-0} -gt 1048576 ]; then  # 1MB
    echo -e "${YELLOW}⚠️  JavaScript bundle is large ($(numfmt --to=iec ${JS_SIZE}))${NC}"
    echo -e "${YELLOW}   Consider code splitting or lazy loading${NC}"
fi

# Generate file integrity checksums
echo -e "${YELLOW}🔐 Generating file checksums...${NC}"
find ${OUTPUT_DIR} -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec sha256sum {} \; > ${OUTPUT_DIR}/checksums.txt

echo -e "${GREEN}✅ Build process completed successfully!${NC}"
echo -e "${BLUE}Output available in: ${OUTPUT_DIR}${NC}"
echo -e "${BLUE}Build report: ${BUILD_REPORT}${NC}"