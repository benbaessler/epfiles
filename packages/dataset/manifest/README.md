## Manifest Layer

The `manifest` directory stores the **unified document-level manifest** for the Epstein corpus. It consolidates metadata from the per-page extraction layer under `extracted/` and (in later phases) third-party repositories, providing a single, deterministic source of truth for document structure and provenance.

This corresponds to **Step 5 — Consolidate metadata** in the main workflow (`@.cursor/instructions.md:L67-L79`) and the manifest stage described in the project overview (`@.cursor/overview.md:L71-L83`).

### File: `manifest/manifest.jsonl`

- One JSON object **per document** (per `doc_id`)
- UTF-8 encoded, newline-delimited JSON (JSONL)
- Deterministically ordered:
  - documents sorted by `doc_id` (ascending)
  - keys within each object consistently ordered by the writer

The manifest is **derived** from the per-page metadata sidecars described in `@extracted/README.md:L19-L35`.

### Core schema

Each line in `manifest.jsonl` has the following required fields:

- `doc_id` (string)  
  Stable identifier for the document, equal to the normalized base filename from the raw source (see `@extracted/README.md:L14-L18` and `@log.md:L21-L23`).

- `source_url` (string or null)  
  Authoritative download URL for the document, when known. For the November 2025 Google Drive drop this may be `null` initially and filled in later once URL mapping is standardized.

- `page_count` (integer)  
  Number of pages for this `doc_id`, computed as the count of `*.meta.json` files under `/extracted/<doc_id>/`.

- `timestamps` (object)  
  Time-related metadata for this document. At minimum:
  - `extracted_at` (string, ISO-8601): taken from the `created_at` field of the first page’s `.meta.json`.

- `tags` (object)  
  Structured labels for downstream retrieval and training. For now, this is initialized as empty arrays:
  - `people` (array of strings)
  - `orgs` (array of strings)
  - `locations` (array of strings)

In addition, the manifest includes the following provenance fields, copied from the first page’s metadata (`/extracted/<doc_id>/0001.meta.json`):

- `raw_path` (string) — original raw file path, e.g. `raw/IMAGES/001/003/HOUSE_OVERSIGHT_015803.jpg`
- `source_type` (string) — one of `"text"`, `"image"`, `"pdf"`
- `extraction_method` (string) — one of `"direct"`, `"ocr"`, `"pdf-text"`, `"pdf-ocr"`
- `hash_raw` (string) — SHA-256 hash of the raw file
- `hash_text` (string) — SHA-256 hash of the concatenated text on the first page
- `pipeline_version` (string) — current extraction pipeline version (e.g. `"v1"`)

These provenance fields keep the document-level manifest tightly aligned with the per-page schema documented in `@extracted/README.md:L19-L35`.

### Example record

An example entry for `doc_id = "HOUSE_OVERSIGHT_015803"` might look like this:

```json
{
  "doc_id": "HOUSE_OVERSIGHT_015803",
  "source_url": null,
  "page_count": 1,
  "timestamps": {
    "extracted_at": "2025-11-18T06:33:51.610740+00:00"
  },
  "tags": {
    "people": [],
    "orgs": [],
    "locations": []
  },
  "raw_path": "raw/IMAGES/001/003/HOUSE_OVERSIGHT_015803.jpg",
  "source_type": "image",
  "extraction_method": "ocr",
  "hash_raw": "ff0dc6c16b77942035292dd0e9ad9f0047a6c9741db2378e21895710192eaeb3",
  "hash_text": "a6d64654993a287fd9e292dc150660603de3925d3405103a8c8ebb8adb5bfcad",
  "pipeline_version": "v1"
}
```

### Generation strategy

The manifest is built **from the `extracted` layer**, never from third-party text directly:

- Walk `extracted/` and treat each immediate subdirectory name as a `doc_id`.
- For each `doc_id`, read all `*.meta.json` files underneath it.
- Derive `page_count` from the number of metadata sidecars.
- Use the **first page’s** metadata as the document-level source of:
  - `raw_path`
  - `source_type`
  - `extraction_method`
  - `hash_raw`
  - `hash_text`
  - `pipeline_version`
  - `created_at` → mapped to `timestamps.extracted_at`
- Initialize `tags` with empty arrays, to be enriched later from third-party indexes (see `repos/` and `thirdparty/`).

### Future enrichment

Later phases will augment the manifest using:

- Indexes and entity lists from `repos/epstein-files` (e.g. `INDEX_PEOPLE.md`, `INDEX_LOCATIONS.md`, `INDEX_TOPICS.md`).
- Structured extractions from `epstein-docs.github.io`, `epstein-files-ai`, and related projects in `repos/` and `thirdparty/`.

That enrichment will **only add or update `tags` and optional auxiliary fields**, without changing the core schema defined above. This keeps `/manifest/manifest.jsonl` stable for downstream RAG and training pipelines even as new metadata sources are integrated.


