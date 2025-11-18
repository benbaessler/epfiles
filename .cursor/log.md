# Immediate Tasks

- **Normalize and clean the text**. Normalize and clean the extracted text files to ensure consistency for downstream tasks. This process involves removing repeated headers/footers, fixing broken words from extraction, unifying character encoding, and preserving page references. Store the cleaned text files under `/clean/<doc_id>/`. This step is critical for creating high-quality, consistent input for the chunking process. See `@.cursor/instructions.md:L83-L96`.

- **Refine text cleaning heuristics**. Tighten the `clean_text` pipeline so it better strips House Oversight boilerplate while avoiding run-on paragraphs. This includes adding regex-based header/footer trimming for `HOUSE OVERSIGHT <id>` and bare page numbers, conservative hyphenation repair that preserves hyphens when merged tokens are not word-like, caption-aware and length-capped line joining, and pattern-based noise removal for recurring scanner artifacts. These changes are implemented in `@scripts/clean_text.py:L19-L253` and preserve the invariant that `/clean/<doc_id>/<page>.txt` remains a 1:1, page-aligned mirror of `/extracted/<doc_id>/<page>.txt` with improved readability for chunking.

# Later

[ Category: training the model]

- **Create primary fine-tuning datasets from `@epstein-docs.github.io`**. Process `analyses.json` for high-quality summarization, QA, and significance-assessment pairs, as this file contains rich, AI-generated analyses for over 8,000 documents. Simultaneously, process `dedupe.json` to create a dataset for entity linking and resolution, leveraging its canonical entity mappings. This repo is the primary source due to its structured, machine-readable format. See `@sources/thirdparty.md:L87-L90` for the recommended approach.

- **Develop a script to create a supplemental classification dataset from `@epstein-files`**. Parse the manually curated Markdown indexes (e.g., `INDEX_LEGAL.md`, `INDEX_TOPICS.md`) to extract document-to-category mappings. This will generate high-quality `(document_text, category_label)` pairs for fine-tuning a document classification model. This is a key augmentation opportunity identified in the source analysis. See `@sources/thirdparty.md:L91-L95` for implementation details.

- **Create an advanced reasoning dataset from `@EpsteinFiles`**. Develop a script to parse the human-written investigative reports (`MASTER_INTEGRATED_REPORT_PHASES_1_2_3.md` and `HIGH_CONFIDENCE_FINDINGS.md`). This script should generate instruction-response pairs for complex, multi-document reasoning, evidence synthesis, and narrative generation. This will train the model on high-level analytical tasks. See `@sources/thirdparty.md:L116-L125` for the recommended approach.

- **Generate and process data from `@epstein-files-analysis`**. First, run the `analyze.py` script from the repository to generate the `analytics.json` file. Then, create a new script to parse this file to create two distinct fine-tuning datasets: one for topic modeling and another for relationship extraction. This leverages the unique NLP pipeline of this repository. See `@sources/thirdparty.md:L142-L146` for details.

- **Build and export the knowledge graph from `@epstein-files-ai`**. Set up a Neo4j instance, run the 12 import scripts from the repository to build the full knowledge graph using the data from `@epstein-network-data`. Then, develop a script to export the graph data (nodes and typed relationships) into a format suitable for creating a fine-tuning dataset for graph-based reasoning and Text-to-Cypher tasks. See `@sources/thirdparty.md:L157-L162` for details.

- **Create an evidence extraction dataset from `@erikveland/epstein-archive`**. Process the `evidence_database.json` file to create `(claim, evidence_snippet)` pairs for training the model on claim verification and evidence extraction tasks. See `@sources/thirdparty.md` for details.

- **Create a temporal graph dataset from `@kev-hu/epstein-emails`**. Set up the environment and run the Graphiti pipeline to build the temporal email knowledge graph. Develop a script to export `(email_thread -> structured_temporal_graph)` data for fine-tuning the model on conversational context. See `@sources/thirdparty.md` for details.