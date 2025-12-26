# JeffGPT Architecture Reference

Quick reference for understanding system architecture and component interactions when planning features.

## System Components

### 1. Vector Database (`chroma/`)
**Role**: Embedding storage and similarity search  
**Technology**: ChromaDB (embedded SQLite)  
**Collection**: `epstein_files`  
**Embeddings**: OpenAI `text-embedding-3-large` (3,072 dims)

**Populated By**: `rag-backend/scripts/embed_and_upload.py`  
**Consumed By**: `rag-backend/app/services/rag_service.py`

### 2. RAG Backend (`backend/`)
**Role**: API server providing RAG queries  
**Technology**: FastAPI (Python)  
**Endpoints**:
- `POST /api/query` - Main RAG endpoint
- `GET /health` - Health check

**Dependencies**:
- ChromaDB (reads from `chroma/` or `chroma_db/`)
- Groq API (LLM inference)
- OpenAI API (embeddings)

**Consumed By**: `interface/` (frontend)

### 3. Frontend (`interface/`)
**Role**: User interface for querying documents  
**Technology**: Next.js 16 (TypeScript)  
**Features**: Chat interface, document viewer, citations

**Dependencies**: `rag-backend` API

## Data Flow

### Document Ingestion
```
Raw Files → Extract → Clean → Chunk → Embed → Vector DB
```

### Query Processing
```
User Query → Embed → Vector Search → Retrieve Chunks → Build Prompt → LLM → Response
```

## Key Data Structures

### Chunk Schema (JSONL)
```json
{
  "chunk_id": "HOUSE_OVERSIGHT_015803_0001",
  "chunk_index": 1,
  "doc_id": "HOUSE_OVERSIGHT_015803",
  "page_start": 1,
  "page_end": 1,
  "token_count": 1247,
  "char_count": 3456,
  "text": "Full chunk text...",
  "raw_path": "raw/IMAGES/001/003/HOUSE_OVERSIGHT_015803.jpg",
  "source_filename": "HOUSE_OVERSIGHT_015803.jpg",
  "chunked_at": "2025-01-XXT..."
}
```

### API Request
```json
{
  "query": "Who is Ghislaine Maxwell?",
  "top_k": 5
}
```

### API Response
```json
{
  "query": "Who is Ghislaine Maxwell?",
  "answer": "Ghislaine Maxwell is... [Source 1: HOUSE_OVERSIGHT_015803, Page 12]",
  "sources": [
    {
      "chunk_id": "...",
      "score": 0.87,
      "doc_id": "HOUSE_OVERSIGHT_015803",
      "page_start": 12,
      "page_end": 12,
      "text": "...",
      "source_filename": "..."
    }
  ],
  "model": "llama-3.1-8b-instant",
  "usage": { "prompt_tokens": 1234, "completion_tokens": 567, "total_tokens": 1801 }
}
```

## Integration Points

### Adding New Data Sources
1. Prepare chunked JSONL files with the standard schema
2. Place in `backend/data/chunks/`
3. Regenerate embeddings (`backend/scripts/embed_and_upload.py`)

### Modifying RAG Behavior
- **Retrieval**: Edit `backend/app/services/rag_service.py` → `retrieve_chunks()`
- **Prompting**: Edit `backend/app/services/rag_service.py` → `build_rag_prompt()`
- **LLM Model**: Change `backend/app/core/config.py` → `llm_model`

### Frontend Customization
- **UI Components**: `interface/src/components/`
- **API Integration**: `interface/src/components/chat/ChatInterface.tsx`
- **Styling**: Tailwind CSS in component files

## Environment Variables

### Backend (`.env` in `backend/`)
```
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-proj-...
CHROMA_DB_PATH=./chroma_db
COLLECTION_NAME=epstein_files
TOP_K_CHUNKS=5
LLM_MODEL=llama-3.1-8b-instant
EMBEDDING_MODEL=text-embedding-3-large
```

### Frontend
Currently hardcoded API URL in `ChatInterface.tsx`. Can be moved to env vars.

## File Paths

### Relative Paths (In Code)
- Backend reads chunks from: `data/chunks/`
- Backend stores ChromaDB at: `./chroma_db/` (or configured path)

## Feature Planning Checklist

When planning features:

1. **Backend Changes** (`backend/`)
   - [ ] Does this require new API endpoints?
   - [ ] Does this affect RAG pipeline?
   - [ ] Does this require new vector search strategies?
   - [ ] Does this require configuration changes?

2. **Frontend Changes** (`interface/`)
   - [ ] Does this require new UI components?
   - [ ] Does this affect chat interface?
   - [ ] Does this require new API integrations?
   - [ ] Does this affect document viewer?

3. **Database Changes** (`chroma/`)
   - [ ] Does this require re-embedding?
   - [ ] Does this require new metadata fields?
   - [ ] Does this require collection changes?

## Common Patterns

### Adding a New Query Type
1. Add endpoint in `backend/app/main.py`
2. Add service method in `backend/app/services/rag_service.py`
3. Update frontend to call new endpoint
4. Add UI for new query type

### Improving Retrieval Quality
1. Modify `retrieve_chunks()` in `rag_service.py`
2. Consider hybrid search (keyword + semantic)
3. Add re-ranking step
4. Test with sample queries

### Adding Fine-Tuning Data
1. Format as instruction-response pairs in JSONL
2. Use for LoRA/QLoRA fine-tuning

## Testing Strategy

### Backend
- Unit tests: `backend/tests/`
- Integration: Test API endpoints with sample queries
- Vector search: Verify retrieval quality

### Frontend
- Component tests: Test UI components
- Integration: Test API calls
- E2E: Test full query flow

### Data Pipeline
- Validate chunking: Check token counts, overlaps
- Validate manifest: Ensure all documents represented
- Validate embeddings: Verify upload to ChromaDB

## Deployment Considerations

### Backend (Railway)
- ChromaDB must persist (use persistent volume)
- Environment variables must be set
- Startup script downloads DB if missing

### Frontend (Vercel)
- API URL must be configured
- CORS must allow frontend domain
- Environment variables for API URL

### Data Updates
- Re-run embedding script when chunks change
- Re-deploy backend to pick up new ChromaDB
- No frontend changes needed for data updates

## Performance Characteristics

### Query Latency
- Embedding generation: ~200-500ms
- Vector search: ~50-200ms
- LLM generation: ~500-2000ms
- **Total**: ~1-3 seconds per query

### Cost per Query
- Embedding: ~$0.0001-0.0003
- LLM: FREE (Groq free tier)
- **Total**: ~$0.0001-0.0003 per query

### Scalability
- ChromaDB: Handles <1M vectors efficiently
- Groq free tier: 14,400 requests/day
- Railway: Scales with traffic (paid tiers)

## Troubleshooting

### Backend Issues
- **ChromaDB not found**: Run `embed_and_upload.py` script
- **API errors**: Check API keys in `.env`
- **Slow queries**: Check ChromaDB collection count, consider indexing

### Frontend Issues
- **API connection errors**: Check backend URL, CORS settings
- **No responses**: Check backend health endpoint
- **Citation links broken**: Verify source data structure

### Data Issues
- **Missing chunks**: Re-run chunking pipeline
- **Poor retrieval**: Check embedding quality, consider re-embedding
- **Manifest out of sync**: Rebuild manifest from extracted data
