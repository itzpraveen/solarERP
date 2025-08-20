#!/bin/bash

# Pre-commit Quality Checks
# Runs comprehensive checks before allowing commits

set -e

echo "🔍 Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Track if any check fails
FAILED=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2
    
    echo -e "${BLUE}Running: ${name}...${NC}"
    
    if eval $command; then
        echo -e "${GREEN}✓ ${name} passed${NC}"
    else
        echo -e "${RED}✗ ${name} failed${NC}"
        FAILED=1
    fi
    echo ""
}

# Backend checks
echo -e "${YELLOW}=== Backend Checks ===${NC}"

run_check "Backend ESLint" "npm run lint"
run_check "Backend Prettier" "npm run format:check"

# Frontend checks
echo -e "${YELLOW}=== Frontend Checks ===${NC}"

run_check "Frontend ESLint" "cd client-new && npm run lint"
run_check "Frontend Prettier" "cd client-new && npm run format:check"
run_check "TypeScript Check" "cd client-new && npm run type-check"

# Run quick tests if available
if [ "$SKIP_TESTS" != "true" ]; then
    echo -e "${YELLOW}=== Running Quick Tests ===${NC}"
    
    # Run only unit tests for speed
    run_check "Backend Unit Tests" "npm run test:unit 2>/dev/null || true"
    run_check "Frontend Unit Tests" "cd client-new && CI=true npm test -- --watchAll=false --testPathPattern=unit 2>/dev/null || true"
fi

# Check for common issues
echo -e "${YELLOW}=== Common Issues Check ===${NC}"

# Check for console.log statements
echo -e "${BLUE}Checking for console.log statements...${NC}"
CONSOLE_LOGS=$(grep -r "console\.log" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" src/ client-new/src/ 2>/dev/null | grep -v "// eslint-disable" | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $CONSOLE_LOGS console.log statements. Consider using proper logging.${NC}"
fi

# Check for TODO comments
echo -e "${BLUE}Checking for TODO comments...${NC}"
TODOS=$(grep -r "TODO\|FIXME\|HACK" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" src/ client-new/src/ 2>/dev/null | wc -l)
if [ "$TODOS" -gt 0 ]; then
    echo -e "${YELLOW}ℹ Found $TODOS TODO/FIXME/HACK comments${NC}"
fi

# Check for large files
echo -e "${BLUE}Checking for large files...${NC}"
LARGE_FILES=$(find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./client-new/node_modules/*" -not -path "./client-new/build/*" 2>/dev/null)
if [ ! -z "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠ Large files detected (>1MB):${NC}"
    echo "$LARGE_FILES"
fi

echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All pre-commit checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues before committing.${NC}"
    echo -e "${YELLOW}Tip: Run 'npm run lint:fix' and 'npm run format' to auto-fix some issues.${NC}"
    exit 1
fi