import time
from collections import defaultdict

# Simple in-memory rate limiter
# In production, this should be moved to Redis for multi-instance support
login_attempts = defaultdict(list)
BLOCK_TIME = 300  # 5 minutes
MAX_ATTEMPTS = 5

def check_rate_limit(key: str) -> bool:
    """
    Returns True if the attempt is allowed, False if blocked.
    Key could be an IP address or an email.
    """
    now = time.time()
    
    # Filter out attempts older than 5 minutes
    login_attempts[key] = [t for t in login_attempts[key] if now - t < BLOCK_TIME]
    
    if len(login_attempts[key]) >= MAX_ATTEMPTS:
        return False
        
    return True

def record_failed_attempt(key: str):
    """Record a failed login attempt."""
    login_attempts[key].append(time.time())

def clear_attempts(key: str):
    """Clear attempts after a successful login."""
    if key in login_attempts:
        del login_attempts[key]
