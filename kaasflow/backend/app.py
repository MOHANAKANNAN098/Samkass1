from flask import Flask, send_from_directory
from flask_cors import CORS
from routes.auth import auth_bp
from routes.sync import sync_bp
from auth import auth_bp as pro_auth_bp
from models.user import init_db
from dotenv import load_dotenv
import os

import os
from supabase import create_client, Client
from auth.jwt_handler import decode_token
from flask import request, jsonify

# Initialize Supabase Client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

load_dotenv()

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend'))
CORS(app)

try:
    init_db()
except Exception as e:
    print(f"Skipping local DB initialization: {e}")

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(pro_auth_bp, url_prefix='/auth')
app.register_blueprint(sync_bp, url_prefix='/api/sync')

@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)


# ── Cloud Sync Routes ────────────────────────────────────────

def get_user_email_from_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        payload = decode_token(token)
        return payload.get('sub') if payload else None
    except:
        return None

@app.route('/api/sync/status', methods=['GET'])
def sync_status():
    return jsonify({"supabase_configured": supabase is not None})

@app.route('/api/sync/backup', methods=['POST'])
def sync_backup():
    if not supabase:
        return jsonify({"success": False, "errors": ["Supabase not configured"]}), 500
    user_email = get_user_email_from_token()
    if not user_email:
        return jsonify({"success": False, "errors": ["Unauthorized"]}), 401
    data = request.json
    try:
        response = supabase.table('app_backups').upsert({
            "user_email": user_email,
            "clients_json": data.get("clients", []),
            "loans_json": data.get("loans", []),
            "payments_json": data.get("payments", []),
            "settings_json": data.get("settings", {})
        }).execute()
        return jsonify({"success": True, "data": response.data})
    except Exception as e:
        print(f"Sync Backup Error: {e}")
        return jsonify({"success": False, "errors": [str(e)]}), 500

@app.route('/api/sync/restore', methods=['GET'])
def sync_restore():
    if not supabase:
        return jsonify({"success": False, "error": "Supabase not configured"}), 500
    user_email = get_user_email_from_token()
    if not user_email:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    try:
        response = supabase.table('app_backups').select('*').eq('user_email', user_email).execute()
        if not response.data:
            return jsonify({"success": True, "data": {"clients": [], "loans": [], "payments": [], "settings": {}}})
        backup = response.data[0]
        return jsonify({
            "success": True, 
            "data": {
                "clients": backup.get("clients_json", []),
                "loans": backup.get("loans_json", []),
                "payments": backup.get("payments_json", []),
                "settings": backup.get("settings_json", {})
            }
        })
    except Exception as e:
        print(f"Sync Restore Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
