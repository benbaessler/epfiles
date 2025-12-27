#!/usr/bin/env bash
# =============================================================================
# Fresh Clone Verification Script
# =============================================================================
# Verifies that a fresh clone can be set up and run correctly.
# This script checks all dependencies, configuration, and basic functionality.
#
# Usage:
#   ./scripts/verify-setup.sh           # Run all checks
#   ./scripts/verify-setup.sh --quick   # Skip optional checks
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Parse arguments
QUICK_MODE=false
for arg in "$@"; do
  case $arg in
    --quick)
      QUICK_MODE=true
      shift
      ;;
  esac
done

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            EPFILES SETUP VERIFICATION                         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Track results
ERRORS=0
WARNINGS=0

# Utility functions
check_pass() {
  echo -e "  ${GREEN}✓${NC} $1"
}

check_fail() {
  echo -e "  ${RED}✗${NC} $1"
  ERRORS=$((ERRORS + 1))
}

check_warn() {
  echo -e "  ${YELLOW}⚠${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

check_skip() {
  echo -e "  ${GRAY}○${NC} $1 (skipped)"
}

# -----------------------------------------------------------------------------
# 1. Prerequisites Check
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}▶ Checking Prerequisites${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Python
if command -v python3 &> /dev/null; then
  PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
  PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f1)
  PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f2)
  if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 11 ]; then
    check_pass "Python $PYTHON_VERSION (>= 3.11 required)"
  else
    check_warn "Python $PYTHON_VERSION (>= 3.11 recommended)"
  fi
else
  check_fail "Python 3 not found"
fi

# Bun
if command -v bun &> /dev/null; then
  BUN_VERSION=$(bun --version 2>&1)
  check_pass "Bun $BUN_VERSION"
else
  check_fail "Bun not found (install: curl -fsSL https://bun.sh/install | bash)"
fi

# PostgreSQL
if command -v psql &> /dev/null; then
  PG_VERSION=$(psql --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
  check_pass "PostgreSQL $PG_VERSION"
else
  check_warn "PostgreSQL CLI not found (may be using Docker)"
fi

# Docker (optional)
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  check_pass "Docker $DOCKER_VERSION (optional)"
else
  check_skip "Docker not installed (optional for docker-compose)"
fi

echo ""

# -----------------------------------------------------------------------------
# 2. Project Structure Check
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}▶ Checking Project Structure${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT"

# Required files
REQUIRED_FILES=(
  "packages/backend/requirements.txt"
  "packages/backend/app/main.py"
  "packages/backend/alembic.ini"
  "packages/interface/package.json"
  "packages/interface/src/app/page.tsx"
  "docker-compose.yml"
  "docs/SETUP.md"
  "docs/CONFIGURATION.md"
  ".env.example"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    check_pass "$file exists"
  else
    check_fail "$file missing"
  fi
done

echo ""

# -----------------------------------------------------------------------------
# 3. Environment Configuration Check
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}▶ Checking Environment Configuration${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check .env.example documents all required vars
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"
if [ -f "$ENV_EXAMPLE" ]; then
  # Check for required vars
  REQUIRED_ENV_VARS=("OPENAI_API_KEY" "DATABASE_URL" "NEXT_PUBLIC_BACKEND_URL")
  for var in "${REQUIRED_ENV_VARS[@]}"; do
    if grep -q "^$var=" "$ENV_EXAMPLE" || grep -q "^# $var=" "$ENV_EXAMPLE"; then
      check_pass "$var documented in .env.example"
    else
      check_fail "$var missing from .env.example"
    fi
  done
else
  check_fail ".env.example file missing"
fi

# Check if .env exists (warn if not)
if [ -f "$PROJECT_ROOT/.env" ]; then
  check_pass ".env file exists"
else
  check_warn ".env file not found (copy from .env.example)"
fi

echo ""

# -----------------------------------------------------------------------------
# 4. Backend Setup Verification
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}▶ Checking Backend Setup${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT/packages/backend"

# Check requirements.txt has all necessary packages
REQUIRED_PACKAGES=("fastapi" "uvicorn" "pydantic" "openai" "chromadb" "sqlalchemy" "alembic" "pytest")
for pkg in "${REQUIRED_PACKAGES[@]}"; do
  if grep -qi "^$pkg" requirements.txt; then
    check_pass "$pkg in requirements.txt"
  else
    check_warn "$pkg not found in requirements.txt"
  fi
done

# Check virtual environment
if [ -d "venv" ] || [ -d "env_name" ]; then
  check_pass "Virtual environment exists"
else
  check_warn "No virtual environment found (run: python3 -m venv venv)"
fi

# Check migrations
if [ -d "migrations/versions" ]; then
  MIGRATION_COUNT=$(ls -1 migrations/versions/*.py 2>/dev/null | grep -v __pycache__ | wc -l | tr -d ' ')
  check_pass "$MIGRATION_COUNT database migrations found"
else
  check_fail "No migrations directory found"
fi

echo ""

# -----------------------------------------------------------------------------
# 5. Frontend Setup Verification
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}▶ Checking Frontend Setup${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT/packages/interface"

# Check node_modules
if [ -d "node_modules" ]; then
  check_pass "node_modules installed"
else
  check_warn "node_modules not found (run: bun install)"
fi

# Check for tests
if [ -d "__tests__" ]; then
  TEST_COUNT=$(find __tests__ -name "*.test.ts" -o -name "*.test.tsx" | wc -l | tr -d ' ')
  check_pass "$TEST_COUNT test files found"
else
  check_fail "No __tests__ directory found"
fi

# Check TypeScript config
if [ -f "tsconfig.json" ]; then
  check_pass "tsconfig.json exists"
else
  check_fail "tsconfig.json missing"
fi

echo ""

# -----------------------------------------------------------------------------
# 6. Documentation Check
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}▶ Checking Documentation${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT"

DOCS=(
  "README.md"
  "docs/SETUP.md"
  "docs/CONFIGURATION.md"
  "docs/DEPLOYMENT.md"
  "ARCHITECTURE.md"
  "CONTRIBUTING.md"
  "LICENSE"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    check_pass "$doc"
  else
    check_warn "$doc missing"
  fi
done

echo ""

# -----------------------------------------------------------------------------
# 7. Test Execution (if not quick mode)
# -----------------------------------------------------------------------------
if [ "$QUICK_MODE" = false ]; then
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}▶ Running Quick Test Verification${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  # Backend tests
  cd "$PROJECT_ROOT/packages/backend"
  if [ -d "venv" ]; then
    source venv/bin/activate
    if python -m pytest tests/ -q --tb=no 2>/dev/null; then
      check_pass "Backend tests pass"
    else
      check_warn "Backend tests failed (may need dependencies/config)"
    fi
    deactivate 2>/dev/null || true
  else
    check_skip "Backend tests (no venv)"
  fi
  
  # Frontend tests
  cd "$PROJECT_ROOT/packages/interface"
  if [ -d "node_modules" ]; then
    if bun test --run 2>/dev/null; then
      check_pass "Frontend tests pass"
    else
      check_warn "Frontend tests failed"
    fi
  else
    check_skip "Frontend tests (no node_modules)"
  fi
  
  echo ""
else
  check_skip "Test execution (--quick mode)"
  echo ""
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                    VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Errors:   ${RED}$ERRORS${NC}"
echo -e "  Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            SETUP VERIFIED SUCCESSFULLY ✓                      ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
  else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║        SETUP OK WITH WARNINGS - Review above ⚠                ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════╝${NC}"
  fi
  echo ""
  echo -e "Next steps:"
  echo -e "  1. Copy .env.example to .env and fill in your API keys"
  echo -e "  2. Start PostgreSQL (or use docker-compose)"
  echo -e "  3. Run: ${GRAY}cd packages/backend && source venv/bin/activate && alembic upgrade head${NC}"
  echo -e "  4. Run: ${GRAY}./scripts/test-all.sh${NC}"
  exit 0
else
  echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║            SETUP VERIFICATION FAILED ✗                        ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "Fix the errors above and run this script again."
  exit 1
fi

