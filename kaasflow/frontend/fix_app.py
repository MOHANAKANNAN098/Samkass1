import os

def find_app_py():
    # Search for the Flask app.py file
    for root, dirs, files in os.walk('.'):
        if 'app.py' in files:
            path = os.path.join(root, 'app.py')
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Check if it's the right app.py (contains Flask)
                if 'Flask' in content and 'register_blueprint' in content:
                    return path
    return None

app_path = find_app_py()

if not app_path:
    print("Error: Could not find your backend/app.py file.")
    exit(1)

with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'create_client' in content and '/api/sync/backup' in content:
    print("Your app.py is already patched with Supabase sync!")
    exit(0)

imports = """
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
"""

routes = """
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
"""

lines = content.split('\n')
import_idx = 0
for i, line in enumerate(lines):
    if line.startswith('from ') or line.startswith('import '):
        import_idx = i

main_idx = -1
for i, line in enumerate(lines):
    if "if __name__ == '__main__':" in line or 'if __name__ == "__main__":' in line or "app.run(" in line:
        main_idx = i
        break

if main_idx == -1:
    main_idx = len(lines)

new_content = '\n'.join(lines[:import_idx+1]) + '\n' + imports + '\n'.join(lines[import_idx+1:main_idx]) + '\n' + routes + '\n'.join(lines[main_idx:])

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"✅ Successfully patched {app_path}! You can now start the backend.")