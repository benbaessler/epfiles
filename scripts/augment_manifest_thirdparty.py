import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, Iterable


def discover_thirdparty_text(thirdparty_root: Path) -> Dict[str, set]:
    """Discover which doc_ids have third-party text by source_repo.

    The ingestion pipeline writes files under:
        thirdparty/text/<source_repo>/<doc_id>/<page>.json
    This function walks that tree and builds a mapping:
        doc_id -> {source_repo1, source_repo2, ...}
    """
    mapping: Dict[str, set] = defaultdict(set)
    text_root = thirdparty_root / "text"
    if not text_root.exists():
        return mapping

    for source_repo_dir in text_root.iterdir():
        if not source_repo_dir.is_dir():
            continue
        source_repo = source_repo_dir.name
        for doc_dir in source_repo_dir.iterdir():
            if not doc_dir.is_dir():
                continue
            doc_id = doc_dir.name
            # Only consider doc_ids that actually have at least one page file.
            has_page_files = any(p.is_file() for p in doc_dir.iterdir())
            if has_page_files:
                mapping[doc_id].add(source_repo)
    return mapping


def augment_manifest(
    manifest_in: Path,
    manifest_out: Path,
    thirdparty_root: Path,
) -> None:
    """Write an augmented manifest with third-party availability fields.

    This keeps the core schema stable while adding optional fields:
        - has_thirdparty_text: bool
        - thirdparty_sources: list[str]
    """
    thirdparty_text = discover_thirdparty_text(thirdparty_root)

    with manifest_in.open("r", encoding="utf-8") as fin, manifest_out.open(
        "w", encoding="utf-8"
    ) as fout:
        for line in fin:
            raw = line.strip()
            if not raw:
                continue
            obj = json.loads(raw)
            doc_id = obj.get("doc_id")
            sources = sorted(thirdparty_text.get(doc_id, []))
            if sources:
                obj["has_thirdparty_text"] = True
                obj["thirdparty_sources"] = sources
            else:
                obj["has_thirdparty_text"] = False
                obj["thirdparty_sources"] = []
            fout.write(json.dumps(obj, ensure_ascii=False) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Augment manifest.jsonl with third-party availability flags.",
    )
    parser.add_argument(
        "--manifest-in",
        type=Path,
        default=Path("manifest/manifest.jsonl"),
        help="Input manifest.jsonl (default: manifest/manifest.jsonl)",
    )
    parser.add_argument(
        "--manifest-out",
        type=Path,
        default=Path("manifest/manifest+thirdparty.jsonl"),
        help="Output augmented manifest.jsonl (default: manifest/manifest+thirdparty.jsonl)",
    )
    parser.add_argument(
        "--thirdparty-root",
        type=Path,
        default=Path("thirdparty"),
        help="Root directory for third-party outputs (default: thirdparty)",
    )

    args = parser.parse_args()
    augment_manifest(args.manifest_in, args.manifest_out, args.thirdparty_root)


if __name__ == "__main__":
    main()


