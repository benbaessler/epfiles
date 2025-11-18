import argparse
import concurrent.futures
from pathlib import Path
from typing import Iterable

from .extract_text_core import (
    discover_raw_files,
    extract_single,
)


def iter_limited(items: list[Path], limit: int | None) -> Iterable[Path]:
    if limit is None or limit >= len(items):
        return items
    return items[:limit]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract per-page text from raw House Oversight materials."
    )
    parser.add_argument(
        "--raw-root",
        type=Path,
        default=Path("raw"),
        help="Root directory containing raw files (default: raw)",
    )
    parser.add_argument(
        "--out-root",
        type=Path,
        default=Path("extracted"),
        help="Output directory for extracted text (default: extracted)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit the number of raw files processed (for testing).",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=4,
        help="Maximum number of worker processes/threads.",
    )

    args = parser.parse_args()

    raw_root = args.raw_root
    out_root = args.out_root
    out_root.mkdir(parents=True, exist_ok=True)

    raw_files = discover_raw_files(raw_root)
    to_process = list(iter_limited(raw_files, args.limit))

    if not to_process:
        print("No raw files discovered; nothing to do.")
        return

    print(f"Discovered {len(to_process)} raw files to process under {raw_root}.")

    def _worker(path: Path) -> None:
        try:
            extract_single(path, out_root)
            print(f"OK  {path}")
        except Exception as exc:  # pragma: no cover - best-effort logging
            print(f"ERR {path}: {exc}")

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.max_workers) as executor:
        list(executor.map(_worker, to_process))


if __name__ == "__main__":
    main()


