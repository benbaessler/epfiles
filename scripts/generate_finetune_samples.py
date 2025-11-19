import argparse
import json
import logging
from pathlib import Path
from typing import Dict, List, Any

def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(message)s",
    )

def create_chat_sample(user_content: str, assistant_content: str) -> Dict[str, Any]:
    """Create a standard chat completion format sample."""
    return {
        "messages": [
            {"role": "user", "content": user_content},
            {"role": "assistant", "content": assistant_content}
        ]
    }

def generate_samples(
    input_file: Path,
    output_dir: Path,
) -> None:
    if not input_file.exists():
        logging.error(f"Input file not found: {input_file}")
        return

    output_dir.mkdir(parents=True, exist_ok=True)

    # Define output paths
    paths = {
        "entity": output_dir / "entity_extraction.jsonl",
        "timeline": output_dir / "timeline_extraction.jsonl",
        "qa": output_dir / "qa_pairs.jsonl",
        "summary": output_dir / "summarization.jsonl"
    }

    # Open all output files
    files = {k: open(p, "w", encoding="utf-8") for k, p in paths.items()}
    
    counts = {k: 0 for k in paths.keys()}
    
    logging.info(f"Reading from {input_file}...")
    
    try:
        with open(input_file, "r", encoding="utf-8") as f_in:
            for line_num, line in enumerate(f_in, 1):
                line = line.strip()
                if not line:
                    continue
                
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    logging.warning(f"Skipping invalid JSON at line {line_num}")
                    continue

                full_text = data.get("full_text", "").strip()
                if not full_text:
                    continue

                entities = data.get("entities", {})
                additional_notes = data.get("additional_notes", "").strip()

                # 1. Entity Extraction
                if entities:
                    # Filter to just the types we care about for this task
                    relevant_entities = {
                        k: v for k, v in entities.items() 
                        if k in ["people", "organizations", "locations"] and v
                    }
                    
                    if relevant_entities:
                        user_prompt = f"Extract all structured entities (people, organizations, locations) from the text below:\n\n{full_text}"
                        assistant_response = json.dumps(relevant_entities, indent=2)
                        
                        sample = create_chat_sample(user_prompt, assistant_response)
                        files["entity"].write(json.dumps(sample) + "\n")
                        counts["entity"] += 1

                # 2. Timeline Extraction
                dates = entities.get("dates", [])
                if dates:
                    user_prompt = f"Extract a chronological timeline of dates mentioned in the text:\n\n{full_text}"
                    # Assuming dates are just a list of strings for now. 
                    # In a real scenario we might want to sort them if possible, 
                    # but here we trust the extraction or just provide the list.
                    assistant_response = json.dumps(dates, indent=2)
                    
                    sample = create_chat_sample(user_prompt, assistant_response)
                    files["timeline"].write(json.dumps(sample) + "\n")
                    counts["timeline"] += 1

                # 3. QA Pairs
                people = entities.get("people", [])
                if people:
                    user_prompt = "Identify the key individuals mentioned in this document."
                    assistant_response = ", ".join(people)
                    # Context must be provided in the system prompt or included in user prompt for RAG.
                    # For fine-tuning completion where context is part of the prompt:
                    user_prompt_with_context = f"{user_prompt}\n\nContext:\n{full_text}"
                    
                    sample = create_chat_sample(user_prompt_with_context, assistant_response)
                    files["qa"].write(json.dumps(sample) + "\n")
                    counts["qa"] += 1

                orgs = entities.get("organizations", [])
                if orgs:
                    user_prompt = "Which organizations are involved?"
                    assistant_response = ", ".join(orgs)
                    user_prompt_with_context = f"{user_prompt}\n\nContext:\n{full_text}"
                    
                    sample = create_chat_sample(user_prompt_with_context, assistant_response)
                    files["qa"].write(json.dumps(sample) + "\n")
                    counts["qa"] += 1

                # 4. Summarization
                if additional_notes:
                    user_prompt = f"Provide a concise summary of this document:\n\n{full_text}"
                    assistant_response = additional_notes
                    
                    sample = create_chat_sample(user_prompt, assistant_response)
                    files["summary"].write(json.dumps(sample) + "\n")
                    counts["summary"] += 1

    finally:
        for f in files.values():
            f.close()

    logging.info("Generation complete.")
    for k, v in counts.items():
        logging.info(f"Generated {v} samples for {k}.")

def main() -> None:
    parser = argparse.ArgumentParser(description="Generate fine-tuning samples from processed data.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("thirdparty/unmapped/epstein-docs.github.io_unmapped.jsonl"),
        help="Input JSONL file path",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("finetune"),
        help="Output directory for JSONL files",
    )
    
    args = parser.parse_args()
    setup_logging()
    
    generate_samples(args.input, args.output_dir)

if __name__ == "__main__":
    main()

