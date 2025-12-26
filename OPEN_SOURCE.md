# Open Source Checklist

Checklist for open sourcing Epfiles (epfiles.ai).

---

## 1. Repository Setup

- [x] Choose license (recommend MIT or Apache 2.0)
- [x] Create LICENSE file
- [x] Rename project (consider generic name like `rag-citations` or `docquery`)
- [x] Create new public GitHub repository
- [x] Transfer or push cleaned code to new repo

---

## 2. Secrets & Security Audit

### Critical: Check for leaked secrets
- [x] Audit git history for any committed API keys — ✅ Clean, no API keys found in history (both backend & interface)
- [x] Check `.env` files are not committed — ✅ `.env` is gitignored and not tracked (both backend & interface)
- [x] Verify `service_account.json` is gitignored and not in history — ✅ Never committed
- [x] Remove any hardcoded URLs pointing to production (epfiles.ai, etc.) — ✅ No production URLs in `rag-backend/`

### Environment files
- [x] Create/update `rag-backend/.env.example` with all required variables — ✅ Created with full documentation
- [x] Create/update `interface/.env.example` with all required variables — ✅ BACKEND_URL and Clerk keys
- [x] Document which API keys are required vs optional — ✅ Documented in `.env.example`

---

## 3. Remove Commercial/Proprietary Elements

### Payment integration
- [x] Remove Clerk billing — ✅ Removed PricingTable, billing page, subscription tier logic (kept basic auth)
- [x] Remove subscription tiers entirely — ✅ Removed tier checking from API routes and components
- [x] Remove hardcoded pricing from frontend — ✅ Deleted /billing page

Note: Clerk authentication (sign in/sign up) is retained for user accounts.

---

## 4. Documentation

### Root README.md (rewrite completely)
- [ ] Project description
- [ ] Features list
- [ ] Architecture diagram
- [ ] Quick start guide
- [ ] Requirements (Python, Node, API keys)
- [ ] Links to detailed docs

### Setup documentation
- [ ] `docs/SETUP.md` - detailed installation instructions
- [ ] `docs/DEPLOYMENT.md` - local deployment guide
- [ ] `docs/CONFIGURATION.md` - all environment variables explained

---

## 5. Code Cleanup

### Backend (`backend/`)
- [x] Remove hardcoded tier limits (move to config)
- [x] Ensure all settings come from environment/config
- [x] Remove unused code/comments

### Frontend (`interface/`)
- [ ] Allow xAI API key user input for using model (will be passed to API)
- [ ] Clean up any TODO comments

### Dataset scripts (`dataset/`)
- [x] Remove dataset repo entirely (keep locally) — ✅ Removed from monorepo

---

## 8. CI/CD

- [ ] GitHub Actions workflow for backend tests
- [ ] GitHub Actions workflow for frontend tests/lint
- [ ] GitHub Actions workflow for type checking

---

## 9. Data Handling

### ChromaDB
- [ ] Document how to create ChromaDB from scratch
- [ ] Provide migration/seeding scripts

---

## 10. Final Checks

- [ ] Run full test suite
- [ ] Test fresh clone + setup on clean machine
- [ ] Verify all environment variables are documented
- [ ] Check no production URLs remain
- [ ] Verify git history is clean (or use `git filter-branch` / BFG if needed)
- [ ] Write release notes / announcement post

---

## 11. Launch

- [ ] Push to public GitHub
- [ ] Add topics/tags (rag, llm, citations, document-search, etc.)
- [ ] Post to Hacker News (Show HN)
- [ ] Post to r/MachineLearning, r/LocalLLaMA
- [ ] Tweet announcement
- [ ] Consider adding to Awesome lists (awesome-rag, awesome-llm, etc.)

---

## Recommended Project Structure (Post-Cleanup)

```
rag-citations/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── docker-compose.yml
├── .github/
│   ├── workflows/
│   │   ├── backend-tests.yml
│   │   └── frontend-tests.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   ├── CONFIGURATION.md
│   └── CORPUS.md
├── backend/
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.example
└── scripts/
    ├── prepare_corpus.py
    ├── embed_documents.py
    └── README.md
```

---

## Notes

- The "citations-first" RAG pattern is the main value proposition for open source
- Consider writing a blog post explaining the architecture decisions

---

*Created: December 2024*
