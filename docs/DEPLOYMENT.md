# Deployment Guide

Production deployment instructions for Epfiles.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│    Backend      │───▶│   PostgreSQL    │
│   (Vercel)      │    │   (Railway)     │    │   (Railway)     │
└─────────────────┘    └────────┬────────┘    └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │    ChromaDB     │
                       │  (Persistent)   │
                       └─────────────────┘
```

---

## Platform Options

| Component | Recommended | Alternatives |
|-----------|-------------|--------------|
| Frontend | Vercel | Netlify, Cloudflare Pages, Railway |
| Backend | Railway | Render, Fly.io, AWS ECS |
| Database | Railway PostgreSQL | Supabase, Neon, AWS RDS |
| ChromaDB | Persistent Volume | R2/S3 Download |

---

## Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL service from templates

### Step 2: Deploy Backend

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
cd packages/backend
railway link
```

### Step 3: Configure Environment

Set these variables in Railway dashboard:

```bash
# Required
OPENAI_API_KEY=sk-xxx
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Railway variable reference

# Production settings
APP_ENV=production
CORS_ORIGINS='["https://your-frontend-domain.com"]'

# Optional
XAI_API_KEY=xai-xxx
CHROMADB_DOWNLOAD_URL=https://your-bucket.com/chroma_db.zip
```

### Step 4: Add Persistent Volume

ChromaDB must persist between deployments:

1. In Railway dashboard, go to your backend service
2. Settings → Volumes
3. Add volume:
   - Mount path: `/app/chroma_db`
   - Size: 1GB minimum

### Step 5: Configure Build

Railway auto-detects Docker. Ensure `Dockerfile` is present:

```dockerfile
# packages/backend/Dockerfile is pre-configured
```

Railway settings:
- Root directory: `packages/backend`
- Build command: (auto from Dockerfile)
- Start command: (auto from Dockerfile CMD)

### Step 6: Deploy

```bash
railway up
```

Or push to GitHub with Railway GitHub integration enabled.

### Verify Backend

```bash
curl https://your-backend.railway.app/health
```

---

## Frontend Deployment (Vercel)

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Select the repository

### Step 2: Configure Build

Project settings:
- Framework preset: Next.js
- Root directory: `packages/interface`
- Build command: `bun run build`
- Install command: `bun install`

### Step 3: Environment Variables

Add in Vercel dashboard (Settings → Environment Variables):

```bash
# Required
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_ENV=production

# Optional (if using analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Optional (if using Clerk auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
```

### Step 4: Deploy

Push to main branch or click "Deploy" in Vercel dashboard.

### Verify Frontend

Visit your Vercel deployment URL.

---

## Docker Self-Hosted Deployment

For VPS or self-managed infrastructure.

### Prerequisites

- Docker and Docker Compose
- Domain with SSL (recommended: Caddy or nginx-proxy)
- 2GB RAM minimum
- 10GB disk space

### Step 1: Clone and Configure

```bash
git clone https://github.com/benbaessler/epfiles.git
cd epfiles

cp .env.example .env
```

Edit `.env` for production:

```bash
# API Keys
OPENAI_API_KEY=sk-xxx
XAI_API_KEY=xai-xxx

# Database (use strong password)
DATABASE_URL=postgresql://epfiles:STRONG_PASSWORD@postgres:5432/epfiles

# Production settings
APP_ENV=production
CORS_ORIGINS='["https://your-domain.com"]'
```

### Step 2: Create Production Compose Override

Create `docker-compose.prod.yml`:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: STRONG_PASSWORD
    restart: always

  backend:
    environment:
      APP_ENV: production
      CORS_ORIGINS: '["https://your-domain.com"]'
    restart: always

  frontend:
    build:
      args:
        NEXT_PUBLIC_BACKEND_URL: https://api.your-domain.com
        NEXT_PUBLIC_APP_ENV: production
    restart: always
```

### Step 3: Deploy with Reverse Proxy

Example with Caddy (create `Caddyfile`):

```caddyfile
your-domain.com {
    reverse_proxy frontend:3000
}

api.your-domain.com {
    reverse_proxy backend:8000
}
```

Add Caddy to `docker-compose.prod.yml`:

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - frontend
      - backend
    networks:
      - epfiles_network

volumes:
  caddy_data:
```

### Step 4: Start Services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Database Migration

### Initial Setup

Migrations run automatically on backend startup via:

```bash
alembic upgrade head && uvicorn app.main:app ...
```

### Manual Migration

```bash
# SSH into backend container
docker exec -it epfiles-backend sh

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"
```

---

## ChromaDB Management

### Pre-built Database

Default behavior downloads ChromaDB from:

```bash
CHROMADB_DOWNLOAD_URL=https://pub-bb289fb1eb1845dda7000f73a13d37cd.r2.dev/chroma_db.zip
```

### Custom Database

1. Build ChromaDB locally:
   ```bash
   python scripts/embed_and_upload.py
   ```

2. Upload `chroma_db/` to cloud storage (R2, S3, GCS)

3. Update environment:
   ```bash
   CHROMADB_DOWNLOAD_URL=https://your-bucket.com/chroma_db.zip
   ```

### Updating Embeddings

1. Add new chunks to `data/chunks/`
2. Regenerate embeddings
3. Upload new zip to storage
4. Restart backend (or delete existing `chroma_db/`)

---

## Monitoring

### Health Checks

```bash
# Backend health endpoint
curl https://api.your-domain.com/health

# Response
{
  "status": "healthy",
  "chromadb": "ok",
  "database": "ok"
}
```

### Logs

Railway:
```bash
railway logs
```

Docker:
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Recommended Monitoring

- **Uptime**: UptimeRobot, Pingdom
- **Errors**: Sentry
- **Analytics**: PostHog, Plausible
- **Logs**: Logtail, Papertrail

---

## Security Checklist

### Environment Variables

- [ ] `APP_ENV=production` set
- [ ] Strong database password
- [ ] API keys not in code or logs
- [ ] `CORS_ORIGINS` restricted to your domain

### Network

- [ ] HTTPS enabled (SSL certificate)
- [ ] Backend not publicly accessible (internal only, or with auth)
- [ ] Database not exposed to internet
- [ ] Rate limiting enabled

### Headers (Auto-configured)

Frontend automatically sets:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- Content Security Policy

---

## Scaling

### Horizontal Scaling

**Backend**: Stateless — scale to multiple instances.

Railway:
- Increase replica count in settings

Docker:
```yaml
services:
  backend:
    deploy:
      replicas: 3
```

**Note**: ChromaDB must be shared (persistent volume or external service).

### Vertical Scaling

Increase resources:
- Railway: Adjust memory/CPU in settings
- Docker: Set resource limits in compose

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

### Database Scaling

PostgreSQL:
- Railway: Upgrade plan for larger instance
- Self-hosted: Add read replicas for query load

---

## Troubleshooting

### Backend 500 Errors

Check logs:
```bash
railway logs  # or docker compose logs backend
```

Common causes:
- Missing `OPENAI_API_KEY`
- Database connection failed
- ChromaDB not initialized

### CORS Errors

Verify `CORS_ORIGINS` contains your frontend URL exactly:
```bash
# Correct
CORS_ORIGINS='["https://epfiles.com"]'

# Wrong (trailing slash)
CORS_ORIGINS='["https://epfiles.com/"]'
```

### Slow Startup

ChromaDB download takes 1-2 minutes on first start. Check logs:
```
Downloading ChromaDB from ...
Extracting database...
Database setup complete!
```

### Database Migrations Failed

```bash
# Check migration status
alembic current

# View pending migrations
alembic history

# Force specific version
alembic upgrade <revision>
```

---

## Cost Estimates

### Railway

| Service | Estimated Cost |
|---------|----------------|
| Backend | $5-20/month |
| PostgreSQL | $5-10/month |
| Volume (1GB) | $0.25/month |

### Vercel

- Hobby: Free (limited)
- Pro: $20/month

### API Costs

| Provider | Cost per Query |
|----------|----------------|
| OpenAI Embeddings | ~$0.0001-0.0003 |
| xAI Grok | Varies by model |

---

## Related Documentation

- [Setup Guide](./SETUP.md) — Local development
- [Configuration Reference](./CONFIGURATION.md) — All environment variables
- [Architecture](../ARCHITECTURE.md) — System design


