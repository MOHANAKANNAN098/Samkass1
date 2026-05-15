# 🚀 KaasFlow Auth - Production Deployment Checklist

## Pre-Deployment Security Audit

### ✅ Environment Variables

- [ ] All secrets are 32+ characters long
- [ ] JWT_SECRET is different from JWT_REFRESH_SECRET
- [ ] No default/example values in production .env
- [ ] .env file is in .gitignore
- [ ] Environment variables are set in hosting platform (not in code)

```bash
# Generate new production secrets
python -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(32))"
python -c "import secrets; print('JWT_REFRESH_SECRET=' + secrets.token_urlsafe(32))"
python -c "import secrets; print('MAGIC_LINK_SECRET=' + secrets.token_urlsafe(32))"
```

---

### ✅ Google OAuth Configuration

- [ ] Production domain added to Authorized JavaScript origins
- [ ] Production domain added to Authorized redirect URIs
- [ ] OAuth consent screen is configured
- [ ] Privacy policy URL added (if public app)
- [ ] Terms of service URL added (if public app)
- [ ] Client ID updated in frontend files
- [ ] Client Secret stored securely (not in code)

**Google Console URLs to add:**
```
https://yourdomain.com
https://www.yourdomain.com
https://yourdomain.com/auth/magic-link/verify
```

---

### ✅ Cookie Security

Update `backend/auth/routes.py` for production:

```python
# In create_auth_response() function
response.set_cookie(
    'access_token', 
    access_token, 
    httponly=True, 
    secure=True,              # ✅ HTTPS only
    samesite='Strict',        # ✅ CSRF protection
    domain='yourdomain.com'   # ✅ Set your domain
)
```

- [ ] `secure=True` enabled (requires HTTPS)
- [ ] `httponly=True` enabled (XSS protection)
- [ ] `samesite='Strict'` enabled (CSRF protection)
- [ ] Domain set correctly for production

---

### ✅ HTTPS/SSL

- [ ] SSL certificate installed
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Certificate auto-renewal configured
- [ ] Mixed content warnings resolved

**Flask HTTPS redirect:**
```python
from flask import request, redirect

@app.before_request
def before_request():
    if not request.is_secure and app.env == 'production':
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)
```

---

### ✅ CORS Configuration

Update `backend/app.py`:

```python
from flask_cors import CORS

# ❌ Development (too permissive)
# CORS(app)

# ✅ Production (restricted)
CORS(app, 
     origins=['https://yourdomain.com', 'https://www.yourdomain.com'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE'])
```

- [ ] CORS origins restricted to your domain only
- [ ] `supports_credentials=True` for cookies
- [ ] Wildcard (*) origins removed

---

### ✅ Rate Limiting

**Upgrade to Redis for production:**

```python
# Install redis
pip install redis

# backend/auth/rate_limiter.py
import redis
import time

redis_client = redis.Redis(
    host=os.environ.get('REDIS_HOST', 'localhost'),
    port=int(os.environ.get('REDIS_PORT', 6379)),
    db=0,
    decode_responses=True
)

def check_rate_limit(key: str) -> bool:
    now = int(time.time())
    window_key = f"rate_limit:{key}:{now // 300}"  # 5-min window
    
    count = redis_client.incr(window_key)
    if count == 1:
        redis_client.expire(window_key, 300)
    
    return count <= 5
```

- [ ] Redis installed and configured
- [ ] Rate limiter uses Redis (not in-memory)
- [ ] Rate limits tested under load
- [ ] Different limits for different endpoints

---

### ✅ Database

**Migrate from SQLite to PostgreSQL/MySQL:**

```python
# Install PostgreSQL adapter
pip install psycopg2-binary

# Update connection
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(
        host=os.environ.get('DB_HOST'),
        database=os.environ.get('DB_NAME'),
        user=os.environ.get('DB_USER'),
        password=os.environ.get('DB_PASSWORD'),
        cursor_factory=RealDictCursor
    )
```

- [ ] Production database configured (PostgreSQL/MySQL)
- [ ] Database credentials secured
- [ ] Connection pooling enabled
- [ ] Database backups automated
- [ ] SSL connection to database enabled

---

### ✅ Email Service

**Use production SMTP or service like SendGrid:**

```python
# Option 1: SendGrid
pip install sendgrid

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_email(to_email, subject, body):
    message = Mail(
        from_email='noreply@yourdomain.com',
        to_emails=to_email,
        subject=subject,
        html_content=body
    )
    
    sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    sg.send(message)
```

- [ ] Production SMTP configured (not Gmail)
- [ ] SPF/DKIM records configured
- [ ] Email templates professional
- [ ] Unsubscribe links added (if marketing emails)
- [ ] Rate limiting on email sending

---

### ✅ Logging & Monitoring

```python
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
handler = RotatingFileHandler('auth.log', maxBytes=10000000, backupCount=5)
handler.setLevel(logging.INFO)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)
app.logger.addHandler(handler)

# Log important events
@auth_bp.route('/login', methods=['POST'])
def login():
    app.logger.info(f"Login attempt: {email} from {request.remote_addr}")
    # ... rest of code
```

- [ ] Application logging configured
- [ ] Error tracking service integrated (Sentry, Rollbar)
- [ ] Login attempts logged
- [ ] Failed auth attempts monitored
- [ ] Log rotation configured
- [ ] Sensitive data not logged (passwords, tokens)

---

### ✅ Security Headers

```python
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response
```

- [ ] Security headers added
- [ ] CSP policy configured
- [ ] HSTS enabled
- [ ] X-Frame-Options set

---

### ✅ Input Validation

```python
from email_validator import validate_email, EmailNotValidError

@auth_bp.route('/register', methods=['POST'])
def register():
    email = request.json.get('email')
    
    # Validate email
    try:
        valid = validate_email(email)
        email = valid.email
    except EmailNotValidError:
        return jsonify({'error': 'Invalid email'}), 400
    
    # Validate password strength
    password = request.json.get('password')
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    # ... rest of code
```

- [ ] Email validation added
- [ ] Password strength requirements enforced
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] File upload validation (if applicable)

---

### ✅ Token Management

```python
# Shorter access token expiry in production
def create_access_token(data: dict, expires_delta: timedelta = None):
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)  # ✅ 15 min
    # ... rest of code
```

- [ ] Access token expiry: 15 minutes (not longer)
- [ ] Refresh token expiry: 30 days max
- [ ] Token blacklist implemented (for logout)
- [ ] Token rotation on refresh

---

### ✅ Error Handling

```python
@app.errorhandler(Exception)
def handle_error(error):
    app.logger.error(f"Unhandled error: {error}")
    
    # Don't expose internal errors to users
    return jsonify({
        'error': 'An internal error occurred'
    }), 500

@auth_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Authentication required'}), 401
```

- [ ] Generic error messages (don't expose internals)
- [ ] All exceptions caught and logged
- [ ] 404 page customized
- [ ] 500 page customized

---

### ✅ Performance

```python
# Add caching
from flask_caching import Cache

cache = Cache(app, config={
    'CACHE_TYPE': 'redis',
    'CACHE_REDIS_URL': os.environ.get('REDIS_URL')
})

@app.route('/api/public-data')
@cache.cached(timeout=300)  # Cache for 5 minutes
def public_data():
    return jsonify({'data': 'cached'})
```

- [ ] Database queries optimized
- [ ] Indexes added to database
- [ ] Caching implemented (Redis)
- [ ] Static files served via CDN
- [ ] Gzip compression enabled

---

### ✅ Compliance

- [ ] Privacy policy created and linked
- [ ] Terms of service created and linked
- [ ] GDPR compliance (if EU users)
  - [ ] Data export functionality
  - [ ] Account deletion functionality
  - [ ] Cookie consent banner
- [ ] CCPA compliance (if California users)
- [ ] Data retention policy defined

---

## Deployment Steps

### 1. Pre-Deployment Testing

```bash
# Run all tests
python -m pytest tests/

# Check for security vulnerabilities
pip install safety
safety check

# Check code quality
pip install pylint
pylint backend/
```

- [ ] All tests pass
- [ ] No security vulnerabilities
- [ ] Code quality checks pass

---

### 2. Environment Setup

```bash
# Set production environment variables
export FLASK_ENV=production
export DOMAIN=https://yourdomain.com
export GOOGLE_CLIENT_ID=prod_client_id
# ... all other variables
```

- [ ] All environment variables set
- [ ] No development values in production
- [ ] Secrets stored in secure vault (AWS Secrets Manager, etc.)

---

### 3. Database Migration

```bash
# Backup existing database
pg_dump kaasflow > backup_$(date +%Y%m%d).sql

# Run migrations
python migrate.py
```

- [ ] Database backed up
- [ ] Migrations tested on staging
- [ ] Rollback plan ready

---

### 4. Deploy Application

```bash
# Build and deploy
git push production main

# Or with Docker
docker build -t kaasflow:latest .
docker push registry.example.com/kaasflow:latest
```

- [ ] Application deployed
- [ ] Health check endpoint responding
- [ ] Logs accessible

---

### 5. Post-Deployment Verification

```bash
# Test authentication endpoints
curl https://yourdomain.com/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test Google OAuth
# (Use browser to test)

# Test magic link
curl https://yourdomain.com/auth/magic-link/request \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

- [ ] Login works
- [ ] Google OAuth works
- [ ] Magic link works
- [ ] Logout works
- [ ] Token refresh works
- [ ] Rate limiting works
- [ ] HTTPS enforced
- [ ] Cookies set correctly

---

### 6. Monitoring Setup

```bash
# Set up monitoring alerts
# - Failed login attempts > 100/hour
# - Error rate > 1%
# - Response time > 1s
# - Database connection errors
```

- [ ] Uptime monitoring configured
- [ ] Error alerts configured
- [ ] Performance monitoring active
- [ ] Log aggregation working

---

## Rollback Plan

If something goes wrong:

```bash
# 1. Revert to previous version
git revert HEAD
git push production main

# 2. Restore database backup
psql kaasflow < backup_20240101.sql

# 3. Clear Redis cache
redis-cli FLUSHALL

# 4. Verify rollback
curl https://yourdomain.com/health
```

- [ ] Rollback procedure documented
- [ ] Rollback tested on staging
- [ ] Team knows rollback process

---

## Post-Launch Checklist

### Week 1

- [ ] Monitor error rates daily
- [ ] Check login success rates
- [ ] Review security logs
- [ ] Verify email delivery rates
- [ ] Check database performance

### Week 2-4

- [ ] Analyze user feedback
- [ ] Review authentication metrics
- [ ] Optimize slow queries
- [ ] Update documentation
- [ ] Plan improvements

---

## Security Incident Response

If a security issue is discovered:

1. **Immediate Actions:**
   - [ ] Rotate all JWT secrets
   - [ ] Invalidate all sessions
   - [ ] Force password reset for affected users
   - [ ] Block suspicious IPs

2. **Investigation:**
   - [ ] Review logs for breach extent
   - [ ] Identify affected users
   - [ ] Document timeline

3. **Communication:**
   - [ ] Notify affected users
   - [ ] Update security advisory
   - [ ] Report to authorities (if required)

4. **Prevention:**
   - [ ] Patch vulnerability
   - [ ] Add monitoring
   - [ ] Update security policies

---

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor login success rate
- [ ] Review security alerts

### Weekly
- [ ] Database backup verification
- [ ] Performance metrics review
- [ ] Security updates check

### Monthly
- [ ] Dependency updates
- [ ] Security audit
- [ ] Load testing
- [ ] Disaster recovery drill

---

## Performance Benchmarks

Target metrics for production:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Login response time | < 200ms | > 500ms |
| Token refresh time | < 100ms | > 300ms |
| Database query time | < 50ms | > 200ms |
| Error rate | < 0.1% | > 1% |
| Uptime | > 99.9% | < 99% |

---

## Support Contacts

- **Hosting Provider:** [Contact info]
- **Database Admin:** [Contact info]
- **Security Team:** [Contact info]
- **On-Call Engineer:** [Contact info]

---

## Final Sign-Off

- [ ] All checklist items completed
- [ ] Deployment approved by: _______________
- [ ] Date deployed: _______________
- [ ] Deployment notes: _______________

---

**🎉 Congratulations on your production deployment!**

Remember to:
- Monitor closely for the first 48 hours
- Keep this checklist updated
- Document any issues and resolutions
- Celebrate with your team! 🚀
