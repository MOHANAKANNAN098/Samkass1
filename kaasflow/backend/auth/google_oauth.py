import requests
import os

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')

def verify_google_token(token: str):
    """
    Verify the Google ID token using Google's tokeninfo endpoint.
    Returns the user information if the token is valid, else None.
    """
    try:
        # Verify the ID token via Google's API
        response = requests.get(
            f'https://oauth2.googleapis.com/tokeninfo?id_token={token}',
            timeout=5
        )
        
        if response.status_code != 200:
            return None
            
        id_info = response.json()
        
        # Verify audience (aud) matches our Client ID
        if id_info.get('aud') != GOOGLE_CLIENT_ID:
            return None
            
        # Optional: Check issuer (iss)
        if id_info.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
            return None
            
        return id_info
    except Exception as e:
        print(f"Error verifying Google token: {e}")
        return None
