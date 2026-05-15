#!/usr/bin/env python3
"""
KaasFlow Auth Health Check
Verifies that all authentication components are properly configured
"""

import os
import sys
from pathlib import Path

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def check_mark(passed):
    return f"{GREEN}✓{RESET}" if passed else f"{RED}✗{RESET}"

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def check_files():
    """Check if all required files exist"""
    print_header("📁 Checking Files")
    
    required_files = [
        'backend/auth/__init__.py',
        'backend/auth/google_oauth.py',
        'backend/auth/jwt_handler.py',
        'backend/auth/password_handler.py',
        'backend/auth/magic_link.py',
        'backend/auth/rate_limiter.py',
        'backend/auth/routes.py',
        'backend/app.py',
        'backend/requirements.txt',
        'frontend/auth.html',
        'frontend/auth.js',
        '.env.example',
    ]
    
    all_exist = True
    for file_path in required_files:
        exists = Path(file_path).exists()
        all_exist = all_exist and exists
        print(f"{check_mark(exists)} {file_path}")
    
    return all_exist

def check_dependencies():
    """Check if required Python packages are installed"""
    print_header("📦 Checking Dependencies")
    
    required_packages = [
        'flask',
        'flask_cors',
        'jwt',
        'bcrypt',
        'requests',
    ]
    
    all_installed = True
    for package in required_packages:
        try:
            __import__(package)
            print(f"{check_mark(True)} {package}")
        except ImportError:
            print(f"{check_mark(False)} {package} - NOT INSTALLED")
            all_installed = False
    
    if not all_installed:
        print(f"\n{YELLOW}Run: pip install -r backend/requirements.txt{RESET}")
    
    return all_installed

def check_env_file():
    """Check if .env file exists and has required variables"""
    print_header("🔐 Checking Environment Configuration")
    
    env_path = Path('backend/.env')
    
    if not env_path.exists():
        print(f"{check_mark(False)} .env file not found")
        print(f"{YELLOW}Run: cp .env.example backend/.env{RESET}")
        return False
    
    print(f"{check_mark(True)} .env file exists")
    
    required_vars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'MAGIC_LINK_SECRET',
    ]
    
    with open(env_path, 'r') as f:
        env_content = f.read()
    
    all_set = True
    for var in required_vars:
        if var in env_content:
            # Check if it's not a placeholder
            line = [l for l in env_content.split('\n') if l.startswith(var)]
            if line:
                value = line[0].split('=', 1)[1].strip()
                is_set = value and not any(placeholder in value.lower() for placeholder in ['your_', 'change', 'example', 'here'])
                print(f"{check_mark(is_set)} {var} {'(set)' if is_set else '(placeholder)'}")
                all_set = all_set and is_set
            else:
                print(f"{check_mark(False)} {var} (not found)")
                all_set = False
        else:
            print(f"{check_mark(False)} {var} (not found)")
            all_set = False
    
    if not all_set:
        print(f"\n{YELLOW}Update backend/.env with your actual credentials{RESET}")
    
    return all_set

def check_google_client_id():
    """Check if Google Client ID is configured in frontend"""
    print_header("🌐 Checking Google OAuth Configuration")
    
    auth_html_path = Path('frontend/auth.html')
    index_html_path = Path('frontend/index.html')
    
    all_configured = True
    
    for html_path in [auth_html_path, index_html_path]:
        if html_path.exists():
            with open(html_path, 'r') as f:
                content = f.read()
            
            is_configured = 'YOUR_GOOGLE_CLIENT_ID' not in content
            print(f"{check_mark(is_configured)} {html_path.name} {'(configured)' if is_configured else '(placeholder)'}")
            all_configured = all_configured and is_configured
        else:
            print(f"{check_mark(False)} {html_path.name} (not found)")
            all_configured = False
    
    if not all_configured:
        print(f"\n{YELLOW}Run: python configure_auth.py YOUR_GOOGLE_CLIENT_ID{RESET}")
    
    return all_configured

def check_database():
    """Check if database is initialized"""
    print_header("🗄️  Checking Database")
    
    db_path = Path('backend/users.db')
    
    if not db_path.exists():
        print(f"{check_mark(False)} Database not initialized")
        print(f"{YELLOW}Database will be created on first run{RESET}")
        return False
    
    print(f"{check_mark(True)} Database exists")
    
    try:
        import sqlite3
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if pro_users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='pro_users'")
        table_exists = cursor.fetchone() is not None
        
        print(f"{check_mark(table_exists)} pro_users table {'exists' if table_exists else 'missing'}")
        
        if table_exists:
            cursor.execute("SELECT COUNT(*) FROM pro_users")
            count = cursor.fetchone()[0]
            print(f"  ℹ️  {count} user(s) registered")
        
        conn.close()
        return table_exists
    except Exception as e:
        print(f"{check_mark(False)} Database error: {e}")
        return False

def check_smtp():
    """Check SMTP configuration"""
    print_header("📧 Checking SMTP Configuration")
    
    env_path = Path('backend/.env')
    
    if not env_path.exists():
        print(f"{check_mark(False)} .env file not found")
        return False
    
    with open(env_path, 'r') as f:
        env_content = f.read()
    
    smtp_vars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
    smtp_configured = all(var in env_content for var in smtp_vars)
    
    if smtp_configured:
        print(f"{check_mark(True)} SMTP variables configured")
        print(f"  ℹ️  Magic links will be sent via email")
    else:
        print(f"{check_mark(False)} SMTP not fully configured")
        print(f"  ℹ️  Magic links will be returned in API response (dev mode)")
    
    return smtp_configured

def test_imports():
    """Test if auth modules can be imported"""
    print_header("🔧 Testing Module Imports")
    
    sys.path.insert(0, str(Path('backend').absolute()))
    
    modules = [
        'auth',
        'auth.google_oauth',
        'auth.jwt_handler',
        'auth.password_handler',
        'auth.magic_link',
        'auth.rate_limiter',
        'auth.routes',
    ]
    
    all_imported = True
    for module in modules:
        try:
            __import__(module)
            print(f"{check_mark(True)} {module}")
        except Exception as e:
            print(f"{check_mark(False)} {module} - {str(e)[:50]}")
            all_imported = False
    
    return all_imported

def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}🔐 KaasFlow Authentication Health Check{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    results = {
        'Files': check_files(),
        'Dependencies': check_dependencies(),
        'Environment': check_env_file(),
        'Google OAuth': check_google_client_id(),
        'Database': check_database(),
        'SMTP': check_smtp(),
        'Imports': test_imports(),
    }
    
    print_header("📊 Summary")
    
    for check, passed in results.items():
        status = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
        print(f"{check:20} {status}")
    
    all_passed = all(results.values())
    
    print(f"\n{BLUE}{'='*60}{RESET}")
    if all_passed:
        print(f"{GREEN}✓ All checks passed! Your auth system is ready.{RESET}")
        print(f"\n{BLUE}Next steps:{RESET}")
        print(f"  1. Run: cd backend && python app.py")
        print(f"  2. Visit: http://localhost:5000/auth.html")
        print(f"  3. Test login methods")
    else:
        print(f"{RED}✗ Some checks failed. Please fix the issues above.{RESET}")
        print(f"\n{BLUE}Quick fixes:{RESET}")
        if not results['Dependencies']:
            print(f"  • pip install -r backend/requirements.txt")
        if not results['Environment']:
            print(f"  • cp .env.example backend/.env")
            print(f"  • Edit backend/.env with your credentials")
        if not results['Google OAuth']:
            print(f"  • python configure_auth.py YOUR_GOOGLE_CLIENT_ID")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    sys.exit(0 if all_passed else 1)

if __name__ == '__main__':
    main()
