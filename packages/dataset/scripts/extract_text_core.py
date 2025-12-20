import hashlib
import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Optional

try:
    import fitz  # type: ignore[import]
except ImportError:  # pragma: no cover - optional dependency for now
    fitz = None  # type: ignore[assignment]

try:
    import pytesseract  # type: ignore[import]
    from PIL import Image  # type: ignore[import]
except ImportError:  # pragma: no cover - optional dependency for now
    pytesseract = None  # type: ignore[assignment]
    Image = None  # type: ignore[assignment]


SourceType = Literal["text", "image", "pdf"]
ExtractionMethod = Literal["direct", "ocr", "pdf-text", "pdf-ocr"]


@dataclass
class PageMetadata:
    doc_id: str
    page: int
    raw_path: str
    source_type: SourceType
    extraction_method: ExtractionMethod
    hash_raw: str
    hash_text: str
    pipeline_version: str
    created_at: str


PIPELINE_VERSION = "v1"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def normalize_doc_id(raw_path: Path) -> str:
    """
    Normalize a raw file path into a stable doc_id.

    Current rule: use the base filename without extension, e.g.
    HOUSE_OVERSIGHT_033599.txt -> HOUSE_OVERSIGHT_033599
    """
    return raw_path.stem


def ensure_output_dir(root: Path, doc_id: str) -> Path:
    out_dir = root / doc_id
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


def write_page(
    out_root: Path,
    doc_id: str,
    page_index: int,
    text: str,
    raw_path: Path,
    source_type: SourceType,
    extraction_method: ExtractionMethod,
    raw_hash: Optional[str] = None,
) -> None:
    """
    Write a single page of text and its metadata to `/extracted/<doc_id>/<page>.txt`
    and `/extracted/<doc_id>/<page>.meta.json`.
    """
    out_dir = ensure_output_dir(out_root, doc_id)
    page_number = page_index + 1  # 1-based
    page_stem = f"{page_number:04d}"

    text_path = out_dir / f"{page_stem}.txt"
    meta_path = out_dir / f"{page_stem}.meta.json"

    # Compute hashes
    hash_raw = raw_hash or sha256_file(raw_path)
    hash_text = sha256_text(text)

    # Write text atomically
    tmp_text_path = text_path.with_suffix(".txt.tmp")
    tmp_text_path.write_text(text, encoding="utf-8")
    tmp_text_path.replace(text_path)

    # Build metadata
    metadata = PageMetadata(
        doc_id=doc_id,
        page=page_number,
        raw_path=str(raw_path.as_posix()),
        source_type=source_type,
        extraction_method=extraction_method,
        hash_raw=hash_raw,
        hash_text=hash_text,
        pipeline_version=PIPELINE_VERSION,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    tmp_meta_path = meta_path.with_suffix(".meta.json.tmp")
    tmp_meta_path.write_text(
        json.dumps(asdict(metadata), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    tmp_meta_path.replace(meta_path)


def extract_from_text_file(raw_path: Path, out_root: Path) -> None:
    """
    Treat a raw TXT file as a single-page document and copy its contents into the
    extracted layout. Normalization/cleaning happens in a later pipeline stage.
    """
    doc_id = normalize_doc_id(raw_path)
    raw_hash = sha256_file(raw_path)
    text = raw_path.read_text(encoding="utf-8", errors="replace")
    write_page(
        out_root=out_root,
        doc_id=doc_id,
        page_index=0,
        text=text,
        raw_path=raw_path,
        source_type="text",
        extraction_method="direct",
        raw_hash=raw_hash,
    )


def ocr_image(raw_path: Path) -> str:
    if pytesseract is None or Image is None:
        raise RuntimeError(
            "pytesseract and Pillow are required for OCR but are not installed."
        )
    with Image.open(raw_path) as img:
        return pytesseract.image_to_string(img)


def extract_from_image_file(raw_path: Path, out_root: Path) -> None:
    """
    Run OCR over an image file and store the result as a single-page document.
    """
    doc_id = normalize_doc_id(raw_path)
    raw_hash = sha256_file(raw_path)
    text = ocr_image(raw_path)
    write_page(
        out_root=out_root,
        doc_id=doc_id,
        page_index=0,
        text=text,
        raw_path=raw_path,
        source_type="image",
        extraction_method="ocr",
        raw_hash=raw_hash,
    )


def extract_from_pdf(raw_path: Path, out_root: Path, ocr_fallback: bool = True) -> None:
    """
    Extract text from a PDF using pymupdf, with optional OCR fallback for pages
    that contain little or no extractable text.
    """
    if fitz is None:
        raise RuntimeError("pymupdf (fitz) is required for PDF extraction.")

    doc_id = normalize_doc_id(raw_path)
    raw_hash = sha256_file(raw_path)
    out_dir = ensure_output_dir(out_root, doc_id)
    out_dir.mkdir(parents=True, exist_ok=True)

    pdf_doc = fitz.open(raw_path)  # type: ignore[call-arg]
    try:
        for page_index in range(len(pdf_doc)):
            page = pdf_doc.load_page(page_index)
            text = page.get_text()
            method: ExtractionMethod = "pdf-text"

            if ocr_fallback and (not text or text.isspace()):
                if pytesseract is None or Image is None:
                    # If OCR is not available, keep empty text but mark method.
                    method = "pdf-text"
                else:
                    # Render the page to an image and OCR it.
                    pix = page.get_pixmap(dpi=300)
                    img_path = out_dir / f"_tmp_page_{page_index:04d}.png"
                    pix.save(str(img_path))
                    try:
                        text = ocr_image(img_path)
                        method = "pdf-ocr"
                    finally:
                        if img_path.exists():
                            img_path.unlink()

            write_page(
                out_root=out_root,
                doc_id=doc_id,
                page_index=page_index,
                text=text or "",
                raw_path=raw_path,
                source_type="pdf",
                extraction_method=method,
                raw_hash=raw_hash,
            )
    finally:
        pdf_doc.close()


def discover_raw_files(root: Path) -> list[Path]:
    """
    Discover raw files we know how to process:
    - TXT files under raw/TEXT/
    - Image files (JPG/JPEG/PNG/TIF/TIFF) under raw/IMAGES/

    PDF support is provided for future drops that may contain PDFs directly.
    """
    candidates: list[Path] = []

    text_root = root / "TEXT"
    if text_root.exists():
        for path, _, files in os.walk(text_root):
            for name in files:
                if name.lower().endswith(".txt"):
                    candidates.append(Path(path) / name)

    images_root = root / "IMAGES"
    if images_root.exists():
        image_exts = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}
        for path, _, files in os.walk(images_root):
            for name in files:
                if Path(name).suffix.lower() in image_exts:
                    candidates.append(Path(path) / name)

    pdf_root = root  # in case future drops include PDFs directly under /raw/
    for path, _, files in os.walk(pdf_root):
        for name in files:
            if name.lower().endswith(".pdf"):
                candidates.append(Path(path) / name)

    return sorted(candidates)


def extract_single(raw_path: Path, out_root: Path) -> None:
    """
    Dispatch extraction based on file extension.
    """
    suffix = raw_path.suffix.lower()
    if suffix == ".txt":
        extract_from_text_file(raw_path, out_root)
    elif suffix in {".jpg", ".jpeg", ".png", ".tif", ".tiff"}:
        extract_from_image_file(raw_path, out_root)
    elif suffix == ".pdf":
        extract_from_pdf(raw_path, out_root)
    else:
        # Unsupported type in this stage: ignore here and let later stages
        # (manifest/metadata) reason about NATIVES and other formats.
        return


