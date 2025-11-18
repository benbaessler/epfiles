# Project Overview

This repository defines the complete **dataset layer** for a project whose end-goal is to build a **domain-specialized, fine-tuned LLM** capable of working with the publicly released **Jeffrey Epstein document corpus**. This includes all material released by the U.S. House Committee on Oversight and Government Reform and any verified mirrors. The dataset produced here will be used for:

* Retrieval-augmented generation (RAG)
* Structured extraction tasks
* Citation-enforced question answering
* Fine-tuning of a base model using LoRA/QLoRA

This repo contains the canonical data pipeline. Nothing above this layer (vector DB, UI, RAG endpoints, model training code) belongs here.

---

## 1. Objectives

### Primary Objective

Create a **fully self-contained, machine-readable corpus** of the Epstein files suitable for RAG and fine-tuning.

### Secondary Objectives

* Guarantee **reproducibility** of every data stage.
* Maintain **page-level provenance** for every text segment.
* Integrate **third-party processed outputs** without trusting them blindly.
* Produce stable, structured artifacts for downstream model training.

---

## 2. Data Sources Ingested

### 2.1 Authoritative Sources

These are downloaded in raw form and always preferred:

* House Committee (Oversight) PDF releases
* Document bundles, exhibits, letters, DOJ materials, interview summaries

Stored under:
`/raw/`

### 2.2 Verified Mirrors

These may contain copies or alternative formats:

* DocumentCloud uploads
* Pinpoint collections
* Other publicly mirrored collections

Stored under:
`/mirrors/`

### 2.3 Third-Party Repositories

Useful for saving time on OCR, reconstruction, entity extraction:

* `epstein-docs.github.io`
* `paulgp/epstein-document-search`
* `ChrisSc/epstein-files`

Cloned to:
`/repos/`

These are treated as *input signals*, not authoritative truth.

---

## 3. Data Pipeline Stages

Each stage has its own directory. The entire pipeline is deterministic.

### 3.1 Manifest Construction

Path: `/manifest/`

Content:

* Master JSONL file enumerating every document
* Fields: `doc_id`, `source_url`, `file_type`, `page_count`, `tags`
* Links to all derived artifacts created later

Purpose:
Provide a single source of truth for the entire dataset.

---

### 3.2 Raw File Acquisition

Path: `/raw/`

Process:

* Download every PDF, ZIP, image bundle
* Preserve filenames exactly
* No transformations, no unpacking unless required

Purpose:
Immutable foundational layer.

---

### 3.3 Text Extraction

Path: `/extracted/`

Process:

* PDF parsing via `pymupdf`
* OCR for image-based pages (Tesseract or equivalent)
* Output one text file per page
* Store metadata: page number, original filename, hash

Purpose:
Guarantee full local text availability independent of external tools.

---

### 3.4 Text Normalization

Path: `/clean/`

Process:

* Remove scanner headers/footers
* Fix encoding issues
* Maintain page boundaries
* Standardize whitespace and linebreaks

Purpose:
Create stable, high-quality text for chunk generation.

---

### 3.5 Chunking

Path: `/chunks/`

Process:

* Split each document into semantic chunks
* Target length: 800–1500 tokens
* Overlap: 100–200 tokens
* Each chunk labeled with:

  * `chunk_id`
  * `doc_id`
  * `page_start` / `page_end`
  * text content
  * provenance fields

Purpose:
Feed the retrieval layer and training dataset with structured, referential segments.

---

### 3.6 Third-Party Data Integration

Path: `/thirdparty/`

Contains imported supplemental outputs:

* OCR text
* Entity lists (people, orgs, locations)
* Summaries
* Reconstructed multi-page docs

These are standardized into the manifest and reconciled with local extracted text.

Purpose:
Leverage community processing without relying on it exclusively.

---

### 3.7 Training Dataset Assembly

Path: `/training/`

Contains structures needed for model training:

* `/training/chunks/` – cleaned chunked text
* `/training/entities/` – entity metadata for extraction tasks
* `/training/summaries/` – summaries used for supervised fine-tuning
* `/training/pairs/` – all instruction-response fine-tuning files

Purpose:
Provide clean, isolated data for training pipelines.

---

## 4. Downstream Usage

This dataset repo feeds the next layers:

### RAG Layer

* Vectorization of `/chunks/`
* Indexing using pgvector/Qdrant
* Retrieval for `/answer` API

### Fine-Tuning Layer

* LoRA on:

  * citation-format QA
  * timeline extraction
  * entity extraction
  * neutral summarization

### UI Layer (Separate Repo)

* Search pages
* Chat interface with source linking
* Document viewer

None of this happens inside the dataset repo. This repo only produces the structured data required.

---

## 5. Reproducibility

Every stage is:

* deterministic
* hierarchical (no cross-contamination)
* rebuildable by running the pipeline scripts in order

Hashes of raw files and extracted texts are stored for validation.

---

## 6. Summary

This repository defines the scoped, clean, reproducible dataset required to build a fine-tuned LLM capable of working with the Epstein document corpus. It ingests raw documents, normalized text, derived entities, and custom chunks, producing a complete and provenance-preserving dataset for retrieval and model training.

## 7. Documentation Phase Complete

- [x] Project overview and objectives documented
- [x] Data sources and pipeline stages defined
- [x] Reproducibility and provenance requirements established
- [x] Downstream usage patterns for RAG and fine-tuning outlined
- [x] Ready for implementation of data processing pipeline

# Notes

- **Text extraction `doc_id` convention**. For raw House Oversight materials acquired in November 2025 (`@raw/README.md:L3-L24`), each processed document in the `/extracted` stage will use the normalized base filename (without extension) as its stable `doc_id`. For example, `raw/TEXT/002/HOUSE_OVERSIGHT_033599.txt` maps to `doc_id = HOUSE_OVERSIGHT_033599` and will produce `/extracted/HOUSE_OVERSIGHT_033599/0001.txt`, while `raw/IMAGES/001/004/HOUSE_OVERSIGHT_018227.jpg` maps to `doc_id = HOUSE_OVERSIGHT_018227` and will produce `/extracted/HOUSE_OVERSIGHT_018227/0001.txt`. This keeps `doc_id` aligned with the official House Oversight numbering while remaining deterministic and reconstructible from the raw paths.

- **Scope of initial extraction pass**. The extraction pipeline in this phase targets the House Oversight TXT and image pages as the canonical text layer for the November 2025 release. Structured NATIVES (e.g. Excel and video files under `@raw/NATIVES/001/`) are acknowledged but excluded from text extraction for now; they will be handled separately in the metadata/manifest and downstream structured-data tasks. This separation keeps the `/extracted` stage focused on page-like text sources while preserving room for richer handling of non-page-native content later.

- **Extracted layout and metadata schema**. The `/extracted` directory is standardized as `/extracted/<doc_id>/<page>.txt` with 1-based, zero-padded page indices (e.g. `0001.txt`), plus per-page JSON sidecars at `/extracted/<doc_id>/<page>.meta.json`. Each metadata file records `doc_id`, `page`, `raw_path`, `source_type` (`text`/`image`/`pdf`), `extraction_method` (e.g. `direct`, `ocr`, `pdf-text`), `hash_raw`, `hash_text`, `pipeline_version`, and `created_at`. See `@extracted/README.md:L1-L35` for the precise schema used by downstream cleaning and chunking stages.

- **Extraction pipeline status (November 2025 sandbox)**. The Python extraction core and CLI (`@scripts/extract_text_core.py:L1-L190`, `@scripts/extract_text.py:L1-L72`) are implemented and wired to process TXT, image, and future PDF inputs into the `/extracted` layout. A sandboxed test run (`python -m scripts.extract_text --raw-root raw --out-root extracted --limit 3`) failed due to `python` not being available in the current environment, so no files have actually been written under `/extracted` yet. Once a Python runtime plus dependencies (`pymupdf`, `pytesseract`, `Pillow`) are installed, rerun the command to populate `/extracted` for real corpus work.

- **Text cleaning heuristics and layout invariants**. The text normalization stage is implemented as a deterministic CLI (`@scripts/clean_text.py:L1-L260`) that operates on `/extracted/<doc_id>/<page>.txt` and writes `/clean/<doc_id>/<page>.txt`. It combines cross-page header/footer detection with regex-based trimming of House Oversight page markers, conservative hyphenation repair, caption-aware line joining with a maximum line length cap, and pattern-based noise removal. This keeps boilerplate and OCR artifacts out of the cleaned corpus while preserving page boundaries and paragraph structure for downstream chunking. See `@scripts/clean_text.py:L19-L253` for the exact heuristics applied.