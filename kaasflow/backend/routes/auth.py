import hashlib
import os
import jwt
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models.user import get_user_by_phone, create_user, update_pin, phone_exists

auth_bp = Blueprint('auth', __name__)

JWT_SECRET = os.environ.get('JWT_SECRET', 'kaasflow-secret-key-change-in-production')
JWT_EXPIRY_HOURS = 24 * 7  # 7 days


def hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()


def generate_token(phone: str, role: str) -> str:
    payload = {
        'phone': phone,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        phone = (data.get('phone') or '').strip()
        pin = (data.get('pin') or '').strip()
        financier_name = (data.get('financier_name') or '').strip()
        business_name = (data.get('business_name') or '').strip()
        role = (data.get('role') or 'admin').strip()

        if not phone or not phone.isdigit() or len(phone) != 10:
            return jsonify({'success': False, 'message': 'Valid 10-digit phone number is required'}), 400
        if not pin or not pin.isdigit() or not (4 <= len(pin) <= 6):
            return jsonify({'success': False, 'message': 'PIN must be 4-6 digits'}), 400

        if phone_exists(phone):
            return jsonify({'success': False, 'message': 'Phone already registered'}), 409

        user = create_user(phone, hash_pin(pin), financier_name, business_name, role)
        token = generate_token(phone, user['role'])

        return jsonify({
            'success': True,
            'message': 'Registered',
            'token': token,
            'user': {
                'phone': user['phone'],
                'financierName': user['financier_name'],
                'businessName': user['business_name'],
                'role': user['role']
            }
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        phone = (data.get('phone') or '').strip()
        pin = (data.get('pin') or '').strip()

        if not phone or not pin:
            return jsonify({'success': False, 'message': 'Phone and PIN are required'}), 400

        user = get_user_by_phone(phone)
        if not user:
            return jsonify({'success': False, 'message': 'Phone not registered'}), 404

        if hash_pin(pin) != user['pin_hash']:
            return jsonify({'success': False, 'message': 'Wrong PIN'}), 401

        token = generate_token(user['phone'], user['role'])

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'phone': user['phone'],
                'financierName': user['financier_name'],
                'businessName': user['business_name'],
                'role': user['role']
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@auth_bp.route('/change-pin', methods=['POST'])
def change_pin():
    try:
        data = request.get_json()
        phone = (data.get('phone') or '').strip()
        old_pin = (data.get('old_pin') or '').strip()
        new_pin = (data.get('new_pin') or '').strip()

        if not phone or not old_pin or not new_pin:
            return jsonify({'success': False, 'message': 'Phone, old PIN, and new PIN are required'}), 400

        user = get_user_by_phone(phone)
        if not user:
            return jsonify({'success': False, 'message': 'Phone not registered'}), 404

        if hash_pin(old_pin) != user['pin_hash']:
            return jsonify({'success': False, 'message': 'Current PIN is incorrect'}), 401

        if not new_pin.isdigit() or not (4 <= len(new_pin) <= 6):
            return jsonify({'success': False, 'message': 'New PIN must be 4-6 digits'}), 400

        update_pin(phone, hash_pin(new_pin))
        return jsonify({'success': True, 'message': 'PIN changed successfully'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@auth_bp.route('/reset-pin', methods=['POST'])
def reset_pin():
    try:
        data = request.get_json()
        phone = (data.get('phone') or '').strip()
        new_pin = (data.get('new_pin') or '').strip()

        if not phone or not new_pin:
            return jsonify({'success': False, 'message': 'Phone and new PIN are required'}), 400

        if not phone_exists(phone):
            return jsonify({'success': False, 'message': 'Phone not registered'}), 404

        if not new_pin.isdigit() or not (4 <= len(new_pin) <= 6):
            return jsonify({'success': False, 'message': 'New PIN must be 4-6 digits'}), 400

        # NOTE: In production, OTP verification must be completed before allowing reset
        update_pin(phone, hash_pin(new_pin))
        return jsonify({'success': True, 'message': 'PIN reset successfully'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@auth_bp.route('/check-phone', methods=['GET'])
def check_phone():
    phone = request.args.get('phone', '').strip()
    return jsonify({'exists': phone_exists(phone)}), 200
