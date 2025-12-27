# Open Source Checklist

Checklist for open sourcing Epfiles.

---

## 1. Critical Blockers

These must be completed before open sourcing:

- [x] Add LICENSE file (MIT or Apache 2.0)
- [x] Create `.env.example` files:
  - [x] Root `.env.example` with all required variables
  - [x] `packages/backend/.env.example`
  - [x] `packages/interface/.env.example`
- [x] Remove/replace `epfiles.ai` production URLs:
  - [x] `packages/interface/src/app/about/page.tsx` — support email
  - [x] `packages/interface/src/app/legal/page.tsx` — legal text references
  - [x] `packages/interface/next.config.ts` — CSP headers
  - [x] `packages/interface/README.md` — title
- [x] Fix backend tests (currently mock Groq but code uses xAI)

---

## 2. GitHub Infrastructure

- [x] Create `.github/workflows/`:
  - [x] `backend-tests.yml` — Python tests
  - [x] `frontend-tests.yml` — Vitest + lint
  - [x] `typecheck.yml` — TypeScript checking
- [x] Create `.github/ISSUE_TEMPLATE/`:
  - [x] Bug report template
  - [x] Feature request template
- [x] Create `.github/PULL_REQUEST_TEMPLATE.md`

---

## 3. Community Files

- [ ] `CONTRIBUTING.md` — contribution guidelines
- [ ] `CODE_OF_CONDUCT.md` — community standards
- [ ] `SECURITY.md` — vulnerability reporting process

---

## 4. Docker Configuration

- [ ] Create `Dockerfile` for backend
- [ ] Create `Dockerfile` for frontend
- [ ] Create `docker-compose.yml` for local development

---

## 5. Documentation

### Root README.md
- [x] Project description
- [x] Quick start guide
- [x] Requirements (Python, Node, API keys)

### Additional docs
- [x] `docs/SETUP.md` — detailed installation instructions
- [x] `docs/DEPLOYMENT.md` — production deployment guide
- [x] `docs/CONFIGURATION.md` — all environment variables explained

---

## 6. Code Cleanup

### Backend
- [x] Remove hardcoded tier limits (moved to config)
- [x] All settings from environment/config
- [x] Remove unused code/comments
- [x] Fix "JeffGPT" naming in `ARCHITECTURE.md`

### Frontend
- [x] xAI API key user input implemented
- [x] No TODO/FIXME comments
- [x] Remove legal pages (deployers create their own)

---

## 7. Data Handling

- [x] Document ChromaDB creation from scratch
- [x] Embedding scripts provided (`scripts/embed_and_upload.py`)
- [ ] Document ChromaDB bootstrap URL or make configurable
- [ ] Decide on `data/chunks/` distribution strategy:
  - Option A: Include in repo (document in README)
  - Option B: Exclude via `.gitignore`
  - Option C: Provide separate download link

---

## 8. Security Audit

- [x] Git history clean — no API keys
- [x] `.env` files gitignored
- [x] `service_account.json` never committed
- [ ] Verify no production URLs remain
- [ ] Final git history audit (BFG if needed)

---

## 9. Final Checks

- [ ] Run full test suite (backend + frontend)
- [ ] Test fresh clone + setup on clean machine
- [ ] Verify all environment variables documented
- [ ] Write release notes

---

## 10. Launch

- [ ] Push to public GitHub
- [ ] Add repository topics (rag, llm, citations, document-search, etc.)
- [ ] Post to Hacker News (Show HN)
- [ ] Post to r/MachineLearning, r/LocalLLaMA
- [ ] Tweet announcement
- [ ] Submit to Awesome lists (awesome-rag, awesome-llm)

---

## Notes

- The "citations-first" RAG pattern is the main value proposition
- Consider writing a blog post explaining architecture decisions
