# EPFiles

A RAG-powered document exploration system for the Epstein Files corpus. Query thousands of court documents, depositions, and flight logs with AI-assisted search and source citations.

## Architecture

```
epfiles/
├── packages/
│   ├── interface/     # Next.js frontend (React 19, Tailwind CSS)
│   ├── backend/       # FastAPI RAG backend (Python, ChromaDB)
│   └── dataset/       # Data processing scripts
└── .env               # Central environment configuration
```

**Stack:**
- **Frontend**: Next.js 16, React 19, Tailwind CSS, Clerk Auth
- **Backend**: FastAPI, ChromaDB, LangChain
- **LLM**: xAI Grok / OpenAI / Groq (configurable)
- **Embeddings**: OpenAI text-embedding-3-large
- **Database**: PostgreSQL (conversations), ChromaDB (vectors)

## Prerequisites

- **Python** 3.11+
- **Bun** (or Node.js 20+)
- **PostgreSQL** 15+
- API keys for:
  - OpenAI (embeddings)
  - xAI/Groq/OpenAI (LLM - choose one)
  - Clerk (authentication)

## Quick Start

### 1. Clone and Configure Environment

```bash
git clone git@github.com:benbaessler/epfiles.git
cd epfiles

# Copy example env and fill in your values
cp .env.example .env
```

Edit `.env` with your API keys:

```bash
# Required
OPENAI_API_KEY=sk-xxx           # For embeddings
XAI_API_KEY=xai-xxx             # For LLM (or use GROQ_API_KEY)
DATABASE_URL=postgresql://...   # PostgreSQL connection
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
```

### 2. Set Up Backend

```bash
cd packages/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 3. Set Up Interface

```bash
cd packages/interface

# Install dependencies
bun install

# Start development server
bun dev
```

The interface will be available at `http://localhost:3000`.

## Data Pipeline

If you need to regenerate the vector database from source documents:

### Step 1: Extract Text from PDFs

```bash
cd packages/dataset
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # Create this if needed

# Extract text from source PDFs
python scripts/extract_text.py
```

### Step 2: Chunk and Clean Text

```bash
# Clean extracted text
python scripts/clean_text.py

# Chunk into embedding-sized pieces
python scripts/chunk_text.py
```

### Step 3: Generate Embeddings and Build ChromaDB

```bash
cd ../backend
source venv/bin/activate

# Run the embedding and upload script
python scripts/embed_and_upload.py
```

This will:
1. Read chunks from `packages/backend/data/chunks/`
2. Generate embeddings using OpenAI
3. Store in ChromaDB at `packages/backend/chroma_db/`

**Estimated time**: 30-60 minutes  
**Estimated cost**: ~$10-30 for embeddings (one-time)

## Environment Variables Reference

| Variable | Package | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | Backend | OpenAI API key for embeddings |
| `XAI_API_KEY` | Backend | xAI/Grok API key (default LLM) |
| `GROQ_API_KEY` | Backend | Groq API key (alternative LLM) |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `CHROMA_DB_PATH` | Backend | Path to ChromaDB (default: `./chroma_db`) |
| `LLM_PROVIDER` | Backend | `xai`, `openai`, or `groq` |
| `LLM_MODEL` | Backend | Model name (e.g., `grok-4-1-fast-reasoning`) |
| `APP_ENV` | Backend | `development` or `production` |
| `CORS_ORIGINS` | Backend | JSON array of allowed origins |
| `BACKEND_URL` | Interface | Backend API URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Interface | Clerk public key |
| `CLERK_SECRET_KEY` | Interface | Clerk secret key |

## Development

### Running Tests

```bash
# Backend tests
cd packages/backend
source venv/bin/activate
pytest

# Interface tests
cd packages/interface
bun test
```

### Project Structure

```
packages/
├── interface/
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and types
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Config and settings
│   │   ├── models/        # Database models
│   │   └── services/      # RAG service
│   ├── scripts/           # Data processing scripts
│   └── requirements.txt
│
└── dataset/
    ├── scripts/           # Text extraction and processing
    ├── manifest/          # Document manifest
    └── sources/           # Source documentation
```

## Deployment

### Backend (Railway)

```bash
cd packages/backend
# Push to GitHub, then deploy via Railway dashboard
# Set environment variables in Railway
```

### Interface (Vercel)

```bash
cd packages/interface
vercel
```

Set the root directory to `packages/interface` in Vercel settings.

## Costs

| Component | Low Traffic | Medium Traffic |
|-----------|-------------|----------------|
| ChromaDB | FREE | FREE |
| OpenAI Embeddings | ~$2/mo | ~$10/mo |
| xAI/Groq LLM | ~$5-20/mo | ~$20-50/mo |
| Railway Backend | FREE-$10/mo | $10-20/mo |
| Vercel Frontend | FREE | FREE |
| **Total** | **~$7-30/mo** | **~$30-80/mo** |

## License

MIT
