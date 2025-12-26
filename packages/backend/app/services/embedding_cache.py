"""
Simple in-memory LRU cache for query embeddings.

Caches embeddings to avoid regenerating them for identical queries.
This is particularly useful for:
- Users asking the same question multiple times
- Common/frequent queries
- Development and testing

Note: This is an in-memory cache that doesn't persist across restarts.
For production with multiple instances, consider using Redis.
"""

from typing import List, Optional
from collections import OrderedDict
import hashlib
import threading


class EmbeddingCache:
    """
    Thread-safe LRU cache for embeddings.
    
    Embeddings are keyed by a hash of the query text to save memory.
    """

    def __init__(self, max_size: int = 1000):
        """
        Initialize the embedding cache.
        
        Args:
            max_size: Maximum number of embeddings to cache
        """
        self.max_size = max_size
        self._cache: OrderedDict[str, List[float]] = OrderedDict()
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    def _hash_query(self, query: str) -> str:
        """Generate a hash key for a query string."""
        return hashlib.sha256(query.encode("utf-8")).hexdigest()

    def get(self, query: str) -> Optional[List[float]]:
        """
        Get a cached embedding for a query.
        
        Args:
            query: The query text
            
        Returns:
            Cached embedding or None if not found
        """
        key = self._hash_query(query)
        with self._lock:
            if key in self._cache:
                # Move to end (most recently used)
                self._cache.move_to_end(key)
                self._hits += 1
                return self._cache[key]
            self._misses += 1
            return None

    def set(self, query: str, embedding: List[float]) -> None:
        """
        Cache an embedding for a query.
        
        Args:
            query: The query text
            embedding: The embedding vector
        """
        key = self._hash_query(query)
        with self._lock:
            if key in self._cache:
                # Update existing and move to end
                self._cache.move_to_end(key)
                self._cache[key] = embedding
            else:
                # Add new entry
                self._cache[key] = embedding
                # Evict oldest if over capacity
                while len(self._cache) > self.max_size:
                    self._cache.popitem(last=False)

    def clear(self) -> None:
        """Clear all cached embeddings."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0

    def stats(self) -> dict:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with size, hits, misses, and hit rate
        """
        with self._lock:
            total = self._hits + self._misses
            hit_rate = self._hits / total if total > 0 else 0.0
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": round(hit_rate, 4),
            }


# Global cache instance
_embedding_cache: Optional[EmbeddingCache] = None


def get_embedding_cache(max_size: int = 1000) -> EmbeddingCache:
    """
    Get the global embedding cache instance.
    
    Args:
        max_size: Maximum cache size (only used on first call)
        
    Returns:
        The embedding cache instance
    """
    global _embedding_cache
    if _embedding_cache is None:
        _embedding_cache = EmbeddingCache(max_size=max_size)
    return _embedding_cache

