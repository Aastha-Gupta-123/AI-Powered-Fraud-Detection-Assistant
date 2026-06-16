from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models.transaction import Transaction
from models.investigation import Investigation
from extensions import db
from sqlalchemy import func
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    total_txns = Transaction.query.count()
    fraud_txns = Transaction.query.filter_by(is_fraud=True).count()
    flagged = Transaction.query.filter_by(flagged_for_review=True).count()
    open_cases = Investigation.query.filter(Investigation.status.in_(['open', 'in_progress'])).count()

    last_30 = datetime.utcnow() - timedelta(days=30)
    recent_fraud = Transaction.query.filter(
        Transaction.is_fraud == True,
        Transaction.transaction_date >= last_30
    ).count()

    total_fraud_amount = db.session.query(func.sum(Transaction.amount))\
        .filter(Transaction.is_fraud == True).scalar() or 0

    return jsonify({
        'total_transactions': total_txns,
        'fraud_transactions': fraud_txns,
        'flagged_transactions': flagged,
        'open_investigations': open_cases,
        'fraud_last_30_days': recent_fraud,
        'total_fraud_amount': float(total_fraud_amount),
        'fraud_rate': round((fraud_txns / total_txns * 100), 2) if total_txns else 0
    })


@dashboard_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def recent_activity():
    recent_txns = Transaction.query.filter_by(is_fraud=True)\
        .order_by(Transaction.transaction_date.desc()).limit(10).all()

    recent_cases = Investigation.query.order_by(Investigation.created_at.desc()).limit(5).all()

    return jsonify({
        'recent_fraud': [t.to_dict() for t in recent_txns],
        'recent_cases': [c.to_dict() for c in recent_cases]
    })
