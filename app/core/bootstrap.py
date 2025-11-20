import os
import zipfile
import logging
import httpx
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

def download_db_if_missing():
    """Downloads and extracts ChromaDB if not present."""
    db_path = settings.chroma_db_path
    
    # Check if DB exists and is not empty
    if os.path.exists(db_path) and os.listdir(db_path):
        print("✅ ChromaDB found. Skipping download.")
        return

    db_url = os.getenv("CHROMADB_DOWNLOAD_URL")
    if not db_url:
        print("⚠️ No CHROMADB_DOWNLOAD_URL set. Starting with empty DB.")
        return

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

