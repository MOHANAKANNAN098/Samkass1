#!/usr/bin/env python3
"""
KaasFlow Auth Configuration Helper
Automatically updates Google Client ID in frontend files
"""

import os
import sys

def update_client_id(client_id):
    """Update Google Client ID in frontend files"""
    
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    files_to_update = ['auth.html', 'index.html']
    
    updated_files = []
    
    for filename in files_to_update:
        filepath = os.path.join(frontend_dir, filename)
        
        if not os.path.exists(filepath):
            print(f"⚠️  {filename} not found, skipping...")
            continue
            
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace placeholder with actual client ID
            updated_content = content.replace(
                'data-client_id="YOUR_GOOGLE_CLIENT_ID"',
                f'data-client_id="{client_id}"'
            )
            
            if updated_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                updated_files.append(filename)
                print(f"✅ Updated {filename}")
            else:
                print(f"ℹ️  {filename} already configured or no placeholder found")
                
        except Exception as e:
            print(f"❌ Error updating {filename}: {e}")
    
    return updated_files

def main():
    print("=" * 60)
    print("🔐 KaasFlow Authentication Configuration Helper")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1:
        client_id = sys.argv[1]
    else:
        print("Enter your Google OAuth Client ID:")
        print("(It looks like: 123456789-abc.apps.googleusercontent.com)")
        print()
        client_id = input("Client ID: ").strip()
    
    if not client_id:
        print("❌ Client ID cannot be empty!")
        sys.exit(1)
    
    if not client_id.endswith('.apps.googleusercontent.com'):
        print("⚠️  Warning: Client ID doesn't look like a valid Google Client ID")
        confirm = input("Continue anyway? (y/n): ").strip().lower()
        if confirm != 'y':
            print("Aborted.")
            sys.exit(0)
    
    print()
    print("Updating frontend files...")
    print()
    
    updated = update_client_id(client_id)
    
    print()
    print("=" * 60)
    if updated:
        print(f"✅ Successfully updated {len(updated)} file(s)")
        print()
        print("Next steps:")
        print("1. Update your .env file with the same Client ID")
        print("2. Add the Client Secret to .env")
        print("3. Run: python backend/app.py")
    else:
        print("ℹ️  No files were updated")
    print("=" * 60)

if __name__ == '__main__':
    main()
