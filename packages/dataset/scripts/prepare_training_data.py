import argparse
import json
import logging
import shutil
from pathlib import Path
from typing import Optional

def setup_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(message)s",
    )

def copy_directory_contents(src: Path, dst: Path, pattern: str = "*") -> int:
    """Copy files matching pattern from src to dst, preserving structure relative to src."""
    if not src.exists():
        logging.warning(f"Source directory not found: {src}")
        return 0

    count = 0
    for src_file in src.rglob(pattern):
        if not src_file.is_file():
            continue
        
        # Calculate relative path to maintain structure
        rel_path = src_file.relative_to(src)
        dst_file = dst / rel_path
        
        dst_file.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_file, dst_file)
        count += 1
        
    return count

def copy_single_file(src: Path, dst: Path) -> bool:
    if not src.exists():
        logging.warning(f"Source file not found: {src}")
        return False
    
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    return True

def prepare_training_data(
    clean_root: Path,
    chunks_root: Path,
    repos_root: Path,
    manifest_path: Path,
    training_root: Path,
) -> None:
    training_root.mkdir(parents=True, exist_ok=True)
    
    # 1. Copy cleaned text
    logging.info("Populating raw_docs from cleaned text...")
    raw_docs_dir = training_root / "raw_docs"
    raw_docs_count = copy_directory_contents(clean_root, raw_docs_dir, "*.txt")
    logging.info(f"Copied {raw_docs_count} cleaned text files.")

    # 2. Copy chunks
    logging.info("Populating chunks...")
    chunks_dir = training_root / "chunks"
    chunks_count = copy_directory_contents(chunks_root, chunks_dir, "*.jsonl")
    logging.info(f"Copied {chunks_count} chunk files.")

    # 3. Copy manifest
    logging.info("Copying manifest...")
    manifest_dst = training_root / "manifest.jsonl"
    if copy_single_file(manifest_path, manifest_dst):
        logging.info("Manifest copied.")

    # 4. Extract entities and summaries from known repos
    # We look for specific files in the epstein-docs repo if it exists
    # Supporting both "epstein-docs.github.io" and "epstein-docs" folder names
    repo_candidates = ["epstein-docs.github.io", "epstein-docs"]
    
    found_repo = False
    for repo_name in repo_candidates:
        repo_path = repos_root / repo_name
        if repo_path.exists():
            logging.info(f"Found third-party repo: {repo_name}")
            found_repo = True
            
            # Entities (dedupe.json)
            dedupe_src = repo_path / "dedupe.json"
            entities_dst = training_root / "entities" / "dedupe.json"
            if copy_single_file(dedupe_src, entities_dst):
                logging.info(f"Copied entities from {dedupe_src}")
            
            # Summaries (analyses.json)
            analyses_src = repo_path / "analyses.json"
            summaries_dst = training_root / "summaries" / "analyses.json"
            if copy_single_file(analyses_src, summaries_dst):
                logging.info(f"Copied summaries from {analyses_src}")
            
            break
            
    if not found_repo:
        logging.warning(f"No supported third-party repositories found in {repos_root}. Skipping entity/summary extraction.")

def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare the training dataset directory structure.")
    parser.add_argument(
        "--clean-root",
        type=Path,
        default=Path("clean"),
        help="Source directory for cleaned text (default: clean)",
    )
    parser.add_argument(
        "--chunks-root",
        type=Path,
        default=Path("chunks"),
        help="Source directory for chunked JSONL (default: chunks)",
    )
    parser.add_argument(
        "--repos-root",
        type=Path,
        default=Path("repos"),
        help="Root directory containing third-party repos (default: repos)",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("manifest/manifest.jsonl"),
        help="Path to manifest file (default: manifest/manifest.jsonl)",
    )
    parser.add_argument(
        "--train-root",
        type=Path,
        default=Path("training"),
        help="Output root for training data (default: training)",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        help="Logging level (DEBUG, INFO, WARNING, ERROR)",
    )

    args = parser.parse_args()
    setup_logging(args.log_level)
    
    prepare_training_data(
        args.clean_root,
        args.chunks_root,
        args.repos_root,
        args.manifest,
        args.train_root,
    )

if __name__ == "__main__":
    main()

