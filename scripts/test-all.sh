#!/usr/bin/env bash
# =============================================================================
# Full Test Suite Runner
# =============================================================================
# Runs all backend and frontend tests.
#
# Usage:
#   ./scripts/test-all.sh           # Run all tests
#   ./scripts/test-all.sh --ci      # Run in CI mode (fail fast, no watch)
#   ./scripts/test-all.sh --verbose # Run with verbose output
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
CI_MODE=false
VERBOSE=false

for arg in "$@"; do
  case $arg in
    --ci)
      CI_MODE=true
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
  esac
done

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              EPFILES FULL TEST SUITE                          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Track results
BACKEND_RESULT=0
FRONTEND_RESULT=0
LINT_RESULT=0

# -----------------------------------------------------------------------------
# Backend Tests
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}▶ Running Backend Tests (pytest)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT/packages/backend"

# Check if virtual environment exists
if [ -d "venv" ]; then
  source venv/bin/activate
elif [ -d "env_name" ]; then
  source env_name/bin/activate
else
  echo -e "${RED}Error: No virtual environment found. Create one with:${NC}"
  echo "  python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

# Run pytest
PYTEST_ARGS="-v"
if [ "$CI_MODE" = true ]; then
  PYTEST_ARGS="$PYTEST_ARGS --tb=short"
fi

if python -m pytest $PYTEST_ARGS tests/; then
  echo -e "${GREEN}✓ Backend tests passed${NC}"
else
  BACKEND_RESULT=1
  echo -e "${RED}✗ Backend tests failed${NC}"
fi

deactivate 2>/dev/null || true
echo ""

# -----------------------------------------------------------------------------
# Frontend Tests
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}▶ Running Frontend Tests (vitest)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT/packages/interface"

# Check for bun
if ! command -v bun &> /dev/null; then
  echo -e "${RED}Error: bun is not installed. Install it with:${NC}"
  echo "  curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

# Run vitest
if bun test; then
  echo -e "${GREEN}✓ Frontend tests passed${NC}"
else
  FRONTEND_RESULT=1
  echo -e "${RED}✗ Frontend tests failed${NC}"
fi

echo ""

# -----------------------------------------------------------------------------
# Lint Check
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}▶ Running Lint Check (eslint)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if bun lint; then
  echo -e "${GREEN}✓ Lint check passed${NC}"
else
  LINT_RESULT=1
  echo -e "${RED}✗ Lint check failed${NC}"
fi

echo ""

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                      TEST SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $BACKEND_RESULT -eq 0 ]; then
  echo -e "  Backend Tests:  ${GREEN}PASSED${NC}"
else
  echo -e "  Backend Tests:  ${RED}FAILED${NC}"
fi

if [ $FRONTEND_RESULT -eq 0 ]; then
  echo -e "  Frontend Tests: ${GREEN}PASSED${NC}"
else
  echo -e "  Frontend Tests: ${RED}FAILED${NC}"
fi

if [ $LINT_RESULT -eq 0 ]; then
  echo -e "  Lint Check:     ${GREEN}PASSED${NC}"
else
  echo -e "  Lint Check:     ${RED}FAILED${NC}"
fi

echo ""

# Exit with appropriate code
TOTAL_RESULT=$((BACKEND_RESULT + FRONTEND_RESULT + LINT_RESULT))
if [ $TOTAL_RESULT -eq 0 ]; then
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                  ALL TESTS PASSED ✓                           ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                  SOME TESTS FAILED ✗                          ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi


