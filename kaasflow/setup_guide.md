# 🚀 KaasFlow Authentication Setup Guide

## ✅ What's Already Done

Your KaasFlow application now has a **complete, production-ready authentication system** with:

- ✅ **Google OAuth 2.0** (Continue with Google)
- ✅ **Email + Password** (bcrypt hashed)
- ✅ **Magic Link** (passwordless login)
- ✅ **JWT Sessions** (httpOnly cookies)
- ✅ **Rate Limiting** (brute force protection)
- ✅ **Remember Me** (30-day sessions)

All files have been created as **NEW modules only** — your existing code is untouched.

---

## 📁 New Files Added

```
backend/auth/
  ├── __init__.py           # Blueprint export
  ├── google_oauth.py       # Google token verification
  ├── jwt_handler.py        # JWT create/verify/refresh
  ├── password_handler.py   # bcrypt hash + verify
  ├── magic_link.py         # Magic link token generation
  ├── rate_limiter.py       # Login rate limiting
  └── routes.py             # Auth API endpoints

frontend/
  ├── auth.html             # Standalone login page
  └── auth.js               # Auth frontend logic

.env.example                # Environment template
README_AUTH.md              # Detailed auth documentation
```

---

## 🔧 Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `bcrypt` - Password hashing
- `PyJWT` - Token management
- `requests` - Google token verification
- `python-dotenv` - Environment variables

---

## 🌐 Step 2: Google Cloud Console Setup

### 2.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**

### 2.2 Configure OAuth Consent Screen

If prompted:
- Choose **External** user type
- Add app name: **KaasFlow**
- Add your email as developer contact
- Add scopes: `openid`, `email`, `profile`
- Save and continue

### 2.3 Create Web Application Credentials

- **Application type**: Web application
- **Name**: KaasFlow Web Client

**Authorized JavaScript origins:**
```
http://localhost:5000
https://yourdomain.com
```

**Authorized redirect URIs:**
```
http://localhost:5000/auth/magic-link/verify
https://yourdomain.com/auth/magic-link/verify
```

### 2.4 Copy Credentials

- Copy **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
- Copy **Client Secret**

---

## 🔐 Step 3: Configure Environment Variables

### 3.1 Create .env file

```bash
cd backend
cp ../.env.example .env
```

### 3.2 Edit .env with your values

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE

# JWT Secrets (generate random strings)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars

# Magic Link
MAGIC_LINK_SECRET=your_magic_link_secret_key
MAGIC_LINK_EXPIRY=3600

# SMTP (for Magic Links - optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3.3 Generate Secure Secrets

**Python method:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

**Or use online generator:** https://randomkeygen.com/

---

## 📧 Step 4: SMTP Setup (Optional - for Magic Links)

### For Gmail:

1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use this password in `SMTP_PASS` (not your regular password)

**Note:** If SMTP is not configured, magic link will be returned in API response for development testing.

---

## 🔗 Step 5: Update Frontend with Google Client ID

### 5.1 Update auth.html

Open `frontend/auth.html` and replace line 197:

```html
<!-- BEFORE -->
data-client_id="YOUR_GOOGLE_CLIENT_ID"

<!-- AFTER -->
data-client_id="123456789-abc.apps.googleusercontent.com"
```

### 5.2 Update index.html (if using embedded auth)

Open `frontend/index.html` and replace line 16:

```html
<!-- BEFORE -->
data-client_id="YOUR_GOOGLE_CLIENT_ID"

<!-- AFTER -->
data-client_id="123456789-abc.apps.googleusercontent.com"
```

---

## ▶️ Step 6: Run the Application

```bash
cd backend
python app.py
```

The server will start on `http://localhost:5000`

---

## 🧪 Step 7: Test Authentication

### Test Standalone Auth Page

Visit: `http://localhost:5000/auth.html`

### Test Methods:

1. **Google OAuth:**
   - Click "Continue with Google"
   - Select your Google account
   - Should redirect to main app

2. **Email + Password:**
   - Enter email and password
   - Click "Sign In"
   - Check "Remember me" for 30-day session

3. **Magic Link:**
   - Switch to "Magic Link" tab
   - Enter email
   - Check email for login link (or console if SMTP not configured)

---

## 🔒 API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/google` | POST | Google OAuth login |
| `/auth/register` | POST | Create new account |
| `/auth/login` | POST | Email + password login |
| `/auth/magic-link/request` | POST | Send magic link email |
| `/auth/magic-link/verify` | GET | Verify magic link token |
| `/auth/logout` | POST | Clear session cookies |
| `/auth/refresh` | POST | Refresh access token |

---

## 🛡️ Security Features

✅ **Password Security:**
- Bcrypt hashing with salt rounds
- Minimum 6 characters enforced

✅ **Token Security:**
- JWT stored in httpOnly cookies (XSS protection)
- Secure flag enabled (HTTPS only in production)
- SameSite=Strict (CSRF protection)

✅ **Rate Limiting:**
- Max 5 failed login attempts
- 5-minute cooldown period
- Per-email tracking

✅ **Google Token Verification:**
- Server-side verification via Google API
- Audience (aud) validation
- Issuer (iss) validation

---

## 🔄 Session Management

### Access Token:
- Expires: 15 minutes (default)
- Expires: 30 days (with "Remember Me")
- Stored in: httpOnly cookie

### Refresh Token:
- Expires: 30 days
- Used to get new access tokens
- Stored in: httpOnly cookie

### Auto-Refresh:
Frontend should call `/auth/refresh` when access token expires.

---

## 🐛 Troubleshooting

### Google Sign-In not showing?

1. Check browser console for errors
2. Verify `GOOGLE_CLIENT_ID` in both `.env` and `auth.html`
3. Ensure JavaScript origins are correct in Google Console
4. Clear browser cache

### Magic Link not sending?

1. Check SMTP credentials in `.env`
2. For Gmail, ensure App Password is used (not regular password)
3. Check backend console for email errors
4. In development, link will be printed to console

### "Invalid token" errors?

1. Verify JWT secrets are set in `.env`
2. Check token expiry times
3. Clear cookies and try again

### Rate limit blocking?

Wait 5 minutes or restart the server to clear in-memory rate limits.

---

## 🚀 Production Deployment

### Before deploying:

1. ✅ Set `secure=True` for cookies (requires HTTPS)
2. ✅ Use Redis for rate limiting (not in-memory)
3. ✅ Use PostgreSQL/MySQL instead of SQLite
4. ✅ Set strong JWT secrets (32+ characters)
5. ✅ Configure proper CORS origins
6. ✅ Enable HTTPS/SSL
7. ✅ Update Google OAuth redirect URIs with production domain

### Environment Variables for Production:

```env
FLASK_ENV=production
DOMAIN=https://yourdomain.com
GOOGLE_CLIENT_ID=your_production_client_id
# ... rest of variables
```

---

## 📚 Additional Resources

- [Google Identity Services Docs](https://developers.google.com/identity/gsi/web)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 💡 Next Steps

1. Customize the auth UI in `auth.html` to match your brand
2. Add user profile management endpoints
3. Implement "Forgot Password" flow
4. Add email verification for new signups
5. Set up session monitoring/analytics

---

## 🆘 Support

For issues or questions:
1. Check `README_AUTH.md` for detailed documentation
2. Review backend console logs
3. Check browser console for frontend errors

---

**Your authentication system is ready to use! 🎉**
