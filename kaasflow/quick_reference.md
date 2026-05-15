# 🎯 KaasFlow Auth - Quick Reference Card

## 🚀 Quick Start (3 Steps)

```bash
# 1. Install dependencies
cd backend && pip install -r requirements.txt

# 2. Configure Google Client ID
python ../configure_auth.py YOUR_GOOGLE_CLIENT_ID

# 3. Run the app
python app.py
```

Visit: `http://localhost:5000/auth.html`

---

## 📋 Environment Variables

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
JWT_SECRET=random_32_char_string
JWT_REFRESH_SECRET=another_random_32_char_string
MAGIC_LINK_SECRET=magic_link_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🔗 API Endpoints

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/auth/register` | POST | `{email, password, financier_name}` | Sets cookies, returns user |
| `/auth/login` | POST | `{email, password, remember_me}` | Sets cookies, returns user |
| `/auth/google` | POST | `{token}` | Sets cookies, returns user |
| `/auth/magic-link/request` | POST | `{email}` | Sends email with link |
| `/auth/magic-link/verify` | GET | `?token=...` | Redirects + sets cookies |
| `/auth/refresh` | POST | Uses cookies | Updates access token |
| `/auth/logout` | POST | Uses cookies | Clears cookies |

---

## 💻 Frontend Integration

### Check if User is Logged In

```javascript
async function checkAuth() {
  const response = await fetch('/auth/verify', {
    credentials: 'include' // Important: sends cookies
  });
  return response.ok;
}
```

### Login with Email/Password

```javascript
async function login(email, password, rememberMe = false) {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, remember_me: rememberMe })
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('Logged in:', data.user);
    window.location.href = '/'; // Redirect to app
  } else {
    const error = await response.json();
    console.error('Login failed:', error.error);
  }
}
```

### Google Sign-In Callback

```javascript
async function handleCredentialResponse(response) {
  const res = await fetch('/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token: response.credential })
  });
  
  if (res.ok) {
    window.location.href = '/';
  }
}
```

### Auto-Refresh Token

```javascript
// Call this every 14 minutes (before 15-min expiry)
async function refreshToken() {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  
  if (!response.ok) {
    // Refresh failed, redirect to login
    window.location.href = '/auth.html';
  }
}

// Set up auto-refresh
setInterval(refreshToken, 14 * 60 * 1000); // 14 minutes
```

### Logout

```javascript
async function logout() {
  await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  window.location.href = '/auth.html';
}
```

---

## 🐍 Backend Integration

### Protect Routes (Middleware)

```python
from functools import wraps
from flask import request, jsonify
from auth.jwt_handler import decode_token

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get('access_token')
        
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user info to request
        request.user_id = payload['id']
        request.user_email = payload['sub']
        
        return f(*args, **kwargs)
    return decorated_function
```

### Use Protected Route

```python
@app.route('/api/loans')
@require_auth
def get_loans():
    user_id = request.user_id
    # Fetch loans for this user
    return jsonify({'loans': []})
```

### Get Current User

```python
from auth.jwt_handler import decode_token

def get_current_user():
    token = request.cookies.get('access_token')
    if not token:
        return None
    
    payload = decode_token(token)
    if not payload:
        return None
    
    # Fetch user from database
    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM pro_users WHERE id = ?',
        (payload['id'],)
    ).fetchone()
    conn.close()
    
    return user
```

---

## 🗄️ Database Queries

### Get User by Email

```python
import sqlite3

conn = sqlite3.connect('backend/users.db')
conn.row_factory = sqlite3.Row

user = conn.execute(
    'SELECT * FROM pro_users WHERE email = ?',
    ('user@example.com',)
).fetchone()

conn.close()
```

### Update User Profile

```python
conn = sqlite3.connect('backend/users.db')

conn.execute(
    'UPDATE pro_users SET full_name = ?, profile_pic = ? WHERE id = ?',
    ('New Name', 'https://example.com/pic.jpg', user_id)
)

conn.commit()
conn.close()
```

### Check if Email Exists

```python
conn = sqlite3.connect('backend/users.db')

exists = conn.execute(
    'SELECT 1 FROM pro_users WHERE email = ?',
    ('user@example.com',)
).fetchone() is not None

conn.close()
```

---

## 🔐 Security Best Practices

### Generate Secure Secrets

```python
import secrets

# Generate JWT secret
jwt_secret = secrets.token_urlsafe(32)
print(f"JWT_SECRET={jwt_secret}")

# Generate refresh secret
refresh_secret = secrets.token_urlsafe(32)
print(f"JWT_REFRESH_SECRET={refresh_secret}")

# Generate magic link secret
magic_secret = secrets.token_urlsafe(32)
print(f"MAGIC_LINK_SECRET={magic_secret}")
```

### Hash Password Manually

```python
from auth.password_handler import hash_password, verify_password

# Hash a password
hashed = hash_password("mypassword123")
print(hashed)  # $2b$12$...

# Verify password
is_valid = verify_password("mypassword123", hashed)
print(is_valid)  # True
```

### Create Custom JWT

```python
from auth.jwt_handler import create_access_token
from datetime import timedelta

# Create token with custom expiry
token = create_access_token(
    data={"sub": "user@example.com", "id": 123},
    expires_delta=timedelta(hours=1)
)
```

---

## 🧪 Testing Commands

```bash
# Test registration
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -c cookies.txt

# Test protected route (with cookies)
curl http://localhost:5000/api/protected \
  -b cookies.txt

# Test logout
curl -X POST http://localhost:5000/auth/logout \
  -b cookies.txt
```

---

## 🐛 Debug Mode

### Enable Detailed Logging

```python
# Add to backend/app.py
import logging

logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)
```

### Print Token Contents

```python
from auth.jwt_handler import decode_token

token = "eyJ..."
payload = decode_token(token)
print(payload)
# {'sub': 'user@example.com', 'id': 1, 'exp': 1234567890, 'type': 'access'}
```

### Check Cookie Values

```javascript
// In browser console
document.cookie.split(';').forEach(c => console.log(c.trim()));
```

---

## 📱 Mobile/API Integration

### Get Token for Mobile App

Instead of cookies, return token in response:

```python
@auth_bp.route('/mobile/login', methods=['POST'])
def mobile_login():
    # ... validate credentials ...
    
    access_token = create_access_token({"sub": email, "id": user_id})
    refresh_token = create_refresh_token({"sub": email, "id": user_id})
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer'
    })
```

### Use Token in Mobile App

```javascript
// Store tokens securely (e.g., SecureStorage)
const accessToken = "eyJ...";

// Send with requests
fetch('/api/loans', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## 🔄 Migration from Old Auth

If you have existing users:

```python
# Migrate old users to new auth system
import sqlite3
from auth.password_handler import hash_password

old_conn = sqlite3.connect('old_users.db')
new_conn = sqlite3.connect('backend/users.db')

old_users = old_conn.execute('SELECT * FROM users').fetchall()

for user in old_users:
    # Hash existing passwords if they're plain text
    hashed_pw = hash_password(user['password'])
    
    new_conn.execute(
        'INSERT INTO pro_users (email, password_hash, full_name) VALUES (?, ?, ?)',
        (user['email'], hashed_pw, user['name'])
    )

new_conn.commit()
```

---

## 📊 Monitoring

### Track Login Attempts

```python
# Add to backend/auth/routes.py
import logging

@auth_bp.route('/login', methods=['POST'])
def login():
    email = request.json.get('email')
    
    # Log attempt
    logging.info(f"Login attempt for {email} from {request.remote_addr}")
    
    # ... rest of login logic ...
```

### Count Active Sessions

```python
# Count users logged in last 24 hours
from datetime import datetime, timedelta

conn = sqlite3.connect('backend/users.db')
cutoff = datetime.now() - timedelta(days=1)

# You'd need to add a last_login column first
active_users = conn.execute(
    'SELECT COUNT(*) FROM pro_users WHERE last_login > ?',
    (cutoff,)
).fetchone()[0]

print(f"Active users: {active_users}")
```

---

## 🎨 Customize Auth UI

### Change Colors

Edit `frontend/auth.html` CSS variables:

```css
:root {
    --primary: #6366f1;        /* Change to your brand color */
    --primary-hover: #4f46e5;
    --bg-dark: #0f172a;
    --card-bg: rgba(30, 41, 59, 0.7);
}
```

### Add Logo

```html
<!-- In auth.html, replace the logo div -->
<div class="logo">
    <img src="/logo.png" alt="KaasFlow" style="height: 40px;">
</div>
```

---

## 🆘 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid Google token` | Client ID mismatch | Check `.env` and `auth.html` |
| `Too many failed attempts` | Rate limit hit | Wait 5 min or restart server |
| `Invalid or expired token` | Token expired | Call `/auth/refresh` |
| `Email already registered` | Duplicate email | Use different email or login |
| `SMTP error` | Wrong credentials | Check Gmail App Password |

---

**Need more help? Check:**
- `SETUP_GUIDE.md` - Complete setup instructions
- `TESTING_GUIDE.md` - Comprehensive testing guide
- `README_AUTH.md` - Detailed documentation

---

**Quick Links:**
- [Google Cloud Console](https://console.cloud.google.com/)
- [Gmail App Passwords](https://myaccount.google.com/apppasswords)
- [JWT Debugger](https://jwt.io/)
- [Random Key Generator](https://randomkeygen.com/)
