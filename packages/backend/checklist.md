## Next Steps Checklist

### Infrastructure (Phase 1)

- [x] Get Groq API key (free!)
- [x] Get OpenAI API key (for embeddings)
- [x] Set up `.env` file with both keys
- [x] Install Python dependencies (including ChromaDB, Groq)
- [x] Create project structure

### Data Ingestion (Phase 2)

- [x] Create `embed_and_upload.py` script
- [x] Run embedding generation (~30-60 min, ~$10-20 cost)
- [x] Verify chunks uploaded to ChromaDB (check `chroma_db/` folder created)

### Backend Development (Phase 3)

- [x] Create `app/core/config.py`
- [x] Create `app/services/rag_service.py`
- [x] Create `app/main.py` with FastAPI endpoints
- [x] Test locally with `curl` or Postman
- [x] Verify citations are working correctly

### Deployment (Phase 4)

- [x] Create `requirements.txt`
- [x] Create `Procfile` for Railway
- [x] Push code to GitHub
- [x] Deploy to Railway
- [x] Add `GROQ_API_KEY` environment variable
- [x] Add `OPENAI_API_KEY` environment variable
- [x] Fix Railway deployment crash (missing ChromaDB collection)

### Frontend (Phase 5)

- [ ] Create Next.js app
- [ ] Build chat interface
- [ ] Connect to backend API
- [ ] Deploy to Vercel
- [ ] Share with test users
