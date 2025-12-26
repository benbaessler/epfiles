# RAG Database Expansion Plan

## Current State

- **22,000+ emails** from November 2025 DOJ release (indexed)

## Pending Additions

### 1. House Oversight Committee Release (Sep 2, 2025)

- **Source:** [House Oversight Committee](https://oversight.house.gov/release/oversight-committee-releases-epstein-records-provided-by-the-department-of-justice/)
- **Volume:** 33,295 pages
- **Content:** Epstein-related records from DOJ subpoena (issued Aug 5, 2025)
- **Notes:** Victim identities and CSAM redacted
- **Status:** ⏳ Pending

#### Download Links

- Primary: [Epstein Documents](https://oversight.house.gov/epstein-documents/) (referenced in press release)
- Backup: Listed on release page

#### Processing Steps

1. Download full document set
2. Extract text (OCR if needed for scanned pages)
3. Chunk into semantic segments (800-1500 tokens, 100-200 token overlap)
4. Convert to JSONL format matching the chunk schema
5. Embed and index into ChromaDB

---

## Future Releases to Consider

| Date | Source | Volume | Priority |
|------|--------|--------|----------|
| Feb 27, 2025 | DOJ (AG Bondi) | Flight logs, contact book, masseuse list | Medium |
| Aug 22, 2025 | DOJ | Maxwell interview transcript + audio | Medium |
| Dec 12, 2025 | House Oversight (Dems) | Photos from estate | Low (images) |
| Dec 18, 2025 | House Oversight | 68 photos | Low (images) |
| Dec 19, 2025 | DOJ | Hundreds of thousands of pages (heavily redacted) | High |
| Dec 20, 2025 | DOJ | Grand jury materials, flight logs, FBI slides | High |

---

## Notes

- Prioritize text-heavy releases for RAG (emails, transcripts, documents)
- Photos require separate handling (image captioning, metadata extraction)
- Track redaction density—heavily redacted pages may have low information value
