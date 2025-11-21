import json
import os
from pathlib import Path
from typing import List, Dict
from openai import OpenAI
import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from tqdm import tqdm
import time

load_dotenv()

# Initialize clients
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize ChromaDB (persistent to disk)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Constants
CHUNKS_DIR = Path("data/chunks")
COLLECTION_NAME = "epstein_files"
EMBEDDING_MODEL = "text-embedding-3-large"
PRICE_PER_1M_TOKENS = 0.13  # $0.13 per 1M tokens for text-embedding-3-large
BATCH_SIZE = 100  # Process 100 chunks at a time

def create_collection():
    """Create or get ChromaDB collection."""
    collection = chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}  # Use cosine similarity
    )
    print(f"Connected to collection: {COLLECTION_NAME}")
    return collection

def embed_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a batch of texts."""
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    return [item.embedding for item in response.data]

def load_chunks() -> List[Dict]:
    """Load all chunks from JSONL files."""
    all_chunks = []

    for jsonl_file in sorted(CHUNKS_DIR.glob("*.jsonl")):
        with open(jsonl_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    chunk = json.loads(line)
                    all_chunks.append(chunk)

    print(f"Loaded {len(all_chunks)} chunks from {CHUNKS_DIR}")
    return all_chunks

def upload_to_chromadb(collection, chunks: List[Dict]):
    """Upload chunks with embeddings to ChromaDB."""
    total_batches = (len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE

    for i in tqdm(range(0, len(chunks), BATCH_SIZE),
                  desc="Uploading to ChromaDB",
                  total=total_batches):

        batch = chunks[i:i + BATCH_SIZE]

        # Extract texts for embedding
        texts = [chunk["text"] for chunk in batch]

        # Generate embeddings
        try:
            embeddings = embed_batch(texts)
        except Exception as e:
            print(f"\nError generating embeddings for batch {i//BATCH_SIZE}: {e}")
            time.sleep(5)  # Rate limit backoff
            continue

        # Prepare data for ChromaDB
        ids = [chunk["chunk_id"] for chunk in batch]
        documents = [chunk["text"] for chunk in batch]
        metadatas = [
            {
                "doc_id": chunk["doc_id"],
                "page_start": chunk["page_start"],
                "page_end": chunk["page_end"],
                "token_count": chunk["token_count"],
                "source_filename": chunk["source_filename"],
                "raw_path": chunk["raw_path"]
            }
            for chunk in batch
        ]

        # Upload to ChromaDB
        try:
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
        except Exception as e:
            print(f"\nError uploading batch {i//BATCH_SIZE}: {e}")
            continue

        # Small delay to avoid rate limits
        time.sleep(0.1)

def main():
    """Main execution flow."""
    print("=" * 50)
    print("RAG Data Ingestion - Embedding & Upload to ChromaDB")
    print("=" * 50)

    # Step 1: Create/connect to collection
    collection = create_collection()

    # Step 2: Load chunks
    chunks = load_chunks()

    # Step 3: Calculate stats and ask for confirmation
    total_tokens = sum(chunk["token_count"] for chunk in chunks)
    estimated_cost = (total_tokens / 1_000_000) * PRICE_PER_1M_TOKENS

    print("\n" + "-" * 30)
    print(f"Total Chunks: {len(chunks)}")
    print(f"Total Tokens: {total_tokens:,}")
    print(f"Estimated Cost: ${estimated_cost:.4f}")
    print("-" * 30 + "\n")

    confirm = input("Proceed with embedding and upload? (y/n): ").lower().strip()
    if confirm != 'y':
        print("Operation cancelled.")
        return

    # Step 4: Upload with embeddings
    print(f"\nUploading {len(chunks)} chunks to ChromaDB...")
    upload_to_chromadb(collection, chunks)

    # Step 5: Verify
    count = collection.count()
    print("\n" + "=" * 50)
    print(f"Upload Complete!")
    print(f"Total vectors in collection: {count}")
    print(f"ChromaDB location: ./chroma_db")
    print("=" * 50)

if __name__ == "__main__":
    main()
