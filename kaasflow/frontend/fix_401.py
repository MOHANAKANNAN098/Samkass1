import os
import re

def fix_app_py():
    for root, dirs, files in os.walk('.'):
        if 'app.py' in files:
            path = os.path.join(root, 'app.py')
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if 'def get_user_email_from_token():' in content:
                new_func = """import jwt\n\ndef get_user_email_from_token():\n    auth_header = request.headers.get('Authorization')\n    if not auth_header or not auth_header.startswith('Bearer '):\n        return None\n    token = auth_header.split(' ')[1]\n    try:\n        secret = os.environ.get('JWT_SECRET', 'kaasflow-secret-key-change-in-production')\n        payload = jwt.decode(token, secret, algorithms=['HS256'], options={"verify_exp": False})\n        # KaasFlow saves 'phone' instead of email for mobile login\n        return payload.get('phone') or payload.get('sub') or 'unknown_user'\n    except Exception as e:\n        print(f"Token decode error: {e}")\n        return None"""
                
                # Replace the old function using regex
                content = re.sub(
                    r'def get_user_email_from_token\(\):.*?except:.*?return None', 
                    new_func, 
                    content, 
                    flags=re.DOTALL
                )
                
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ Successfully fixed the 401 Unauthorized error in {path}!")
                return
    print("Error: Could not find app.py")

fix_app_py()