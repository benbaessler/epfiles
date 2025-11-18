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
