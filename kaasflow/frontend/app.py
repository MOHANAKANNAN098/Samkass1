import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from routes.auth import auth_bp

load_dotenv()

app = Flask(__name__)
# Only allow requests from the designated frontend domain for security
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": os.environ.get("FRONTEND_URL", "http://localhost:5500")}})

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
app.register_blueprint(auth_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True, port=5000)