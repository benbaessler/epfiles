import os
import zipfile
import logging
import httpx
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Default ChromaDB download URL (override with CHROMADB_DOWNLOAD_URL env var)
DEFAULT_CHROMADB_URL = "https://pub-bb289fb1eb1845dda7000f73a13d37cd.r2.dev/chroma_db.zip"

def _has_vector_data(db_path: str) -> bool:
    """Check if ChromaDB has actual vector data (not just an empty initialized DB)."""
    if not os.path.exists(db_path):
        return False
    
    # ChromaDB stores vectors in UUID-named subdirectories with .bin files
    # An empty DB will have chroma.sqlite3 but no data_level0.bin files
    for item in os.listdir(db_path):
        item_path = os.path.join(db_path, item)
        if os.path.isdir(item_path):
            # Check for data_level0.bin which contains actual vector data
            data_file = os.path.join(item_path, "data_level0.bin")
            if os.path.exists(data_file) and os.path.getsize(data_file) > 0:
                return True
    return False


def download_db_if_missing():
    """Downloads and extracts ChromaDB if not present."""
    db_path = settings.chroma_db_path
    
    # Check if ChromaDB has actual vector data (not just an empty shell)
    if _has_vector_data(db_path):
        print("✅ ChromaDB with vector data found. Skipping download.")
        return

    db_url = os.getenv("CHROMADB_DOWNLOAD_URL", DEFAULT_CHROMADB_URL)

    print(f"⬇️ Downloading ChromaDB from {db_url}...")
    
    zip_path = "chroma_db.zip"
    
    try:
        # Download
        with httpx.Client() as client:
            resp = client.get(db_url, follow_redirects=True, timeout=300.0)
            resp.raise_for_status()
            with open(zip_path, "wb") as f:
                f.write(resp.content)
        
        # Extract
        print("📦 Extracting database...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(".")  # Extracts to current dir (should contain chroma_db folder)
            
        # Cleanup
        if os.path.exists(zip_path):
            os.remove(zip_path)
        print("✅ Database setup complete!")
        
    except Exception as e:
        print(f"❌ Failed to download database: {e}")
        # Don't crash, just let the app start empty

