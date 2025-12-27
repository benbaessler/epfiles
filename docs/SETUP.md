# Setup Guide

Complete installation instructions for Epfiles — a RAG-powered document exploration system.

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Bun | 1.0+ | Frontend package manager and runtime |
| PostgreSQL | 15+ | Conversation and user data storage |

### Required API Keys

| Provider | Purpose | Required |
|----------|---------|----------|
| [OpenAI](https://platform.openai.com/api-keys) | Embedding generation (`text-embedding-3-large`) | Yes |
| [xAI](https://console.x.ai/) | LLM inference (Grok models) | Optional (users can provide their own) |

---

## Installation Methods

### Method 1: Docker Compose (Recommended)

The fastest way to get Epfiles running locally.

```bash
# Clone repository
git clone https://github.com/benbaessler/epfiles.git
cd epfiles

# Create environment file
cp .env.example .env
```

Edit `.env` with your API keys:

```bash
OPENAI_API_KEY=sk-xxx
XAI_API_KEY=xai-xxx  # Optional
```

Start all services:

```bash
docker compose up -d
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **PostgreSQL**: localhost:5432

ChromaDB is automatically downloaded on first backend startup.

---

### Method 2: Manual Installation

For development or when you need more control.

#### Step 1: Clone and Configure

```bash
git clone https://github.com/benbaessler/epfiles.git
cd epfiles

# Copy environment template
cp .env.example .env
```

Edit `.env`:

```bash
OPENAI_API_KEY=sk-xxx
XAI_API_KEY=xai-xxx
DATABASE_URL=postgresql://user:password@localhost:5432/epfiles
```

#### Step 2: Set Up PostgreSQL

Option A — Local PostgreSQL:

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15
createdb epfiles

# Ubuntu/Debian
sudo apt install postgresql-15
sudo -u postgres createdb epfiles
```

Option B — Docker PostgreSQL:

```bash
docker run -d \
  --name epfiles-postgres \
  -e POSTGRES_USER=epfiles \
  -e POSTGRES_PASSWORD=epfiles \
  -e POSTGRES_DB=epfiles \
  -p 5432:5432 \
  postgres:15-alpine
```

Update `DATABASE_URL` in `.env`:

```bash
DATABASE_URL=postgresql://epfiles:epfiles@localhost:5432/epfiles
```

#### Step 3: Set Up Backend

```bash
cd packages/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --port 8000
```

The backend automatically downloads ChromaDB on first startup. This may take 1-2 minutes.

#### Step 4: Set Up Frontend

Open a new terminal:

```bash
cd packages/interface

# Install dependencies
bun install

# Start development server
bun dev
```

---

## Verification

### Health Check

```bash
# Backend health
curl http://localhost:8000/health

# Expected response
{"status": "healthy", "chromadb": "ok", "database": "ok"}
```

### Test Query

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -H "X-XAI-API-Key: YOUR_XAI_KEY" \
  -d '{"query": "Who is Jeffrey Epstein?"}'
```

### Frontend

Open http://localhost:3000 in your browser. You should see the chat interface.

---

## ChromaDB Setup

### Automatic Download (Default)

ChromaDB is downloaded automatically from a pre-built archive on first startup. No action required.

### Custom Database URL

To use a different ChromaDB source:

```bash
CHROMADB_DOWNLOAD_URL=https://your-bucket.com/chroma_db.zip
```

### Manual Regeneration

If you have source documents in `packages/backend/data/chunks/`:

```bash
cd packages/backend
source venv/bin/activate

# Generate embeddings (requires OPENAI_API_KEY)
python scripts/embed_and_upload.py
```

This creates a fresh ChromaDB at `packages/backend/chroma_db/`.

---

## Troubleshooting

### Backend won't start

**ChromaDB download failed**
- Check internet connectivity
- Verify `CHROMADB_DOWNLOAD_URL` is accessible
- Check disk space (ChromaDB is ~500MB)

**Database connection failed**
- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Ensure database exists: `createdb epfiles`

**Missing API keys**
- `OPENAI_API_KEY` is required for embeddings
- `XAI_API_KEY` is optional (users provide via UI)

### Frontend won't start

**Port 3000 in use**
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

**Backend connection failed**
- Verify backend is running at http://localhost:8000
- Check browser console for CORS errors
- Ensure `NEXT_PUBLIC_BACKEND_URL` matches backend URL

### Docker issues

**Container won't start**
```bash
# View logs
docker compose logs backend
docker compose logs frontend

# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up -d
```

**Database connection timeout**
- Increase `healthcheck` timeout in `docker-compose.yml`
- Ensure PostgreSQL container is healthy: `docker compose ps`

---

## Development Tips

### Running Tests

```bash
# Backend tests
cd packages/backend
source venv/bin/activate
pytest

# Frontend tests
cd packages/interface
bun test

# E2E tests (requires running app)
bun run test:e2e
```

### Hot Reload

Both backend and frontend support hot reload in development:
- Backend: `--reload` flag with uvicorn
- Frontend: Built-in with Next.js

### Environment Variables

The root `.env` file is shared by both packages. Package-specific overrides can be placed in:
- `packages/backend/.env`
- `packages/interface/.env.local`

See [CONFIGURATION.md](./CONFIGURATION.md) for all available options.

---

## Next Steps

- [Configuration Reference](./CONFIGURATION.md) — All environment variables
- [Deployment Guide](./DEPLOYMENT.md) — Production deployment
- [Architecture Overview](../ARCHITECTURE.md) — System design

