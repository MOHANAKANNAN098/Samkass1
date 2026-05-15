from flask import Blueprint, request, jsonify
from utils.supabase_client import supabase
from utils.pin_utils import hash_pin, verify_pin
from datetime import datetime, timedelta
import traceback

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    phone_number = data.get('phone_number')
    finance_name = data.get('finance_name')
    app_pin = data.get('app_pin')

    if not all([email, password, full_name, phone_number, finance_name, app_pin]):
        return jsonify({'error': 'All fields are required'}), 400

    try:
        # 1. Sign up user in Supabase Auth
        auth_res = supabase.auth.sign_up({
            "email": email,
            "password": password
        })

        user = auth_res.user
        if not user:
            return jsonify({'error': 'Signup failed in Supabase Auth'}), 400

        # 2. Insert into users table
        hashed_pin = hash_pin(app_pin)
        supabase.table('users').insert({
            'id': user.id,
            'full_name': full_name,
            'phone_number': phone_number,
            'email': email,
            'finance_name': finance_name,
            'app_pin': hashed_pin
        }).execute()

        return jsonify({
            'message': 'Account created successfully',
            'session': auth_res.session.model_dump() if auth_res.session else None,
            'user': user.model_dump()
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        auth_res = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        user = auth_res.user
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
            
        return jsonify({
            'message': 'Login successful. PIN verification required.',
            'session': auth_res.session.model_dump() if auth_res.session else None,
            'user': user.model_dump()
        }), 200

    except Exception as e:
        return jsonify({'error': 'Invalid credentials or login failed'}), 401

@auth_bp.route('/verify-pin', methods=['POST'])
def verify_pin_route():
    data = request.json
    user_id = data.get('user_id')
    pin = data.get('pin')

    if not user_id or not pin:
        return jsonify({'error': 'User ID and PIN are required'}), 400

    try:
        response = supabase.table('users').select('app_pin, pin_attempts, pin_locked_until').eq('id', user_id).execute()
        if not response.data:
            return jsonify({'error': 'User profile not found'}), 404
            
        user_data = response.data[0]
        
        # 1. Check if account is currently locked out
        if user_data.get('pin_locked_until'):
            locked_until = datetime.fromisoformat(user_data['pin_locked_until'])
            if datetime.utcnow() < locked_until:
                return jsonify({'error': 'Account locked. Try again later.'}), 403
            else:
                # Lockout expired, reset attempts
                supabase.table('users').update({'pin_locked_until': None, 'pin_attempts': 0}).eq('id', user_id).execute()

        # 2. Verify entered PIN
        is_valid = verify_pin(pin, user_data['app_pin'])
        
        if is_valid:
            # Success: Reset attempts
            supabase.table('users').update({'pin_attempts': 0, 'pin_locked_until': None}).eq('id', user_id).execute()
            return jsonify({'message': 'PIN verified successfully'}), 200
        else:
            # Failed: Increment attempts
            attempts = (user_data.get('pin_attempts') or 0) + 1
            updates = {'pin_attempts': attempts}
            
            if attempts >= 3:
                # Lock for 15 minutes after 3 failed attempts
                lock_time = datetime.utcnow() + timedelta(minutes=15)
                updates['pin_locked_until'] = lock_time.isoformat()
                supabase.table('users').update(updates).eq('id', user_id).execute()
                return jsonify({'error': 'Too many failed attempts. Account locked for 15 minutes.'}), 403
                
            supabase.table('users').update(updates).eq('id', user_id).execute()
            return jsonify({'error': f'Invalid PIN. {3 - attempts} attempts remaining.'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    try:
        supabase.auth.reset_password_email(email)
        return jsonify({'message': 'OTP sent to email successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    if not email or not otp:
        return jsonify({'error': 'Email and OTP are required'}), 400
    try:
        res = supabase.auth.verify_otp({"email": email, "token": otp, "type": "recovery"})
        if not res.user:
            return jsonify({'error': 'Invalid or expired OTP'}), 401
        return jsonify({'message': 'OTP verified successfully', 'session': res.session.model_dump() if res.session else None}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500