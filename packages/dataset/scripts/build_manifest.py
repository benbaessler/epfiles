import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class ManifestRecord:
    doc_id: str
    source_url: Optional[str]
    page_count: int
    timestamps: Dict[str, Any]
    tags: Dict[str, List[str]]
    raw_path: str
    source_type: str
    extraction_method: str
    hash_raw: str
    hash_text: str
    pipeline_version: str
    # Optional fields related to cleaned text; kept additive for backwards compatibility.
    clean_available: bool = False
    clean_path: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "doc_id": self.doc_id,
            "source_url": self.source_url,
            "page_count": self.page_count,
            "timestamps": self.timestamps,
            "tags": self.tags,
            "raw_path": self.raw_path,
            "source_type": self.source_type,
            "extraction_method": self.extraction_method,
            "hash_raw": self.hash_raw,
            "hash_text": self.hash_text,
            "pipeline_version": self.pipeline_version,
            "clean_available": self.clean_available,
            "clean_path": self.clean_path,
        }


def load_page_metadata(meta_path: Path) -> Dict[str, Any]:
    try:
        return json.loads(meta_path.read_text(encoding="utf-8"))
    except Exception as exc:  # pragma: no cover - defensive logging
        raise RuntimeError(f"Failed to read metadata file {meta_path}: {exc}") from exc


def build_record_from_doc_dir(doc_dir: Path) -> ManifestRecord:
    doc_id = doc_dir.name
    meta_files = sorted(doc_dir.glob("*.meta.json"))

    if not meta_files:
        raise RuntimeError(f"No .meta.json files found under {doc_dir}")

    first_meta_path = meta_files[0]
    meta = load_page_metadata(first_meta_path)

    page_count = len(meta_files)

    raw_path = meta["raw_path"]
    source_type = meta["source_type"]
    extraction_method = meta["extraction_method"]
    hash_raw = meta["hash_raw"]
    hash_text = meta["hash_text"]
    pipeline_version = meta["pipeline_version"]
    created_at = meta["created_at"]

    timestamps = {"extracted_at": created_at}

    tags: Dict[str, List[str]] = {
        "people": [],
        "orgs": [],
        "locations": [],
    }

    # Clean text availability is derived from the presence of a parallel clean/<doc_id> directory.
    clean_root = doc_dir.parent.parent / "clean"
    clean_dir = clean_root / doc_id
    clean_available = clean_dir.exists() and any(clean_dir.glob("*.txt"))
    clean_path = str(clean_dir.relative_to(clean_root.parent)) if clean_available else None

    return ManifestRecord(
        doc_id=doc_id,
        source_url=None,
        page_count=page_count,
        timestamps=timestamps,
        tags=tags,
        raw_path=raw_path,
        source_type=source_type,
        extraction_method=extraction_method,
        hash_raw=hash_raw,
        hash_text=hash_text,
        pipeline_version=pipeline_version,
        clean_available=clean_available,
        clean_path=clean_path,
    )


def build_manifest(extracted_root: Path) -> List[ManifestRecord]:
    if not extracted_root.exists():
        raise FileNotFoundError(f"Extracted root does not exist: {extracted_root}")

    records: List[ManifestRecord] = []

    for doc_dir in sorted(p for p in extracted_root.iterdir() if p.is_dir()):
        record = build_record_from_doc_dir(doc_dir)
        records.append(record)

    records.sort(key=lambda r: r.doc_id)
    return records


def write_manifest(records: List[ManifestRecord], output_path: Path, overwrite: bool) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.exists() and not overwrite:
        raise FileExistsError(
            f"Output manifest already exists at {output_path}. "
            "Use --overwrite to replace it."
        )

    with output_path.open("w", encoding="utf-8") as f:
        for record in records:
            obj = record.to_dict()
            f.write(json.dumps(obj, ensure_ascii=False, sort_keys=True) + "\n")


def resolve_root(root_arg: Optional[Path]) -> Path:
    if root_arg is not None:
        return root_arg
    # Default: repository root is the parent of the scripts directory.
    return Path(__file__).resolve().parent.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build unified document-level manifest from extracted page metadata."
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=None,
        help="Repository root (default: parent of this script).",
    )
    parser.add_argument(
        "--extracted-root",
        type=Path,
        default=None,
        help="Root directory containing extracted pages (default: <root>/extracted).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output manifest path (default: <root>/manifest/manifest.jsonl).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Allow overwriting an existing manifest file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    root = resolve_root(args.root)

    extracted_root = args.extracted_root or (root / "extracted")
    output_path = args.output or (root / "manifest" / "manifest.jsonl")

    records = build_manifest(extracted_root)
    write_manifest(records, output_path, overwrite=args.overwrite)


if __name__ == "__main__":
    main()


