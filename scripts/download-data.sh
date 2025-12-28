#!/bin/bash
#
# Download pre-processed document chunks for Epfiles
# These chunks are used to regenerate ChromaDB embeddings
#
# Usage: ./scripts/download-data.sh [--force]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CHUNKS_DIR="$PROJECT_ROOT/packages/backend/data/chunks"

# GitHub Release URL - update this when creating new data releases
RELEASE_TAG="${EPFILES_DATA_VERSION:-data-v1}"
REPO="${EPFILES_REPO:-benbaessler/epfiles}"
DOWNLOAD_URL="${EPFILES_CHUNKS_URL:-https://github.com/$REPO/releases/download/$RELEASE_TAG/chunks.tar.gz}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for --force flag
FORCE=false
if [[ "$1" == "--force" ]]; then
    FORCE=true
fi

# Check if chunks already exist
if [[ -d "$CHUNKS_DIR" ]] && [[ "$(ls -A "$CHUNKS_DIR" 2>/dev/null)" ]]; then
    if [[ "$FORCE" == "false" ]]; then
        log_warn "Chunks directory already exists at $CHUNKS_DIR"
        log_warn "Use --force to re-download and overwrite"
        exit 0
    else
        log_info "Force flag set, removing existing chunks..."
        rm -rf "$CHUNKS_DIR"
    fi
fi

# Create data directory if needed
mkdir -p "$(dirname "$CHUNKS_DIR")"

log_info "Downloading document chunks from GitHub Releases..."
log_info "URL: $DOWNLOAD_URL"

# Download and extract
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

if command -v curl &> /dev/null; then
    curl -L --progress-bar "$DOWNLOAD_URL" -o "$TEMP_FILE"
elif command -v wget &> /dev/null; then
    wget --progress=bar:force "$DOWNLOAD_URL" -O "$TEMP_FILE"
else
    log_error "Neither curl nor wget found. Please install one of them."
    exit 1
fi

# Check if download succeeded
if [[ ! -s "$TEMP_FILE" ]]; then
    log_error "Download failed or file is empty"
    log_error "Please check the release URL: $DOWNLOAD_URL"
    exit 1
fi

log_info "Extracting chunks..."
mkdir -p "$CHUNKS_DIR"
tar -xzf "$TEMP_FILE" -C "$CHUNKS_DIR" --strip-components=1 2>/dev/null || \
    tar -xzf "$TEMP_FILE" -C "$(dirname "$CHUNKS_DIR")" 2>/dev/null

# Verify extraction
CHUNK_COUNT=$(find "$CHUNKS_DIR" -name "*.jsonl" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$CHUNK_COUNT" -eq 0 ]]; then
    log_error "Extraction failed - no .jsonl files found"
    exit 1
fi

log_info "Successfully downloaded $CHUNK_COUNT chunk files"
log_info "Location: $CHUNKS_DIR"
echo ""
log_info "Next steps:"
echo "  1. Run embedding generation: cd packages/backend && python scripts/embed_and_upload.py"
echo "  2. Or start the server (ChromaDB auto-downloads if available)"


