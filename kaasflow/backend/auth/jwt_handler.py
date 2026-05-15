import jwt
import os
from datetime import datetime, timedelta

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-default-secret-key-change-me')
JWT_REFRESH_SECRET = os.environ.get('JWT_REFRESH_SECRET', 'your-default-refresh-secret-key-change-me')
ALGORITHM = 'HS256'

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: timedelta = None):
    """Create a new JWT refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=30)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_REFRESH_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str, is_refresh: bool = False):
    """Decode and verify a JWT token."""
    secret = JWT_REFRESH_SECRET if is_refresh else JWT_SECRET
    try:
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
