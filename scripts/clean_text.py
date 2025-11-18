import argparse
import concurrent.futures
import logging
import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple


try:  # Optional dependency; keep pipeline usable without it.
    from ftfy import fix_text
except Exception:  # pragma: no cover - best-effort import
    def fix_text(text: str) -> str:
        return text


HEADER_WINDOW_LINES = 5
FOOTER_WINDOW_LINES = 5
HEADER_FOOTER_MIN_RATIO = 0.7


SentenceEndPattern = re.compile(r'[\.?!:;"\']\s*$')
WhitespaceCollapsePattern = re.compile(r'\s+')

HEADER_FOOTER_REGEXES = [
    re.compile(r"^HOUSE OVERSIGHT\s+\d{6}\s*$"),
    re.compile(r"^\d{1,3}\s*$"),
]

NOISE_PATTERNS = [
    re.compile(r"^[•.\s0-9A-Za-z-]*IMF\s*•\s*MIMEO\.*$", re.IGNORECASE),
    re.compile(r"^[•.\s0-9A-Za-z-]*ZUMAPRESS\.com\)?$", re.IGNORECASE),
]

WORDLIKE = re.compile(r"^[A-Za-z]{4,}$")
MAX_JOINED_LINE_LEN = 300


@dataclass
class CleaningStats:
    header_lines_removed: int = 0
    footer_lines_removed: int = 0
    hyphen_joins: int = 0
    line_wrap_joins: int = 0


def iter_limited(items: List[Path], limit: int | None) -> Iterable[Path]:
    if limit is None or limit >= len(items):
        return items
    return items[:limit]


def normalize_line_for_matching(line: str) -> str:
    """Lightly normalize a line for header/footer matching."""
    line = line.strip()
    if not line:
        return ""
    # Normalize unicode and collapse internal whitespace.
    line = unicodedata.normalize("NFC", line)
    line = WhitespaceCollapsePattern.sub(" ", line)
    return line


def is_bullet_line(line: str) -> bool:
    stripped = line.lstrip()
    if not stripped:
        return False

    if stripped.startswith(("- ", "* ")):
        return True

    # Numbered or lettered lists: "1. ", "a) ", etc.
    if re.match(r"^\d+\.\s+", stripped):
        return True
    if re.match(r"^[A-Za-z]\)\s+", stripped):
        return True

    return False


def is_captionish(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if re.search(r"\b(19|20)\d{2}\)?$", s):
        return True
    caps = sum(c.isupper() for c in s)
    caps_ratio = caps / max(1, len(s))
    if caps_ratio > 0.4 and "(" in s and ")" in s:
        return True
    return False


def is_noise_line(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if any(pat.match(s) for pat in NOISE_PATTERNS):
        return True
    if len(s) <= 3 and all(not c.isalpha() for c in s):
        return True
    return False


def detect_headers_footers(
    pages: List[List[str]],
) -> Tuple[Dict[int, str], Dict[int, str]]:
    """Detect repeated header and footer lines across pages.

    Returns:
        (header_candidates, footer_candidates) where each dict maps
        position index (0-based within the window) -> normalized line.
    """
    header_counts: Dict[Tuple[int, str], int] = Counter()
    footer_counts: Dict[Tuple[int, str], int] = Counter()

    for page_lines in pages:
        if not page_lines:
            continue

        header_window = page_lines[:HEADER_WINDOW_LINES]
        footer_window = page_lines[-FOOTER_WINDOW_LINES:]

        for idx, line in enumerate(header_window):
            norm = normalize_line_for_matching(line)
            if norm:
                header_counts[(idx, norm)] += 1

        for idx, line in enumerate(reversed(footer_window)):
            norm = normalize_line_for_matching(line)
            if norm:
                footer_counts[(idx, norm)] += 1

    if not pages:
        return {}, {}

    num_pages = sum(1 for p in pages if p)
    if num_pages == 0:
        return {}, {}

    threshold = max(2, int(num_pages * HEADER_FOOTER_MIN_RATIO))

    header_candidates: Dict[int, str] = {}
    footer_candidates: Dict[int, str] = {}

    for (idx, text), count in header_counts.items():
        if count >= threshold:
            header_candidates[idx] = text

    for (idx, text), count in footer_counts.items():
        if count >= threshold:
            footer_candidates[idx] = text

    return header_candidates, footer_candidates


def strip_headers_footers_from_page(
    lines: List[str],
    header_candidates: Dict[int, str],
    footer_candidates: Dict[int, str],
    stats: CleaningStats,
) -> List[str]:
    if not lines:
        return lines

    # Strip header from the top via cross-page candidates.
    start = 0
    for idx in range(HEADER_WINDOW_LINES):
        if start >= len(lines):
            break
        candidate = header_candidates.get(idx)
        if not candidate:
            continue
        if normalize_line_for_matching(lines[start]) == candidate:
            start += 1
            stats.header_lines_removed += 1

    # Strip footer from the bottom via cross-page candidates.
    end = len(lines)
    for idx in range(FOOTER_WINDOW_LINES):
        if end <= start:
            break
        candidate = footer_candidates.get(idx)
        if not candidate:
            continue
        if normalize_line_for_matching(lines[end - 1]) == candidate:
            end -= 1
            stats.footer_lines_removed += 1

    # Additional regex-based boilerplate trimming at page edges.
    max_extra = 2

    extra_header = 0
    while start < end and extra_header < max_extra:
        line = lines[start]
        if any(pat.match(line.strip()) for pat in HEADER_FOOTER_REGEXES):
            start += 1
            stats.header_lines_removed += 1
            extra_header += 1
        else:
            break

    extra_footer = 0
    while end > start and extra_footer < max_extra:
        line = lines[end - 1]
        if any(pat.match(line.strip()) for pat in HEADER_FOOTER_REGEXES):
            end -= 1
            stats.footer_lines_removed += 1
            extra_footer += 1
        else:
            break

    return lines[start:end]


def normalize_unicode_and_whitespace(line: str) -> str:
    # Apply ftfy and NFC normalization.
    line = fix_text(line)
    line = unicodedata.normalize("NFC", line)

    # Replace non-breaking spaces and similar with regular spaces.
    line = line.replace("\u00A0", " ").replace("\u2007", " ").replace("\u202F", " ")

    # Preserve leading indentation, collapse internal whitespace.
    leading_match = re.match(r"^\s*", line)
    leading = leading_match.group(0) if leading_match else ""
    rest = line[len(leading) :]
    rest = WhitespaceCollapsePattern.sub(" ", rest)

    return (leading + rest).rstrip()


def repair_hyphenation(lines: List[str], stats: CleaningStats) -> List[str]:
    if not lines:
        return lines

    repaired: List[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if i + 1 < len(lines):
            next_line = lines[i + 1]
            stripped = line.rstrip()
            if stripped.endswith("-"):
                next_stripped = next_line.lstrip()
                if next_stripped and next_stripped[0].islower():
                    base = stripped[:-1]
                    merged_token = base + next_stripped
                    if len(base) >= 3 and WORDLIKE.match(merged_token):
                        merged = merged_token
                    else:
                        merged = base + "-" + next_stripped
                    repaired.append(merged)
                    stats.hyphen_joins += 1
                    i += 2
                    continue
        repaired.append(line)
        i += 1

    return repaired


def should_join_lines(prev: str, current: str) -> bool:
    if not prev.strip() or not current.strip():
        return False
    if is_bullet_line(current):
        return False
    if SentenceEndPattern.search(prev):
        return False
    if len(prev) > MAX_JOINED_LINE_LEN:
        return False
    if is_captionish(prev) or is_captionish(current):
        return False
    return True


def repair_line_wraps(lines: List[str], stats: CleaningStats) -> List[str]:
    if not lines:
        return lines

    joined: List[str] = []
    for line in lines:
        if not joined:
            joined.append(line)
            continue

        prev = joined[-1]
        if should_join_lines(prev, line):
            joined[-1] = prev.rstrip() + " " + line.lstrip()
            stats.line_wrap_joins += 1
        else:
            joined.append(line)

    return joined


def clean_page(
    page_lines: List[str],
    header_candidates: Dict[int, str],
    footer_candidates: Dict[int, str],
    stats: CleaningStats,
) -> str:
    lines = [line.rstrip("\n\r") for line in page_lines]

    # 1. Strip repeated headers/footers.
    lines = strip_headers_footers_from_page(lines, header_candidates, footer_candidates, stats)

    # 2. Repair hyphenation.
    lines = repair_hyphenation(lines, stats)

    # 3. Repair line wraps within the page body.
    lines = repair_line_wraps(lines, stats)

    # 4. Normalize unicode and whitespace.
    normalized_lines = [normalize_unicode_and_whitespace(line) for line in lines]

    # 5. Drop known noise lines.
    normalized_lines = [l for l in normalized_lines if not is_noise_line(l)]

    # Preserve explicit blank lines as paragraph separators.
    return "\n".join(normalized_lines).rstrip() + "\n"


def clean_single_doc(doc_dir: Path, out_root: Path) -> CleaningStats:
    pages: List[List[str]] = []

    page_files = sorted(p for p in doc_dir.glob("*.txt") if p.is_file())
    if not page_files:
        raise RuntimeError(f"No .txt pages found under {doc_dir}")

    for page_path in page_files:
        text = page_path.read_text(encoding="utf-8", errors="replace")
        pages.append(text.splitlines())

    header_candidates, footer_candidates = detect_headers_footers(pages)
    stats = CleaningStats()

    out_dir = out_root / doc_dir.name
    out_dir.mkdir(parents=True, exist_ok=True)

    for page_path, page_lines in zip(page_files, pages):
        cleaned = clean_page(page_lines, header_candidates, footer_candidates, stats)
        out_page_path = out_dir / page_path.name
        out_page_path.write_text(cleaned, encoding="utf-8")

    logging.info(
        "Cleaned %s: %d pages, %d header lines removed, %d footer lines removed, "
        "%d hyphen joins, %d line-wrap joins",
        doc_dir.name,
        len(page_files),
        stats.header_lines_removed,
        stats.footer_lines_removed,
        stats.hyphen_joins,
        stats.line_wrap_joins,
    )

    return stats


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Normalize and clean per-page text under extracted/<doc_id>/<page>.txt, "
            "writing cleaned pages to clean/<doc_id>/<page>.txt."
        )
    )
    parser.add_argument(
        "--in-root",
        type=Path,
        default=Path("extracted"),
        help="Root directory containing extracted per-page text (default: extracted).",
    )
    parser.add_argument(
        "--out-root",
        type=Path,
        default=Path("clean"),
        help="Output root for cleaned per-page text (default: clean).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional limit on number of doc_id directories to process.",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=4,
        help="Maximum number of worker threads.",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        help="Logging level (DEBUG, INFO, WARNING, ERROR).",
    )

    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(message)s",
    )

    in_root: Path = args.in_root
    out_root: Path = args.out_root
    out_root.mkdir(parents=True, exist_ok=True)

    doc_dirs = sorted(p for p in in_root.iterdir() if p.is_dir())
    to_process = list(iter_limited(doc_dirs, args.limit))

    if not to_process:
        logging.info("No doc_id directories discovered under %s; nothing to do.", in_root)
        return

    logging.info("Discovered %d doc_id directories to process under %s.", len(to_process), in_root)

    def _worker(doc_dir: Path) -> None:
        try:
            clean_single_doc(doc_dir, out_root)
        except Exception as exc:  # pragma: no cover - best-effort logging
            logging.error("Failed to clean %s: %s", doc_dir, exc)

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.max_workers) as executor:
        list(executor.map(_worker, to_process))


if __name__ == "__main__":
    main()


