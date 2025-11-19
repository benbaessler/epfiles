from __future__ import annotations

import argparse
import concurrent.futures
import json
import logging
import re
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Iterator, List, Sequence


@dataclass
class ChunkConfig:
    min_tokens: int = 800
    max_tokens: int = 1500
    overlap_tokens: int = 150
    encoding_name: str = "cl100k_base"


@dataclass
class Paragraph:
    text: str
    page_start: int
    page_end: int


@dataclass
class ParagraphUnit:
    paragraph: Paragraph
    token_count: int


@dataclass
class ChunkStats:
    doc_id: str
    pages: int
    paragraphs: int
    chunks: int
    avg_tokens: float
    skipped_pages: List[int]


class Tokenizer:
    def __init__(self, encoding_name: str) -> None:
        self._encoding = None
        self._encoding_name = encoding_name
        self._regex = re.compile(r"\s+|\S+\s*")
        try:
            import tiktoken  # type: ignore
            self._encoding = tiktoken.get_encoding(encoding_name)
            logging.info("Using tiktoken encoding %s.", encoding_name)
        except Exception as exc:  # pragma: no cover - fallback path
            logging.warning(
                "Falling back to regex-based tokenizer because %s. "
                "Token counts may differ slightly from OpenAI models.",
                exc,
            )
            self._encoding = None

    def encode(self, text: str) -> List[int] | List[str]:
        if self._encoding is not None:
            return self._encoding.encode(text, disallowed_special=())
        return self._regex_encode(text)

    def _regex_encode(self, text: str) -> List[str]:
        tokens: List[str] = []
        idx = 0
        while idx < len(text):
            match = self._regex.match(text, idx)
            if match:
                tokens.append(match.group(0))
                idx = match.end()
            else:
                tokens.append(text[idx])
                idx += 1
        return tokens

    def decode(self, tokens: Sequence[int] | Sequence[str]) -> str:
        if self._encoding is not None:
            return self._encoding.decode(tokens)  # type: ignore[arg-type]
        return "".join(tokens)  # type: ignore[arg-type]

    def count(self, text: str) -> int:
        return len(self.encode(text))


def iter_manifest(
    manifest_path: Path, selected_ids: set[str] | None, limit: int | None
) -> Iterator[dict]:
    count = 0
    with manifest_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            if selected_ids and record["doc_id"] not in selected_ids:
                continue
            yield record
            count += 1
            if limit is not None and count >= limit:
                break


def list_page_files(clean_dir: Path) -> List[Path]:
    if not clean_dir.exists():
        raise FileNotFoundError(f"Missing cleaned directory: {clean_dir}")
    txt_files = sorted(p for p in clean_dir.iterdir() if p.is_file() and p.suffix == ".txt")
    if not txt_files:
        raise RuntimeError(f"No cleaned pages found under {clean_dir}")
    return txt_files


def load_page_paragraphs(path: Path, page_number: int) -> List[Paragraph]:
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    paragraphs: List[Paragraph] = []
    current: List[str] = []
    for raw_line in lines:
        if raw_line.strip():
            current.append(raw_line.rstrip())
        else:
            if current:
                paragraph_text = "\n".join(current).strip("\n")
                if paragraph_text:
                    paragraphs.append(Paragraph(paragraph_text, page_number, page_number))
                current = []
    if current:
        paragraph_text = "\n".join(current).strip("\n")
        if paragraph_text:
            paragraphs.append(Paragraph(paragraph_text, page_number, page_number))
    return paragraphs


def split_long_paragraph(
    paragraph: Paragraph, tokenizer: Tokenizer, config: ChunkConfig
) -> List[ParagraphUnit]:
    tokens = tokenizer.encode(paragraph.text)
    total = len(tokens)
    overlap = min(config.overlap_tokens, max(1, config.max_tokens // 2))
    start = 0
    units: List[ParagraphUnit] = []
    while start < total:
        end = min(start + config.max_tokens, total)
        window_tokens = tokens[start:end]
        window_text = tokenizer.decode(window_tokens).strip("\n")
        if window_text:
            units.append(
                ParagraphUnit(
                    Paragraph(window_text, paragraph.page_start, paragraph.page_end),
                    len(window_tokens),
                )
            )
        if end >= total:
            break
        start = max(end - overlap, start + 1)
    return units


def build_paragraph_units(
    paragraphs: List[Paragraph], tokenizer: Tokenizer, config: ChunkConfig
) -> List[ParagraphUnit]:
    units: List[ParagraphUnit] = []
    for para in paragraphs:
        token_count = tokenizer.count(para.text)
        if token_count == 0:
            continue
        if token_count > config.max_tokens:
            units.extend(split_long_paragraph(para, tokenizer, config))
        else:
            units.append(ParagraphUnit(para, token_count))
    return units


def collect_overlap_tail(units: List[ParagraphUnit], target_tokens: int) -> List[ParagraphUnit]:
    if target_tokens <= 0:
        return []
    total = 0
    window: deque[ParagraphUnit] = deque()
    for unit in reversed(units):
        window.appendleft(unit)
        total += unit.token_count
        if total >= target_tokens:
            break
    return list(window)


def finalize_chunk(
    doc_id: str,
    chunk_index: int,
    units: List[ParagraphUnit],
    raw_path: str,
    clean_path: str,
    carry_overlap: bool,
    config: ChunkConfig,
) -> tuple[dict, List[ParagraphUnit]]:
    if not units:
        raise RuntimeError("Attempted to finalize an empty chunk.")
    text = "\n\n".join(unit.paragraph.text for unit in units).strip()
    token_count = sum(unit.token_count for unit in units)
    char_count = len(text)
    page_start = min(unit.paragraph.page_start for unit in units)
    page_end = max(unit.paragraph.page_end for unit in units)
    chunk_id = f"{doc_id}_{chunk_index:04d}"
    chunked_at = datetime.now(timezone.utc).isoformat()
    chunk_record = {
        "chunk_id": chunk_id,
        "chunk_index": chunk_index,
        "doc_id": doc_id,
        "page_start": page_start,
        "page_end": page_end,
        "token_count": token_count,
        "char_count": char_count,
        "source_filename": Path(raw_path).name,
        "raw_path": raw_path,
        "clean_path": clean_path,
        "chunked_at": chunked_at,
        "text": text,
    }

    if carry_overlap and token_count < config.min_tokens:
        logging.warning(
            "Chunk %s ended below min_tokens (%d < %d). Consider lowering --min-tokens.",
            chunk_id,
            token_count,
            config.min_tokens,
        )

    overlap_units = collect_overlap_tail(units, config.overlap_tokens) if carry_overlap else []
    return chunk_record, overlap_units


def chunk_document(
    record: dict,
    clean_root: Path,
    out_root: Path,
    tokenizer: Tokenizer,
    config: ChunkConfig,
    dry_run: bool,
) -> ChunkStats:
    doc_id = record["doc_id"]
    clean_rel = record.get("clean_path")
    clean_path_metadata = str(clean_rel or f"clean/{doc_id}")
    if clean_rel:
        clean_rel_path = Path(clean_rel)
    else:
        clean_rel_path = None

    if clean_rel_path and clean_rel_path.is_absolute():
        clean_dir = clean_rel_path
    else:
        clean_subdir = clean_rel_path.name if clean_rel_path else doc_id
        clean_dir = (clean_root / clean_subdir).resolve()

    page_files = list_page_files(clean_dir)
    expected_pages = record.get("page_count")
    if expected_pages is not None and expected_pages != len(page_files):
        logging.warning(
            "Manifest page_count mismatch for %s: manifest=%s actual=%s",
            doc_id,
            expected_pages,
            len(page_files),
        )

    paragraphs: List[Paragraph] = []
    pages_with_text: set[int] = set()
    pages_without_text: List[int] = []
    for page_path in page_files:
        try:
            page_number = int(page_path.stem)
        except ValueError as exc:
            raise RuntimeError(f"Unexpected page filename {page_path.name}") from exc
        page_paragraphs = load_page_paragraphs(page_path, page_number)
        if page_paragraphs:
            pages_with_text.add(page_number)
            paragraphs.extend(page_paragraphs)
        else:
            pages_without_text.append(page_number)

    units = build_paragraph_units(paragraphs, tokenizer, config)
    if not units:
        raise RuntimeError(f"No non-empty paragraphs found for {doc_id}")

    chunk_records: List[dict] = []
    current_units: List[ParagraphUnit] = []
    current_tokens = 0
    chunk_index = 1

    for unit in units:
        while current_units and current_tokens + unit.token_count > config.max_tokens:
            chunk_record, overlap_units = finalize_chunk(
                doc_id,
                chunk_index,
                current_units,
                record["raw_path"],
                clean_path_metadata,
                carry_overlap=True,
                config=config,
            )
            chunk_records.append(chunk_record)
            chunk_index += 1
            current_units = overlap_units.copy()
            current_tokens = sum(item.token_count for item in current_units)
            if current_tokens >= config.max_tokens:
                # Safety: prevent infinite loop if overlap is already too large.
                current_units = []
                current_tokens = 0
        current_units.append(unit)
        current_tokens += unit.token_count

    if current_units:
        chunk_record, _ = finalize_chunk(
            doc_id,
            chunk_index,
            current_units,
            record["raw_path"],
            clean_path_metadata,
            carry_overlap=False,
            config=config,
        )
        chunk_records.append(chunk_record)

    chunk_tokens = [chunk["token_count"] for chunk in chunk_records]
    avg_tokens = sum(chunk_tokens) / len(chunk_tokens)

    out_path = out_root / f"{doc_id}.jsonl"
    out_root.mkdir(parents=True, exist_ok=True)
    if not dry_run:
        with out_path.open("w", encoding="utf-8") as handle:
            for record_line in chunk_records:
                handle.write(json.dumps(record_line, ensure_ascii=False))
                handle.write("\n")

    pages_covered = set()
    for chunk in chunk_records:
        pages_covered.update(range(chunk["page_start"], chunk["page_end"] + 1))
    missing_pages = sorted(pages_with_text.difference(pages_covered))
    if missing_pages:
        raise RuntimeError(f"Chunks for {doc_id} missed pages: {missing_pages}")

    skipped_pages = sorted(pages_without_text)
    if skipped_pages:
        logging.info("Doc %s had %d blank pages: %s", doc_id, len(skipped_pages), skipped_pages)

    logging.info(
        "Chunked %s: %d pages, %d paragraphs, %d chunks (avg %.1f tokens)",
        doc_id,
        len(page_files),
        len(paragraphs),
        len(chunk_records),
        avg_tokens,
    )

    return ChunkStats(
        doc_id=doc_id,
        pages=len(page_files),
        paragraphs=len(paragraphs),
        chunks=len(chunk_records),
        avg_tokens=avg_tokens,
        skipped_pages=skipped_pages,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Chunk cleaned per-page text into metadata-rich JSONL segments."
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("manifest/manifest.jsonl"),
        help="Path to manifest JSONL (default: manifest/manifest.jsonl).",
    )
    parser.add_argument(
        "--clean-root",
        type=Path,
        default=Path("clean"),
        help="Root directory containing cleaned text (default: clean).",
    )
    parser.add_argument(
        "--out-root",
        type=Path,
        default=Path("chunks"),
        help="Output directory for chunk JSONL files (default: chunks).",
    )
    parser.add_argument(
        "--doc-id",
        action="append",
        dest="doc_ids",
        help="Restrict processing to the specified doc_id. Repeatable.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Process at most this many documents (after filtering).",
    )
    parser.add_argument(
        "--min-tokens",
        type=int,
        default=800,
        help="Minimum desired tokens per chunk (default: 800).",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=1500,
        help="Maximum tokens per chunk (default: 1500).",
    )
    parser.add_argument(
        "--overlap-tokens",
        type=int,
        default=150,
        help="Token overlap between chunks (default: 150).",
    )
    parser.add_argument(
        "--encoding",
        type=str,
        default="cl100k_base",
        help="tiktoken encoding name (default: cl100k_base).",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=4,
        help="Maximum worker threads (default: 4).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Execute chunking logic without writing output files.",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        help="Logging level (DEBUG, INFO, WARNING, ERROR).",
    )
    return parser.parse_args()


def setup_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(message)s",
    )


def main() -> None:
    args = parse_args()
    setup_logging(args.log_level)

    config = ChunkConfig(
        min_tokens=args.min_tokens,
        max_tokens=args.max_tokens,
        overlap_tokens=args.overlap_tokens,
        encoding_name=args.encoding,
    )

    tokenizer = Tokenizer(config.encoding_name)
    selected_ids = set(args.doc_ids) if args.doc_ids else None
    manifest_entries = list(iter_manifest(args.manifest, selected_ids, args.limit))

    if not manifest_entries:
        logging.info("No manifest entries matched the filters. Nothing to do.")
        return

    logging.info("Discovered %d documents to chunk.", len(manifest_entries))

    out_root: Path = args.out_root.resolve()
    clean_root: Path = args.clean_root.resolve()

    stats: List[ChunkStats] = []

    def _worker(entry: dict) -> ChunkStats:
        return chunk_document(entry, clean_root, out_root, tokenizer, config, args.dry_run)

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.max_workers) as executor:
        for result in executor.map(_worker, manifest_entries):
            stats.append(result)

    total_chunks = sum(item.chunks for item in stats)
    logging.info("Finished chunking %d docs producing %d chunks.", len(stats), total_chunks)


if __name__ == "__main__":
    main()

