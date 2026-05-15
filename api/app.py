import sys
import os

# Add the project root to the path so we can import from kaasflow.backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'kaasflow', 'backend'))

from kaasflow.backend.app import app as application

# Vercel needs the variable to be named 'app' or 'application'
app = application
