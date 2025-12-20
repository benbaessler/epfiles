import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Iterator, List, Optional


@dataclass
class ThirdPartyRecord:
    doc_id: str
    source_repo: str
    source_path: str
    kind: str
    payload: dict


def load_manifest(path: Path) -> Dict[str, dict]:
    """Load manifest.jsonl into a mapping of doc_id -> record.

    This keeps the manifest as the single source of truth for which doc_ids
    we consider canonical. Third-party records that do not map cleanly to an
    existing doc_id are treated as unmapped and written to a separate file.
    """
    manifest: Dict[str, dict] = {}
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            doc_id = obj.get("doc_id")
            if not doc_id:
                continue
            manifest[doc_id] = obj
    return manifest


def iter_epstein_docs_results(results_root: Path) -> Iterator[dict]:
    """Yield raw result JSON objects from epstein-docs.github.io `results/`.

    The external repo stores one JSON file per processed document page under a
    `results/` directory. Each file is expected to contain extracted text and
    metadata, including some form of document identifier that we can map back
    to our `doc_id` convention.
    """
    if not results_root.exists():
        return

    for path in sorted(results_root.rglob("*.json")):
        try:
            with path.open("r", encoding="utf-8") as f:
                data = json.load(f)
            data["_source_path"] = str(path.relative_to(results_root.parent))
            yield data
        except Exception:
            # Best-effort ingestion; invalid JSON is skipped.
            continue


def map_epstein_docs_record_to_doc_id(record: dict, manifest: Dict[str, dict]) -> Optional[str]:
    """Map a single epstein-docs result record to a canonical doc_id.

    This function encapsulates the heuristics for reconciling the epstein-docs
    JSON schema with our manifest. For now we support a conservative subset of
    mapping strategies and fall back to None when no confident match exists.
    """
    # Preferred: explicit HOUSE_OVERSIGHT-style identifier if present.
    doc_id = record.get("doc_id") or record.get("document_id")
    if isinstance(doc_id, str) and doc_id in manifest:
        return doc_id

    # Fallback: attempt to parse a HOUSE_OVERSIGHT_XXXXXX pattern from any
    # known identifier fields.
    for key in ("document_number", "document_name", "file_name"):
        value = record.get(key)
        if not isinstance(value, str):
            continue
        if "HOUSE_OVERSIGHT_" in value:
            # Extract the contiguous HOUSE_OVERSIGHT_######## token.
            # This is intentionally simple and conservative.
            parts = value.split()
            for part in parts:
                if part.startswith("HOUSE_OVERSIGHT_"):
                    normalized = part.split(".")[0]
                    if normalized in manifest:
                        return normalized
    return None


def normalize_epstein_docs_record(
    record: dict,
    doc_id: str,
    source_repo: str = "epstein-docs.github.io",
) -> ThirdPartyRecord:
    """Normalize a raw epstein-docs record into a ThirdPartyRecord."""
    source_path = record.get("_source_path", "")
    kind = "ocr_text"
    payload = {
        "doc_id": doc_id,
        "page": record.get("page"),
        "text": record.get("text") or record.get("content"),
        "metadata": {
            "raw": {
                "source_repo": source_repo,
                "source_path": source_path,
            },
            "epstein_docs": {
                "document_id": record.get("document_id"),
                "document_number": record.get("document_number"),
                "document_name": record.get("document_name"),
                "file_name": record.get("file_name"),
            },
        },
    }
    return ThirdPartyRecord(
        doc_id=doc_id,
        source_repo=source_repo,
        source_path=source_path,
        kind=kind,
        payload=payload,
    )


def write_thirdparty_text(
    out_root: Path,
    records: Iterable[ThirdPartyRecord],
) -> None:
    """Write normalized text-like ThirdPartyRecord objects to /thirdparty/text/."""
    for rec in records:
        doc_dir = out_root / "text" / rec.source_repo / rec.doc_id
        doc_dir.mkdir(parents=True, exist_ok=True)
        page = rec.payload.get("page")
        page_str = f"{int(page):04d}" if isinstance(page, int) else "0000"
        out_path = doc_dir / f"{page_str}.json"
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(rec.payload, f, ensure_ascii=False)


def write_unmapped(
    out_root: Path,
    source_repo: str,
    raw_records: Iterable[dict],
) -> None:
    """Write unmapped records for later inspection and mapping refinement."""
    out_root.mkdir(parents=True, exist_ok=True)
    out_path = out_root / f"{source_repo}_unmapped.jsonl"
    with out_path.open("w", encoding="utf-8") as f:
        for rec in raw_records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")


def ingest_epstein_docs(
    manifest_path: Path,
    repos_root: Path,
    out_root: Path,
) -> None:
    """Ingest third-party outputs from epstein-docs.github.io into /thirdparty."""
    manifest = load_manifest(manifest_path)

    # Support both the GitHub repo name and the locally cloned directory name.
    # Some environments may clone as `epstein-docs` instead of
    # `epstein-docs.github.io`.
    candidate_roots = [
        repos_root / "epstein-docs.github.io",
        repos_root / "epstein-docs",
    ]
    repo_root: Path | None = None
    for candidate in candidate_roots:
        if candidate.exists():
            repo_root = candidate
            break
    if repo_root is None:
        # Nothing to ingest if the repo is not present.
        return

    results_root = repo_root / "results"

    mapped_records: List[ThirdPartyRecord] = []
    unmapped_raw: List[dict] = []

    for raw in iter_epstein_docs_results(results_root):
        doc_id = map_epstein_docs_record_to_doc_id(raw, manifest)
        if not doc_id:
            unmapped_raw.append(raw)
            continue
        mapped_records.append(normalize_epstein_docs_record(raw, doc_id))

    write_thirdparty_text(out_root / "thirdparty", mapped_records)

    if unmapped_raw:
        write_unmapped(out_root / "thirdparty" / "unmapped", "epstein-docs.github.io", unmapped_raw)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ingest reusable third-party extractions into the unified dataset.",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("manifest/manifest.jsonl"),
        help="Path to manifest.jsonl (default: manifest/manifest.jsonl)",
    )
    parser.add_argument(
        "--repos-root",
        type=Path,
        default=Path("repos"),
        help="Root directory containing cloned third-party repos (default: repos)",
    )
    parser.add_argument(
        "--out-root",
        type=Path,
        default=Path("."),
        help="Root directory for writing third-party outputs (default: current directory)",
    )
    parser.add_argument(
        "--source",
        type=str,
        choices=["epstein-docs"],
        required=True,
        help="Third-party source to ingest (e.g. epstein-docs).",
    )

    args = parser.parse_args()

    if args.source == "epstein-docs":
        ingest_epstein_docs(args.manifest, args.repos_root, args.out_root)


if __name__ == "__main__":
    main()


