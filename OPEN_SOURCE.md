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
- [x] Remove unused `groq` package from requirements.txt
- [x] Update ARCHITECTURE.md to use xAI/Grok instead of Groq references

### Frontend
- [x] xAI API key user input implemented
- [x] No TODO/FIXME comments
- [x] Remove legal pages (deployers create their own)
- [x] Fix `packages/interface/README.md` env var documentation

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
- [x] Review ARCHITECTURE.md for accuracy (updated xAI/Grok references)
- [x] Review all package README files

---

## 10. Launch

**Target Date: Monday, December 29, 2025**

### Pre-Launch

#### Saturday, Dec 27
- [ ] Finalize HN post copy
- [ ] Finalize X thread copy
- [ ] Draft subreddit posts
- [ ] Draft emails (personal list + outreach)
- [ ] Push repo to public (or schedule for Monday)
- [ ] Record 30-60s demo video
- [ ] Prepare 3 screenshots: home, search results with citations, source viewer

#### Sunday, Dec 28
- [ ] Test fresh clone on clean machine (`./scripts/verify-setup.sh`)
- [ ] Verify Docker Compose works end-to-end
- [ ] Test ChromaDB auto-download on fresh install
- [ ] Prep HN account (ensure not shadowbanned)
- [ ] Queue X thread in scheduler
- [ ] Prep email list

### Launch Day (Monday, Dec 29)

| Time (ET) | Action |
|-----------|--------|
| 8:00 AM | Push repo public (if not done) |
| 8:30 AM | Post **Show HN** |
| 8:35 AM | Post **X thread** |
| 8:45 AM | Send **email blast** (personal list) |
| 9:00 AM | Post to **r/MachineLearning** |
| 9:15 AM | Post to **r/LocalLLaMA** |
| 9:30 AM | Post to **r/SideProject** |
| 9:00–12:00 | Camp in HN comments |
| 12:00 PM | Send outreach emails (10-15 targets) |

### Launch Checklist

- [ ] Push to public GitHub
- [x] Add repository topics (rag, llm, citations, document-search, etc.)
- [ ] Post to Hacker News (Show HN)
- [ ] Post to r/MachineLearning, r/LocalLLaMA, r/SideProject
- [ ] Tweet announcement
- [ ] Send email to personal list
- [ ] Send outreach emails (journalists, researchers)
- [ ] Submit to Awesome lists (awesome-rag, awesome-llm)

---

## 11. Copy Bank

### Show HN

**Title:**
```
Show HN: Epfiles – Open-source citations-first RAG for 20k+ Epstein files
```

**Body:**
```
I built Epfiles, an open-source RAG app for searching the U.S. House Oversight Epstein files (20,000+ documents).

The key design decision: citations-first. Every answer links to the exact source chunk so you can verify. No black-box answers.

Stack: Next.js 15 + FastAPI + ChromaDB + xAI (Grok). Full Docker Compose setup included.

Why open source: The previous closed version had minimal distribution. Open sourcing gives developers and researchers a reusable citations-first RAG pattern.

What's included:
- Pre-built ChromaDB (auto-downloads on first run)
- Document chunks as separate download (~190MB)
- Scripts to regenerate embeddings with your own model
- Docker Compose for one-command setup

Limitations:
- LLM can still hallucinate; citations let you verify fast
- Corpus is fixed (House Oversight release only)
- Requires OpenAI API key for embeddings, xAI for generation (configurable)

GitHub: https://github.com/benbaessler/epfiles
```

**First comment (post immediately):**
```
Creator here. Happy to answer questions about the architecture.

Quick FAQ:
- Why citations-first? Most RAG apps treat sources as an afterthought. This inverts that — sources are the primary output, synthesis is secondary.
- Why xAI/Grok? Fast, cheap, handles long context well. But you can swap to any OpenAI-compatible API.
- How accurate? It retrieves real chunks from real documents. The LLM synthesis can still be wrong — that's why every claim is clickable.

If you try it and hit a bug, open an issue.
```

---

### X Thread

**Tweet 1:**
```
I'm open sourcing Epfiles — a citations-first RAG app for searching 20k+ Epstein documents.

Every answer links to the exact source. No black-box AI.

GitHub: https://github.com/benbaessler/epfiles

Here's what I learned building it 🧵
```

**Tweet 2:**
```
[VIDEO/GIF: 20-30s demo]
```

**Tweet 3:**
```
Stack:
- Next.js 15 (React 19)
- FastAPI backend
- ChromaDB for vectors
- xAI (Grok) for generation
- OpenAI for embeddings

One-command Docker setup included.
```

**Tweet 4:**
```
The key insight: most RAG apps treat citations as metadata.

Epfiles inverts this. Citations are the primary output. LLM synthesis is secondary.

If you can't click to verify, what's the point?
```

**Tweet 5:**
```
What's in the repo:
- Full source (MIT license)
- Pre-built vector DB (auto-downloads)
- 190MB document chunks (separate download)
- Embedding scripts to rebuild with your own model
- Docker Compose for local dev
```

**Tweet 6:**
```
Honest limitations:
- LLM can still hallucinate
- Fixed corpus (House Oversight docs only)
- Requires API keys (OpenAI + xAI)

The citations exist so you can verify fast when it's wrong.
```

**Tweet 7:**
```
If you're building RAG with citations, steal this pattern.

GitHub: https://github.com/benbaessler/epfiles

Issues/PRs welcome.
```

---

### Reddit: r/MachineLearning

**Title:**
```
[P] Open-sourcing a citations-first RAG app — architecture and lessons
```

**Body:**
```
I'm open-sourcing Epfiles, a RAG app I built for searching a 20k+ document corpus.

**Key design decision**: citations-first. Every response chunk links to the source document. The goal is verifiable answers, not black-box synthesis.

**Stack**: Next.js 15 + FastAPI + ChromaDB + xAI (Grok)

**What I learned**:
1. Citation UX matters more than retrieval quality. Users don't trust RAG without clickable sources.
2. Chunking strategy is the biggest lever. I settled on ~500 token chunks with 100 token overlap.
3. Pre-building the vector DB and distributing it separately keeps the repo lightweight.

**What's included**:
- Full source code (MIT)
- Docker Compose setup
- Pre-built ChromaDB (auto-downloads)
- Scripts to regenerate embeddings

GitHub: https://github.com/benbaessler/epfiles

Disclosure: I built this. Happy to discuss architecture decisions.
```

---

### Reddit: r/LocalLLaMA

**Title:**
```
Open-sourced a citations-first RAG app — works with any OpenAI-compatible API
```

**Body:**
```
Open-sourcing Epfiles, a citations-first RAG app. Uses xAI/Grok by default but the backend is OpenAI API-compatible, so you can point it at local models via LM Studio, Ollama, or similar.

**What makes it different**: Every answer has clickable citations to the source document chunks.

**Stack**: Next.js + FastAPI + ChromaDB

**Swapping models**: Set `XAI_BASE_URL` and `XAI_API_KEY` to your local endpoint.

GitHub: https://github.com/benbaessler/epfiles

If anyone gets it running with a local model, I'd love to hear how it performs.
```

---

### Reddit: r/SideProject

**Title:**
```
Open-sourcing my RAG side project after learning distribution is harder than building
```

**Body:**
```
Built Epfiles over the past few months — a citations-first RAG app for searching public documents.

Launched it closed-source 2 weeks ago. Results: 80 X followers, ~6 visitors, 1 signup.

Lesson: without an audience, distribution is nearly impossible.

So I'm open-sourcing it. The code is more useful as a reference implementation than as a closed product I can't distribute.

**What's in the repo**:
- Next.js 15 + FastAPI + ChromaDB
- Full Docker setup
- Pre-built vector database
- MIT license

GitHub: https://github.com/benbaessler/epfiles
```

---

### Email (Personal List)

**Subject:** I open-sourced Epfiles

**Body:**
```
Hey —

Quick update: I'm open-sourcing Epfiles today.

It's a RAG app for searching 20k+ documents with source citations on every answer.

GitHub: https://github.com/benbaessler/epfiles

If you know anyone building RAG systems, feel free to share.

— Ben
```

---

### Email (Outreach)

**Subject:** Open-source tool for searching Epstein files with citations

**Body:**
```
Hi [Name],

I built an open-source tool for searching the U.S. House Oversight Epstein files (20k+ documents).

The key feature: every answer links to the exact source document so you can verify claims directly.

GitHub: https://github.com/benbaessler/epfiles

Happy to give you a walkthrough if helpful.

— Ben
```

---

## 12. Post-Launch

### Week 1

- [ ] Respond to all GitHub issues within 24h
- [ ] Post X updates on interesting issues/PRs
- [ ] Write technical blog post: "How I built citations-first RAG"
- [ ] Submit to awesome-rag, awesome-llm lists
- [ ] Cross-post blog to dev.to / Hashnode
- [ ] Follow up on outreach non-responders (Day 3-4)

### Tracking

| Channel | Link | Engagement | Stars | Notes |
|---------|------|------------|-------|-------|
| HN | | | | |
| X | | | | |
| r/MachineLearning | | | | |
| r/LocalLLaMA | | | | |
| r/SideProject | | | | |
| Email | | | | |

---

## Notes

- The "citations-first" RAG pattern is the main value proposition
- Consider writing a blog post explaining architecture decisions
- ChromaDB download URL points to public R2 bucket (intentional for distribution)
- Monday Dec 29 is between Christmas and New Year — lower traffic but less competition
