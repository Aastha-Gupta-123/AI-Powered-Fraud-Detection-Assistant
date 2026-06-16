from flask import Flask
from flask_cors import CORS
from extensions import db, jwt
from config import Config
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)

    from routes.auth import auth_bp
    from routes.transactions import transactions_bp
    from routes.fraud import fraud_bp
    from routes.investigations import investigations_bp
    from routes.reports import reports_bp
    from routes.analytics import analytics_bp
    from routes.dashboard import dashboard_bp
    from routes.chat import chat_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(fraud_bp, url_prefix='/api/fraud')
    app.register_blueprint(investigations_bp, url_prefix='/api/investigations')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')

    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
