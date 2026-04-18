import time
from fastapi import HTTPException, Request


class RateLimiter:
    """
    Simple in-memory IP-based rate limiter
    """

    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds
        self.clients = {}

    def check(self, request: Request):
        ip = request.client.host
        now = time.time()

        timestamps = self.clients.get(ip, [])

        # Remove expired timestamps
        timestamps = [t for t in timestamps if now - t < self.window]

        if len(timestamps) >= self.limit:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Slow down."
            )

        timestamps.append(now)
        self.clients[ip] = timestamps


# Singleton limiter
rate_limiter = RateLimiter(
    limit=5,          # max requests
    window_seconds=60 # per minute
)
