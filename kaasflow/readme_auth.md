# KaasFlow Professional Authentication Module

This module adds a production-grade authentication layer to your KaasFlow application, supporting Google OAuth 2.0, Email + Password (bcrypt), and Magic Link login.

## Features
- **Continue with Google**: Modern GIS integration.
- **Secure Email/Password**: Hashed with bcrypt, session via JWT.
- **Magic Link**: One-click passwordless login.
- **Secure Sessions**: Access & Refresh tokens in `httpOnly` cookies.
- **Security Built-in**: Rate limiting, CSRF protection ready, and production-grade hashing.

---

## 1. Google Cloud Console Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project** (or select an existing one).
3.  Go to **APIs & Services > Credentials**.
4.  Click **Create Credentials > OAuth client ID**.
5.  If prompted, configure the **OAuth consent screen**:
    - Choose **External**.
    - Add your app name and developer contact info.
    - Add scope `openid`, `email`, `profile`.
6.  For **Application type**, select **Web application**.
7.  Add **Authorized JavaScript origins**:
    - `http://localhost:5000`
    - (and your production domain)
8.  Add **Authorized redirect URIs**:
    - `http://localhost:5000/auth/magic-link/verify` (for magic links)
9.  Copy the **Client ID** and **Client Secret**.
10. Update your `.env` file with these values.

---

## 2. Integration Instructions

### New Backend Files
The module is located in `backend/auth/`. It is designed as a standalone plug-in.

### Activation Step
To activate the new auth routes without modifying your main logic, simply add these two lines to your `backend/app.py`:

```python
from auth import auth_bp
app.register_blueprint(auth_bp, url_prefix='/auth')
```

### Dependencies
Run the following to install the required libraries:
```bash
pip install bcrypt PyJWT requests python-dotenv
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env` and fill in the values:
- `JWT_SECRET`: A long random string.
- `SMTP_*`: Required for Magic Links to work. If not set, the API will return the link in the response JSON for development testing.

---

## 4. Frontend Usage

1.  Open `auth.html` in your browser.
2.  Replace `YOUR_GOOGLE_CLIENT_ID` in `auth.html` (line 197) with your actual Client ID.
3.  The auth system will set `access_token` and `refresh_token` as secure cookies upon successful login.

## 5. Security Notes
- **httpOnly Cookies**: Tokens are NOT accessible via JavaScript (XSS protection).
- **Rate Limiting**: Brute force protection is enabled (5 attempts / 5 mins).
- **Password Hashing**: Uses bcrypt with a workload Factor of 12 (standard).
- **Verification**: Google tokens are verified server-side via the tokeninfo endpoint.
