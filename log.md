# Immediate Tasks

- **Create primary fine-tuning datasets from `@epstein-docs.github.io`**. Process `analyses.json` for high-quality summarization, QA, and significance-assessment pairs, as this file contains rich, AI-generated analyses for over 8,000 documents. Simultaneously, process `dedupe.json` to create a dataset for entity linking and resolution, leveraging its canonical entity mappings. This repo is the primary source due to its structured, machine-readable format. See `@sources/thirdparty.md:L87-L90` for the recommended approach.
- **Develop a script to create a supplemental classification dataset from `@epstein-files`**. Parse the manually curated Markdown indexes (e.g., `INDEX_LEGAL.md`, `INDEX_TOPICS.md`) to extract document-to-category mappings. This will generate high-quality `(document_text, category_label)` pairs for fine-tuning a document classification model. This is a key augmentation opportunity identified in the source analysis. See `@sources/thirdparty.md:L91-L95` for implementation details.
- **Create an advanced reasoning dataset from `@EpsteinFiles`**. Develop a script to parse the human-written investigative reports (`MASTER_INTEGRATED_REPORT_PHASES_1_2_3.md` and `HIGH_CONFIDENCE_FINDINGS.md`). This script should generate instruction-response pairs for complex, multi-document reasoning, evidence synthesis, and narrative generation. This will train the model on high-level analytical tasks. See `@sources/thirdparty.md:L116-L125` for the recommended approach.

# Later

-
