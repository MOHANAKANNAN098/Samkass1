# 🧪 KaasFlow Authentication Testing Guide

## Quick Start Testing

### 1. Start the Server
```bash
cd backend
python app.py
```

Server should start on `http://localhost:5000`

---

## 🌐 Browser Testing

### Test 1: Standalone Auth Page
```
http://localhost:5000/auth.html
```

**Expected:**
- Clean login interface
- Google Sign-In button visible
- Email/Password form
- Magic Link tab

### Test 2: Embedded Auth (in main app)
```
http://localhost:5000/
```

**Expected:**
- Shows auth screen if not logged in
- Shows main app if logged in

---

## 🔧 API Testing with cURL

### Test 3: Register New User

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "financier_name": "John Doe",
    "business_name": "Doe Finance"
  }' \
  -c cookies.txt \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "email": "test@example.com",
    "name": "John Doe",
    "picture": null
  }
}
```

**Check:**
- Response includes `Set-Cookie` headers
- Cookies: `access_token` and `refresh_token`
- Both should have `HttpOnly; Secure; SameSite=Strict`

---

### Test 4: Login with Email + Password

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "remember_me": false
  }' \
  -c cookies.txt \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "email": "test@example.com",
    "name": "John Doe",
    "picture": null
  }
}
```

---

### Test 5: Login with Remember Me

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "remember_me": true
  }' \
  -c cookies.txt \
  -v
```

**Check:**
- Access token should have longer expiry (30 days)

---

### Test 6: Failed Login (Wrong Password)

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }' \
  -v
```

**Expected Response:**
```json
{
  "error": "Invalid email or password"
}
```

**Status Code:** 401

---

### Test 7: Rate Limiting (Brute Force Protection)

Run this 6 times quickly:

```bash
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:5000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "wrong"
    }'
  echo ""
done
```

**Expected:**
- First 5 attempts: "Invalid email or password"
- 6th attempt: "Too many failed attempts. Please try again later."
- Status Code: 429 (Too Many Requests)

---

### Test 8: Request Magic Link

```bash
curl -X POST http://localhost:5000/auth/magic-link/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }' \
  -v
```

**Expected Response (if SMTP configured):**
```json
{
  "message": "Magic link sent to your email"
}
```

**Expected Response (if SMTP not configured):**
```json
{
  "message": "Email service not configured. For development, here is your link:",
  "link": "http://localhost:5000/auth/magic-link/verify?token=eyJ..."
}
```

**Check backend console** for the magic link URL.

---

### Test 9: Verify Magic Link

Copy the token from Test 8 and visit in browser:
```
http://localhost:5000/auth/magic-link/verify?token=YOUR_TOKEN_HERE
```

**Expected:**
- Redirects to `/dashboard` (or main app)
- Sets authentication cookies
- Status Code: 302 (Redirect)

---

### Test 10: Refresh Access Token

```bash
curl -X POST http://localhost:5000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

**Expected Response:**
```json
{
  "message": "Token refreshed"
}
```

**Check:**
- New `access_token` cookie is set
- `refresh_token` remains the same

---

### Test 11: Logout

```bash
curl -X POST http://localhost:5000/auth/logout \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

**Expected Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Check:**
- Cookies are cleared (Max-Age=0)

---

## 🔐 Google OAuth Testing

### Test 12: Google Sign-In (Browser Only)

1. Open `http://localhost:5000/auth.html`
2. Click "Continue with Google"
3. Select your Google account
4. Grant permissions

**Expected:**
- Success message appears
- Redirects to main app
- Cookies are set

**Backend Verification:**
```bash
# Check if user was created in database
sqlite3 backend/users.db "SELECT * FROM pro_users WHERE google_id IS NOT NULL;"
```

---

## 🛡️ Security Testing

### Test 13: XSS Protection (httpOnly cookies)

Open browser console on `http://localhost:5000/auth.html` and try:

```javascript
document.cookie
```

**Expected:**
- Should NOT see `access_token` or `refresh_token`
- Cookies are httpOnly and not accessible via JavaScript

---

### Test 14: CSRF Protection

Try accessing protected endpoint from different origin:

```bash
curl -X POST http://localhost:5000/auth/logout \
  -H "Origin: http://evil.com" \
  -b cookies.txt \
  -v
```

**Expected:**
- Should fail due to SameSite=Strict cookie policy

---

### Test 15: Token Expiry

1. Login and get tokens
2. Wait 16 minutes (access token expires in 15 min)
3. Try to use the access token

**Expected:**
- Access token should be expired
- Need to call `/auth/refresh` to get new token

---

### Test 16: Invalid Token

```bash
curl -X POST http://localhost:5000/auth/refresh \
  --cookie "refresh_token=invalid_token_here" \
  -v
```

**Expected Response:**
```json
{
  "error": "Invalid refresh token"
}
```

**Status Code:** 401

---

## 📊 Database Verification

### Check Users Table

```bash
cd backend
sqlite3 users.db
```

```sql
-- View all users
SELECT * FROM pro_users;

-- Count users by auth method
SELECT 
  COUNT(*) as total,
  COUNT(google_id) as google_users,
  COUNT(password_hash) as password_users
FROM pro_users;

-- View recent registrations
SELECT email, created_at FROM pro_users ORDER BY created_at DESC LIMIT 5;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Google Sign-In button not showing

**Check:**
```bash
# Verify Client ID in auth.html
grep "data-client_id" frontend/auth.html

# Should show your actual Client ID, not "YOUR_GOOGLE_CLIENT_ID"
```

**Fix:**
```bash
python configure_auth.py YOUR_CLIENT_ID
```

---

### Issue 2: "Invalid Google token" error

**Check:**
1. Client ID in `.env` matches Google Console
2. JavaScript origins are correct in Google Console
3. Token is being sent correctly

**Debug:**
```python
# Add to backend/auth/google_oauth.py
print(f"Received token: {token[:50]}...")
print(f"Expected Client ID: {GOOGLE_CLIENT_ID}")
```

---

### Issue 3: Magic link not sending

**Check SMTP config:**
```bash
# Test SMTP connection
python -c "
import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

smtp_host = os.getenv('SMTP_HOST')
smtp_port = int(os.getenv('SMTP_PORT', 587))
smtp_user = os.getenv('SMTP_USER')
smtp_pass = os.getenv('SMTP_PASS')

print(f'Connecting to {smtp_host}:{smtp_port}...')
server = smtplib.SMTP(smtp_host, smtp_port)
server.starttls()
server.login(smtp_user, smtp_pass)
print('✅ SMTP connection successful!')
server.quit()
"
```

---

### Issue 4: Rate limiting too aggressive

**Temporary fix (development only):**
```python
# Edit backend/auth/rate_limiter.py
MAX_ATTEMPTS = 10  # Increase from 5
BLOCK_TIME = 60    # Reduce from 300
```

**Or clear rate limits:**
```bash
# Restart the server to clear in-memory rate limits
```

---

## ✅ Complete Test Checklist

- [ ] Register new user works
- [ ] Login with correct password works
- [ ] Login with wrong password fails
- [ ] Rate limiting blocks after 5 attempts
- [ ] Remember me extends session
- [ ] Magic link request works
- [ ] Magic link verify works
- [ ] Google Sign-In works
- [ ] Logout clears cookies
- [ ] Refresh token works
- [ ] Expired token is rejected
- [ ] httpOnly cookies not accessible via JS
- [ ] User data stored in database correctly

---

## 📈 Performance Testing

### Load Test Login Endpoint

```bash
# Install Apache Bench
# Ubuntu: sudo apt-get install apache2-utils
# Mac: brew install ab

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 -p login.json -T application/json http://localhost:5000/auth/login
```

**login.json:**
```json
{"email":"test@example.com","password":"test123"}
```

**Expected:**
- All requests should complete
- Average response time < 100ms
- No failed requests

---

## 🎯 Production Readiness Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] HTTPS enabled
- [ ] Strong JWT secrets (32+ chars)
- [ ] SMTP configured for magic links
- [ ] Google OAuth redirect URIs updated
- [ ] Rate limiting tested
- [ ] Database backed up
- [ ] Error logging configured
- [ ] CORS origins restricted
- [ ] Cookie secure flag enabled

---

**Happy Testing! 🚀**
