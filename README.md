# Epfiles

A RAG-powered document exploration system for the Epstein Files corpus. Query thousands of court documents, depositions, and flight logs with AI-assisted search and source citations.

## Architecture

```
epfiles/
├── packages/
│   ├── interface/     # Next.js frontend (React 19, Tailwind CSS)
│   └── backend/       # FastAPI RAG backend (Python, ChromaDB)
└── .env               # Central environment configuration
```

## Prerequisites

- **Python** 3.11+
- **Bun** (or Node.js 20+)
- **PostgreSQL** 15+

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
XAI_API_KEY=xai-xxx             # For LLM
DATABASE_URL=postgresql://...   # PostgreSQL connection
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

## Data Setup

The ChromaDB vector database is **automatically downloaded** on first server startup if not present. No manual setup required.

To use a custom database URL, set the environment variable:

```bash
CHROMADB_DOWNLOAD_URL=https://your-bucket.com/chroma_db.zip
```

### Source Document Chunks (Optional)

The pre-processed document chunks are distributed separately to keep the repository lightweight. Download them if you want to regenerate embeddings or modify the dataset:

```bash
# Download chunks (~60MB compressed, ~190MB extracted)
./scripts/download-data.sh
```

This downloads JSONL files to `packages/backend/data/chunks/`.

### Regenerate Embeddings (Optional)

After downloading chunks, you can regenerate the ChromaDB:

```bash
cd packages/backend
source venv/bin/activate

# Generate embeddings and build ChromaDB
python scripts/embed_and_upload.py
```

This will:
1. Read chunks from `packages/backend/data/chunks/`
2. Generate embeddings using OpenAI
3. Store in ChromaDB at `packages/backend/chroma_db/`

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
└── backend/
    ├── app/
    │   ├── api/           # API routes
    │   ├── core/          # Config and settings
    │   ├── models/        # Database models
    │   └── services/      # RAG service
    ├── scripts/           # Embedding scripts
    └── requirements.txt
```