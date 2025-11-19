### **Workflow**

*   Track all TODOs and next steps in `@.cursor/log.md`.
*   Structure `@.cursor/log.md` with two sections: `Immediate Tasks` for high-priority items and `Later` for future tasks.
*   Work through the dataset build in a linear, deterministic sequence. No branching, no “optional” steps.

---

### **1. Inventory the sources**

Define exactly which corpora are included.

* House Oversight release: PDFs, images, transcripts.
* Any mirrored sets: DocumentCloud, Pinpoint dumps, GitHub collections.
* Any processed sets: epstein-docs, Sifter Labs, etc.

Outcome: one list of URLs + repo paths you will ingest. No ambiguities.

---

### **2. Acquire the raw documents**

Pull the authoritative sources first.

* Download every PDF, image bundle, or ZIP directly from House Oversight or the verified mirrors.
* Store raw files in a dedicated drive partition (`/raw/`).
* Name files deterministically: `<doc_id>_<page>.pdf` or `<doc_id>.pdf`.

Outcome: complete raw-corpus mirror.

---

### **3. Clone the processed repositories**

Clone any repos that already contain:

* OCR text
* Reconstructed documents
* Entity extractions
* Summaries
* Metadata

Examples you already found:

* `epstein-docs.github.io`
* `paulgp/epstein-document-search`
* `ChrisSc/epstein-files`

Store clones under `/repos/`.

Outcome: you now have reusable intermediate outputs that save time.

---

### **4. Extract text from raw documents**

Process everything locally to avoid depending on third-party extractions.

* Use `pymupdf` or equivalent for PDF text.
* For image-based PDFs: run OCR (`tesseract` or a cloud OCR if needed).
* Save per-page text under `/extracted/<doc_id>/<page>.txt`.

Outcome: guaranteed local text layer independent of upstream repos.

---

### **5. Consolidate metadata**

Build a unified manifest:

* `doc_id`
* `source_url`
* `page_count`
* timestamps
* any tags from repos (people/orgs/locations)

Merge metadata from raw sources + repo outputs into one JSONL file: `/manifest/manifest.jsonl`.

Outcome: single source of truth for document structure.

---

### **6. Normalize and clean the text**

Process each text file:

* remove repeated headers/footers
* fix broken words
* unify encoding
* ensure page references remain intact

Store cleaned text under `/clean/<doc_id>/`.

Outcome: consistent text input for chunking.

---

### **7. Ingest reusable extractions from third-party repos**

From the cloned repos:

* import their OCR text
* import their JSON entity lists
* import their reconstructions of fragmented documents

Map these into your unified manifest structure.

Outcome: augmentation of your own extraction with preexisting work.

---

### **8. Chunk the cleaned text**

Chunk based on:

* paragraph boundaries preferred
* fallback token windows (800–1500 tokens)
* include overlap (100–200 tokens)
* attach metadata: `doc_id`, `page_start`, `page_end`, and source_filename.

Store chunks under `/chunks/`.

Outcome: training-ready segments.

---

### **9. Create the training dataset structures**

Prepare directories:

* `/training/raw_docs/`
* `/training/chunks/`
* `/training/entities/`
* `/training/summaries/`
* `/training/samples/` (for fine-tuning tasks)

Populate with:

* chunked text
* entity extraction outputs from repos
* your cleaned text
* your metadata

Outcome: ready for RAG and fine-tune dataset creation.

---

### **10. Generate fine-tuning samples**

Use the following tasks:

* citation-rich QA pairs
* summarization pairs
* entity-extraction structured outputs
* timeline extractions

Store all pairs as JSONL under `/finetune/`.

Outcome: model-training artifacts.

---

This sequence isolates raw ingestion, processed ingestion, consolidation, and dataset shaping.
