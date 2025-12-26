"""
Server-side rate limiting service.

Uses in-memory storage by default. For production with multiple instances,
configure REDIS_URL environment variable to use Redis-backed rate limiting.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from collections import defaultdict
import threading


class RateLimitExceeded(Exception):
    """Raised when a user has exceeded their rate limit."""

    def __init__(self, message: str = "Rate limit exceeded", reset_at: Optional[datetime] = None):
        super().__init__(message)
        self.reset_at = reset_at


class InMemoryRateLimiter:
    """
    Simple in-memory rate limiter.
    
    Note: This does not persist across restarts and does not scale
    horizontally. For production with multiple backend instances,
    use Redis-backed rate limiting.
    """

    def __init__(self, window_seconds: int = 86400, max_requests: int = 10):
        """
        Initialize the rate limiter.
        
        Args:
            window_seconds: Time window in seconds (default: 24 hours)
            max_requests: Maximum requests allowed in the window
        """
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self._requests: dict[str, list[datetime]] = defaultdict(list)
        self._lock = threading.Lock()

    def _cleanup_old_requests(self, user_id: str) -> None:
        """Remove requests outside the current time window."""
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=self.window_seconds)
        self._requests[user_id] = [
            ts for ts in self._requests[user_id] if ts > cutoff
        ]

    def check_rate_limit(self, user_id: str) -> tuple[int, int, datetime]:
        """
        Check if a user is within their rate limit.
        
        Args:
            user_id: The user identifier to check
            
        Returns:
            Tuple of (current_count, remaining, reset_time)
            
        Raises:
            RateLimitExceeded: If the user has exceeded their limit
        """
        with self._lock:
            self._cleanup_old_requests(user_id)
            current_count = len(self._requests[user_id])
            remaining = max(0, self.max_requests - current_count)
            
            # Calculate reset time (when oldest request expires)
            if self._requests[user_id]:
                oldest = min(self._requests[user_id])
                reset_at = oldest + timedelta(seconds=self.window_seconds)
            else:
                reset_at = datetime.now(timezone.utc) + timedelta(seconds=self.window_seconds)
            
            if current_count >= self.max_requests:
                raise RateLimitExceeded(
                    f"Free tier limit of {self.max_requests} messages reached. "
                    "Please provide your xAI API key for unlimited usage.",
                    reset_at=reset_at
                )
            
            return current_count, remaining, reset_at

    def record_request(self, user_id: str) -> tuple[int, int]:
        """
        Record a request for a user.
        
        Args:
            user_id: The user identifier
            
        Returns:
            Tuple of (new_count, remaining)
        """
        with self._lock:
            self._cleanup_old_requests(user_id)
            self._requests[user_id].append(datetime.now(timezone.utc))
            current_count = len(self._requests[user_id])
            remaining = max(0, self.max_requests - current_count)
            return current_count, remaining

    def get_usage(self, user_id: str) -> tuple[int, int]:
        """
        Get current usage for a user without recording a request.
        
        Args:
            user_id: The user identifier
            
        Returns:
            Tuple of (current_count, remaining)
        """
        with self._lock:
            self._cleanup_old_requests(user_id)
            current_count = len(self._requests[user_id])
            remaining = max(0, self.max_requests - current_count)
            return current_count, remaining


# Global rate limiter instance
_rate_limiter: Optional[InMemoryRateLimiter] = None


def get_rate_limiter(max_requests: int = 10, window_seconds: int = 86400) -> InMemoryRateLimiter:
    """
    Get the global rate limiter instance.
    
    Args:
        max_requests: Maximum requests per window (only used on first call)
        window_seconds: Window size in seconds (only used on first call)
        
    Returns:
        The rate limiter instance
    """
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = InMemoryRateLimiter(
            window_seconds=window_seconds,
            max_requests=max_requests
        )
    return _rate_limiter

