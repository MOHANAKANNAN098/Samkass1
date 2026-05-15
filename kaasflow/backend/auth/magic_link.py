import jwt
import os
from datetime import datetime, timedelta

MAGIC_LINK_SECRET = os.environ.get('MAGIC_LINK_SECRET', 'magic-link-secret-key-change-me')
MAGIC_LINK_EXPIRY = int(os.environ.get('MAGIC_LINK_EXPIRY', 3600))  # Default 1 hour

def generate_magic_link_token(email: str):
    """Generate a token for a magic link."""
    payload = {
        "email": email,
        "exp": datetime.utcnow() + timedelta(seconds=MAGIC_LINK_EXPIRY),
        "type": "magic_link"
    }
    return jwt.encode(payload, MAGIC_LINK_SECRET, algorithm='HS256')

def verify_magic_link_token(token: str):
    """Verify a magic link token and return the email if valid."""
    try:
        payload = jwt.decode(token, MAGIC_LINK_SECRET, algorithms=['HS256'])
        if payload.get("type") == "magic_link":
            return payload.get("email")
        return None
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
