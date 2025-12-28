# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Ensure scripts are in PATH
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY alembic.ini .
COPY migrations/ ./migrations/
COPY app/ ./app/
COPY scripts/ ./scripts/

# Create directory for ChromaDB (will be downloaded on startup)
RUN mkdir -p /app/chroma_db

# Default port (Railway overrides via $PORT env var)
ENV PORT=8000
EXPOSE ${PORT}

# Health check (uses $PORT for dynamic port)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Run database initialization and start server (uses $PORT for Railway compatibility)
CMD ["sh", "-c", "python scripts/docker_entrypoint.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]

