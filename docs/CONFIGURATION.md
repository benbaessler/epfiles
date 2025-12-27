# Configuration Reference

Complete reference for all environment variables in Epfiles.

## Environment Files

```
epfiles/
├── .env                          # Root config (shared by all packages)
├── packages/backend/.env         # Backend overrides (optional)
└── packages/interface/.env.local # Frontend overrides (optional)
```

The root `.env` is loaded by both packages. Package-specific files override root values.

---

## Backend Configuration

### API Keys

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | **Yes** | — | OpenAI API key for embedding generation |
| `XAI_API_KEY` | No | — | xAI API key for LLM. Optional if users provide via header |

```bash
OPENAI_API_KEY=sk-proj-xxx
XAI_API_KEY=xai-xxx
```

**Notes**:
- `OPENAI_API_KEY` is always required — embeddings use OpenAI's `text-embedding-3-large`
- `XAI_API_KEY` is optional for server-side. Users can provide their own key via the UI

---

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `DB_POOL_SIZE` | No | `5` | SQLAlchemy connection pool size |
| `DB_MAX_OVERFLOW` | No | `10` | Maximum overflow connections beyond pool |

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/epfiles
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
```

**Connection String Format**:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Examples:
```bash
# Local
DATABASE_URL=postgresql://epfiles:epfiles@localhost:5432/epfiles

# Railway (use variable reference)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# With SSL (production)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

---

### RAG Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CHROMA_DB_PATH` | No | `./chroma_db` | Path to ChromaDB storage |
| `CHROMADB_DOWNLOAD_URL` | No | See below | URL to download pre-built ChromaDB |
| `COLLECTION_NAME` | No | `epstein_files` | ChromaDB collection name |
| `EMBEDDING_MODEL` | No | `text-embedding-3-large` | OpenAI embedding model |

```bash
CHROMA_DB_PATH=./chroma_db
CHROMADB_DOWNLOAD_URL=https://pub-bb289fb1eb1845dda7000f73a13d37cd.r2.dev/chroma_db.zip
COLLECTION_NAME=epstein_files
EMBEDDING_MODEL=text-embedding-3-large
```

**ChromaDB Download**:
- On first startup, if no vector data exists, the database is downloaded automatically
- Set custom URL to use your own pre-built database
- For Docker, mount a persistent volume to `/app/chroma_db`

---

### LLM Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_MODEL` | No | `grok-4-1-fast-reasoning` | xAI model identifier |
| `LLM_MAX_TOKENS` | No | `1000` | Maximum tokens in LLM response |
| `LLM_TEMPERATURE` | No | `0.1` | LLM temperature (0-1) |
| `XAI_BASE_URL` | No | `https://api.x.ai/v1` | xAI API base URL |

```bash
LLM_MODEL=grok-4-1-fast-reasoning
LLM_MAX_TOKENS=1000
LLM_TEMPERATURE=0.1
XAI_BASE_URL=https://api.x.ai/v1
```

**Available Models** (xAI):
- `grok-4-1-fast-reasoning` — Fast, efficient reasoning
- `grok-3` — Balanced performance
- `grok-3-fast` — Speed optimized

---

### Retrieval Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TOP_K_CHUNKS` | No | `6` | Number of chunks to retrieve per query |
| `MIN_SIMILARITY_THRESHOLD` | No | `0.3` | Minimum similarity score (0-1) |
| `MAX_CONTEXT_TOKENS` | No | `8000` | Maximum tokens in context window |
| `MAX_HISTORY_MESSAGES` | No | `10` | Conversation history messages to include |

```bash
TOP_K_CHUNKS=6
MIN_SIMILARITY_THRESHOLD=0.3
MAX_CONTEXT_TOKENS=8000
MAX_HISTORY_MESSAGES=10
```

**Tuning Tips**:
- Increase `TOP_K_CHUNKS` for broader context (slower, more thorough)
- Lower `MIN_SIMILARITY_THRESHOLD` to include more marginally relevant chunks
- Reduce `MAX_CONTEXT_TOKENS` if hitting model limits

---

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FREE_MESSAGE_LIMIT` | No | `10` | Free tier message limit |
| `RATE_LIMIT_WINDOW_SECONDS` | No | `86400` | Rate limit window (default: 24 hours) |

```bash
FREE_MESSAGE_LIMIT=10
RATE_LIMIT_WINDOW_SECONDS=86400
```

**Behavior**:
- Users without an API key get `FREE_MESSAGE_LIMIT` queries per window
- After limit, users must provide their own xAI API key
- Rate limit resets after `RATE_LIMIT_WINDOW_SECONDS`

---

### Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_ENV` | No | `development` | Environment mode: `development` or `production` |
| `CORS_ORIGINS` | Prod: **Yes** | `[]` | Allowed CORS origins (JSON array) |
| `API_TITLE` | No | `Epstein Files RAG API` | API documentation title |
| `API_VERSION` | No | `1.0.0` | API version string |

```bash
APP_ENV=production
CORS_ORIGINS='["https://epfiles.com"]'
API_TITLE="Epstein Files RAG API"
API_VERSION=1.0.0
```

**CORS Configuration**:

Development (`APP_ENV=development`):
- Defaults to `["http://localhost:3000"]`
- Allows localhost for development

Production (`APP_ENV=production`):
- `CORS_ORIGINS` is **required**
- Must be a JSON array: `'["https://domain.com"]'`
- Rejects localhost and placeholder domains

```bash
# Valid production CORS
CORS_ORIGINS='["https://epfiles.com"]'
CORS_ORIGINS='["https://epfiles.com", "https://www.epfiles.com"]'

# Invalid (will error in production)
CORS_ORIGINS='["http://localhost:3000"]'
CORS_ORIGINS='["https://yourdomain.com"]'
```

---

## Frontend Configuration

### Required Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | No | `http://localhost:8000` | Backend API URL |
| `NEXT_PUBLIC_APP_ENV` | No | `development` | Environment mode |
| `NEXT_PUBLIC_FREE_MESSAGE_COUNT` | No | `10` | Display value for free tier limit |

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_FREE_MESSAGE_COUNT=10
```

**Note**: `NEXT_PUBLIC_` prefix exposes variables to the browser.

**Development Mode**: When `NEXT_PUBLIC_APP_ENV` is not `production`, auth is mocked and API key UI is hidden (backend uses `XAI_API_KEY` from environment).

---

### Analytics (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | No | — | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | — | PostHog host URL |

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

### Authentication (Optional)

If using Clerk for authentication:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | — | Clerk publishable key |
| `CLERK_SECRET_KEY` | No | — | Clerk secret key (server-side) |

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
```

---

## Docker Compose Variables

When using `docker-compose.yml`, these variables are passed from your `.env`:

```yaml
# docker-compose.yml references
${OPENAI_API_KEY}
${XAI_API_KEY:-}  # Optional, defaults to empty
```

Create `.env` in project root:

```bash
OPENAI_API_KEY=sk-xxx
XAI_API_KEY=xai-xxx
```

---

## Example Configurations

### Local Development

```bash
# .env
OPENAI_API_KEY=sk-proj-xxx
XAI_API_KEY=xai-xxx
DATABASE_URL=postgresql://epfiles:epfiles@localhost:5432/epfiles

# Defaults work for everything else
```

### Docker Development

```bash
# .env
OPENAI_API_KEY=sk-proj-xxx
XAI_API_KEY=xai-xxx
# DATABASE_URL set automatically by docker-compose
```

### Production (Railway + Vercel)

Backend (Railway):
```bash
OPENAI_API_KEY=sk-proj-xxx
XAI_API_KEY=xai-xxx
DATABASE_URL=${{Postgres.DATABASE_URL}}
APP_ENV=production
CORS_ORIGINS='["https://epfiles.com"]'
```

Frontend (Vercel):
```bash
NEXT_PUBLIC_BACKEND_URL=https://api.epfiles.com
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_FREE_MESSAGE_COUNT=10
```

### Self-Hosted Production

```bash
# .env
OPENAI_API_KEY=sk-proj-xxx
XAI_API_KEY=xai-xxx
DATABASE_URL=postgresql://epfiles:STRONG_PASSWORD@postgres:5432/epfiles

# Production settings
APP_ENV=production
CORS_ORIGINS='["https://your-domain.com"]'

# Optional tuning
TOP_K_CHUNKS=8
LLM_MAX_TOKENS=1500
FREE_MESSAGE_LIMIT=5
```

---

## Security Best Practices

1. **Never commit `.env` files** — they're in `.gitignore`

2. **Use different keys per environment**:
   ```bash
   # Development
   OPENAI_API_KEY=sk-dev-xxx
   
   # Production
   OPENAI_API_KEY=sk-prod-xxx
   ```

3. **Restrict CORS in production**:
   ```bash
   # Never use wildcards
   CORS_ORIGINS='["https://your-exact-domain.com"]'
   ```

4. **Use strong database passwords**:
   ```bash
   # Generate strong password
   openssl rand -base64 32
   ```

5. **Rotate API keys periodically** — especially if exposed in logs or errors

---

## Related Documentation

- [Setup Guide](./SETUP.md) — Local installation
- [Deployment Guide](./DEPLOYMENT.md) — Production deployment
- [Architecture](../ARCHITECTURE.md) — System overview

