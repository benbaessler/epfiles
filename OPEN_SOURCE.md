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

- [x] `CONTRIBUTING.md` — contribution guidelines
- [x] `CODE_OF_CONDUCT.md` — community standards
- [x] `SECURITY.md` — vulnerability reporting process

---

## 4. Docker Configuration

- [x] Create `Dockerfile` for backend
- [x] Create `Dockerfile` for frontend
- [x] Create `docker-compose.yml` for local development

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
- [x] Document ChromaDB bootstrap URL or make configurable
- [x] Decide on `data/chunks/` distribution strategy:
  - ~~Option A: Include in repo (document in README)~~
  - ~~Option B: Exclude via `.gitignore`~~
  - **Option C: Provide separate download link** ✓
  - Created `scripts/download-data.sh` for GitHub Releases distribution

---

## 8. Security Audit

- [x] Git history clean — no API keys
  - No AWS keys (AKIA pattern), no `sk-` prefixed secrets in history
  - No private keys or `-----BEGIN` blocks found
  - No `.pem`, `.key`, or SSH key files in history
- [x] `.env` files gitignored
  - Root `.gitignore`: `.env`, `.env.local`, `.env.*.local`
  - `packages/backend/.gitignore`: `.env`
  - `packages/interface/.gitignore`: `.env*`, `!.env.example`
  - Only `.env.example` files tracked (placeholder values only)
- [x] `service_account.json` never committed
  - No `service_account.json` in tracked files
  - No `service_account*` in git history
- [x] Verify no production URLs remain
  - Placeholder URLs in docs: `your-backend.railway.app`, `your-domain.com`
  - Public R2 URL for ChromaDB bootstrap is intentional (public asset)
  - External service URLs (xAI, PostHog, Clerk) are expected
- [x] Final git history audit (BFG if needed)
  - Large files in history are data files (chunks, gdrive-links.json)
  - No secrets detected requiring BFG cleanup

---

## 9. Final Checks

- [x] Run full test suite (backend + frontend) → `./scripts/test-all.sh`
- [x] Test fresh clone + setup on clean machine → `./scripts/verify-setup.sh`
- [x] Verify all environment variables documented → `.env.example`
- [x] Write release notes

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
