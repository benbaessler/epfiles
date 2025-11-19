# Chunking Specification

## Source Context

- Step 8 requires paragraph-oriented chunking with 800–1500 token windows, 100–200 token overlaps, and metadata captured for every segment. See @.cursor/instructions.md:L112-L123.
- Clean per-page text lives under `clean/<doc_id>/<page>.txt` and preserves page boundaries plus intra-page blank lines, e.g. @clean/HOUSE_OVERSIGHT_010477/0001.txt:L1-L44.
- Document-level metadata (raw provenance, hashes, counts) comes from `manifest/manifest.jsonl`. See @manifest/manifest.jsonl:L1-L40.

## Tokenizer Contract

1. Prefer `tiktoken`'s `cl100k_base` encoding to count and slice tokens. This matches OpenAI GPT-4/4.1 style tokenization and gives deterministic counts across environments.
2. When the environment cannot download the OpenAI BPE (e.g., fully offline runs), `scripts/chunk_text.py` automatically falls back to a deterministic regex-based tokenizer that preserves whitespace spans so chunk text stays byte-identical. Expect token counts to differ slightly from GPT-* models under this fallback.
3. Token constraints (overridable via CLI flags, defaults shown):
   - `min_tokens`: 800
   - `max_tokens`: 1500
   - `overlap_tokens`: 150
4. When a paragraph exceeds `max_tokens`, it is subdivided into overlapping token windows using the tokenizer’s encode/decode cycle with the same overlap setting (bounded so the overlap never exceeds half the window).

## Paragraph Extraction

1. Read cleaned pages in lexical order (`0001.txt`, `0002.txt`, ...). Each file corresponds to exactly one manifest page index.
2. Split into paragraphs using runs of blank lines (after stripping whitespace) as separators. Preserve within-paragraph line breaks; represent paragraph text as `"\n".join(lines)` to keep original formatting.
3. Track `page_start`/`page_end` metadata on every paragraph. For normal pages, both are the same page number; subdivided windows inherit the original paragraph’s span.
4. Drop paragraphs that are empty after stripping (e.g., entirely blank OCR artifacts) so they do not inflate overlap counts.

## Chunk Assembly Rules

1. Iterate paragraphs sequentially:
   - Append paragraphs until adding the next one would exceed `max_tokens`.
   - If the current chunk already satisfies `min_tokens`, finalize it and start a new chunk seeded with a token overlap pulled from the previous chunk’s tail paragraphs.
   - If the chunk is below `min_tokens`, force-include the next paragraph even if it exceeds `max_tokens`, but only after splitting that paragraph via the tokenizer windowing fallback so the constraint is respected.
2. Overlap handling:
   - After finalizing a chunk, collect tail paragraphs until their combined token count is ≥ `overlap_tokens`.
   - Carry a copy of those tail paragraphs (and their token counts) into the next chunk before appending new paragraphs.
3. Metadata per chunk:
   - `chunk_id`: `<doc_id>_<chunk_index:04d>`
   - `chunk_index`: 1-based integer
   - `doc_id`
   - `page_start`/`page_end`: min/max page numbers represented inside the chunk
   - `token_count`
   - `char_count`
   - `text`: concatenated paragraph text separated by double newlines
   - `raw_path`: inherited from manifest
   - `source_filename`: basename of `raw_path`
   - `chunked_at`: ISO-8601 timestamp recorded at runtime
   - `clean_path`: the relative path to the doc’s cleaned directory (optional but emitted for traceability)

## Validation Expectations

1. Page coverage: confirm that every page listed in manifest has at least one paragraph (after paragraphization) and at least one resulting chunk referencing it through `page_start/page_end`.
2. Bounds: warn (and optionally fail) if any chunk falls outside `[min_tokens, max_tokens]` except the final chunk of a document, which may be shorter.
3. Determinism: the chunker processes documents in lexical `doc_id` order and writes JSONL with the same ordering so repeated runs (with identical inputs and parameters) produce identical files.

## CLI Workflow

`scripts/chunk_text.py` exposes an argparse interface:

```
python -m scripts.chunk_text \
  --manifest manifest/manifest.jsonl \
  --clean-root clean \
  --out-root chunks \
  --doc-id HOUSE_OVERSIGHT_010477 \
  --min-tokens 800 \
  --max-tokens 1500 \
  --overlap-tokens 150 \
  --max-workers 4
```

Flags:

| Flag | Purpose |
| --- | --- |
| `--manifest` | Path to manifest JSONL |
| `--clean-root` | Base directory for cleaned pages |
| `--out-root` | Destination directory for chunk JSONL |
| `--doc-id` | Optional repeatable filter; only chunk matching IDs |
| `--limit` | Optional cap on number of docs processed (post-filter) |
| `--min-tokens`, `--max-tokens`, `--overlap-tokens` | Tunable window sizes |
| `--max-workers` | Concurrency level for per-doc processing |
| `--log-level` | Logging verbosity |
| `--dry-run` | Parse + validate without writing chunk files |

## Outputs

- For each processed document, write `chunks/<doc_id>.jsonl` containing one JSON object per chunk, encoded as UTF-8 with `ensure_ascii=False`.
- CLI emits summary statistics per document (pages, paragraphs, chunks, average tokens) to stdout/logging for traceability.***

