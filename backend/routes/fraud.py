from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.transaction import Transaction
from models.investigation import Investigation
from app import db
from services.fraud_service import FraudDetectionService
import os, csv, io

fraud_bp = Blueprint('fraud', __name__)
fraud_service = FraudDetectionService()

@fraud_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_single():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    result = fraud_service.predict_single(data)
    return jsonify(result)


@fraud_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Only CSV files are accepted'}), 400

    stream = io.StringIO(file.stream.read().decode('utf-8'))
    reader = csv.DictReader(stream)
    rows = list(reader)

    if len(rows) > 5000:
        return jsonify({'error': 'Max 5000 rows per upload'}), 400

    results = fraud_service.batch_predict(rows)
    return jsonify({
        'total_processed': len(results),
        'fraud_detected': sum(1 for r in results if r['is_fraud']),
        'results': results[:100]  # Return first 100 for preview
    })


@fraud_bp.route('/explain/<int:txn_id>', methods=['GET'])
@jwt_required()
def explain_fraud(txn_id):
    txn = Transaction.query.get_or_404(txn_id)
    explanation = fraud_service.explain_prediction(txn.to_dict())
    return jsonify({'explanation': explanation, 'transaction_id': txn_id})


@fraud_bp.route('/notify', methods=['POST'])
@jwt_required()
def notify_customer():
    data = request.get_json() or {}
    txn_id = data.get('transaction_id')
    phone = data.get('phone_number')
    message = data.get('message') or 'FraudGuard: We detected a high-risk transaction on your account. Please contact support immediately.'

    if not txn_id or not phone:
        return jsonify({'error': 'transaction_id and phone_number are required'}), 400

    sid = os.environ.get('TWILIO_ACCOUNT_SID') or getattr(__import__('config').Config, 'TWILIO_ACCOUNT_SID', '')
    token = os.environ.get('TWILIO_AUTH_TOKEN') or getattr(__import__('config').Config, 'TWILIO_AUTH_TOKEN', '')
    from_number = os.environ.get('TWILIO_FROM_NUMBER') or getattr(__import__('config').Config, 'TWILIO_FROM_NUMBER', '')

    if not all([sid, token, from_number]):
        return jsonify({'error': 'Twilio environment variables are not configured'}), 500

    try:
        from twilio.rest import Client
    except ImportError:
        return jsonify({'error': 'Twilio package is not installed'}), 500

    try:
        client = Client(sid, token)
        client.messages.create(
            body=f'FraudGuard alert for {txn_id}: {message}',
            from_=from_number,
            to=phone
        )
    except Exception as exc:
        return jsonify({'error': f'Twilio send failed: {exc}'}), 500

    return jsonify({'message': 'SMS alert sent successfully', 'transaction_id': txn_id, 'phone_number': phone})


@fraud_bp.route('/retrain', methods=['POST'])
@jwt_required()
def retrain_model():
    # Re-train on all labeled transactions in DB
    transactions = Transaction.query.all()
    if len(transactions) < 100:
        return jsonify({'error': 'Insufficient data for training'}), 400

    metrics = fraud_service.retrain([t.to_dict() for t in transactions])
    return jsonify(metrics)
