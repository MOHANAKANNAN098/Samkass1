from flask import Blueprint, request, jsonify, make_response
from datetime import timedelta
import os
import sqlite3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from .google_oauth import verify_google_token
from .jwt_handler import create_access_token, create_refresh_token, decode_token
from .password_handler import hash_password, verify_password
from .magic_link import generate_magic_link_token, verify_magic_link_token
from .rate_limiter import check_rate_limit, record_failed_attempt, clear_attempts

auth_bp = Blueprint('pro_auth', __name__)

DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'users.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_pro_auth_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS pro_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            google_id TEXT UNIQUE,
            full_name TEXT,
            profile_pic TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize the new table
init_pro_auth_db()

def send_email(to_email, subject, body):
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    
    if not all([smtp_host, smtp_user, smtp_pass]):
        print(f"SMTP not configured. Email to {to_email} would have been: {body}")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

@auth_bp.route('/google', methods=['POST'])
def google_auth():
    token = request.json.get('token')
    if not token:
        return jsonify({'error': 'Token missing'}), 400
        
    id_info = verify_google_token(token)
    if not id_info:
        return jsonify({'error': 'Invalid Google token'}), 401
        
    email = id_info.get('email')
    google_id = id_info.get('sub')
    name = id_info.get('name')
    picture = id_info.get('picture')
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM pro_users WHERE email = ?', (email,)).fetchone()
    
    if not user:
        conn.execute('INSERT INTO pro_users (email, google_id, full_name, profile_pic) VALUES (?, ?, ?, ?)',
                     (email, google_id, name, picture))
        conn.commit()
        user = conn.execute('SELECT * FROM pro_users WHERE email = ?', (email,)).fetchone()
    elif not user['google_id']:
        conn.execute('UPDATE pro_users SET google_id = ?, full_name = ?, profile_pic = ? WHERE email = ?',
                     (google_id, name, picture, email))
        conn.commit()
        user = conn.execute('SELECT * FROM pro_users WHERE email = ?', (email,)).fetchone()
        
    conn.close()
    
    return create_auth_response(user)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('financier_name', '')
    business = data.get('business_name', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
        
    conn = get_db_connection()
    existing = conn.execute('SELECT id FROM pro_users WHERE email = ?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'Email already registered'}), 409
        
    pw_hash = hash_password(password)
    conn.execute('INSERT INTO pro_users (email, password_hash, full_name) VALUES (?, ?, ?)',
                 (email, pw_hash, name))
    conn.commit()
    user = conn.execute('SELECT * FROM pro_users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    return create_auth_response(user)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    remember_me = data.get('remember_me', False)
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
        
    if not check_rate_limit(email):
        return jsonify({'error': 'Too many failed attempts. Please try again later.'}), 429
        
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM pro_users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    if user and user['password_hash'] and verify_password(password, user['password_hash']):
        clear_attempts(email)
        expiry = timedelta(days=30) if remember_me else timedelta(minutes=15)
        return create_auth_response(user, access_expiry=expiry)
    else:
        record_failed_attempt(email)
        return jsonify({'error': 'Invalid email or password'}), 401

@auth_bp.route('/magic-link/request', methods=['POST'])
def magic_link_request():
    email = request.json.get('email')
    if not email:
        return jsonify({'error': 'Email required'}), 400
        
    token = generate_magic_link_token(email)
    # In production, use your actual domain
    base_url = request.host_url.rstrip('/')
    magic_link = f"{base_url}/auth/magic-link/verify?token={token}"
    
    body = f"<h2>Login to KaasFlow</h2><p>Click the link below to sign in:</p><a href='{magic_link}'>Continue to App</a>"
    if send_email(email, "Your KaasFlow Magic Link", body):
        return jsonify({'message': 'Magic link sent to your email'})
    else:
        # For development, return the link in the response if email fails
        return jsonify({
            'message': 'Email service not configured. For development, here is your link:',
            'link': magic_link
        })

@auth_bp.route('/magic-link/verify', methods=['GET'])
def magic_link_verify():
    token = request.args.get('token')
    if not token:
        return "Missing token", 400
        
    email = verify_magic_link_token(token)
    if not email:
        return "Invalid or expired magic link", 401
        
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM pro_users WHERE email = ?', (email,)).fetchone()
    if not user:
        conn.execute('INSERT INTO pro_users (email) VALUES (?)', (email,))
        conn.commit()
        user = conn.execute('SELECT * FROM pro_users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    # For magic link, we redirect to the dashboard after setting cookies
    response = make_response("Redirecting...", 302)
    response.headers['Location'] = '/dashboard' # Or wherever the main app is
    
    access_token = create_access_token({"sub": user['email'], "id": user['id']})
    refresh_token = create_refresh_token({"sub": user['email'], "id": user['id']})
    
    response.set_cookie('access_token', access_token, httponly=True, secure=True, samesite='Strict')
    response.set_cookie('refresh_token', refresh_token, httponly=True, secure=True, samesite='Strict')
    
    return response

@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = jsonify({'message': 'Logged out successfully'})
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    return response

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({'error': 'Refresh token missing'}), 401
        
    payload = decode_token(refresh_token, is_refresh=True)
    if not payload:
        return jsonify({'error': 'Invalid refresh token'}), 401
        
    # Create new access token
    new_access_token = create_access_token({"sub": payload['sub'], "id": payload['id']})
    
    response = jsonify({'message': 'Token refreshed'})
    response.set_cookie('access_token', new_access_token, httponly=True, secure=True, samesite='Strict')
    return response

import uuid

def get_uuid_for_email(email):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, email))

def create_auth_response(user, access_expiry=None):
    user_uuid = get_uuid_for_email(user['email'])
    access_token = create_access_token({"sub": user['email'], "id": user_uuid}, expires_delta=access_expiry)
    refresh_token = create_refresh_token({"sub": user['email'], "id": user_uuid})
    
    response = jsonify({
        'success': True,
        'token': access_token,
        'user': {
            'email': user['email'],
            'name': user['full_name'],
            'picture': user['profile_pic']
        }
    })
    
    # Set cookies
    response.set_cookie('access_token', access_token, httponly=True, secure=True, samesite='Strict')
    response.set_cookie('refresh_token', refresh_token, httponly=True, secure=True, samesite='Strict')
    
    return response
