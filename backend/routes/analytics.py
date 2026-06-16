from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.transaction import Transaction
from models.investigation import Investigation
from extensions import db
from sqlalchemy import func
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/fraud-trends', methods=['GET'])
@jwt_required()
def fraud_trends():
    days = request.args.get('days', 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)

    results = db.session.query(
        func.date(Transaction.transaction_date).label('date'),
        func.count(Transaction.id).label('total'),
        func.sum(func.cast(Transaction.is_fraud, db.Integer)).label('fraud_count'),
        func.sum(Transaction.amount).label('total_amount')
    ).filter(Transaction.transaction_date >= since)\
     .group_by(func.date(Transaction.transaction_date))\
     .order_by(func.date(Transaction.transaction_date))\
     .all()

    return jsonify([{
        'date': str(r.date),
        'total': r.total,
        'fraud_count': int(r.fraud_count or 0),
        'total_amount': float(r.total_amount or 0)
    } for r in results])


@analytics_bp.route('/risk-distribution', methods=['GET'])
@jwt_required()
def risk_distribution():
    results = db.session.query(
        Transaction.risk_level,
        func.count(Transaction.id).label('count')
    ).group_by(Transaction.risk_level).all()

    return jsonify([{'risk_level': r.risk_level, 'count': r.count} for r in results])


@analytics_bp.route('/channel-breakdown', methods=['GET'])
@jwt_required()
def channel_breakdown():
    results = db.session.query(
        Transaction.channel,
        func.count(Transaction.id).label('total'),
        func.sum(func.cast(Transaction.is_fraud, db.Integer)).label('fraud')
    ).group_by(Transaction.channel).all()

    return jsonify([{
        'channel': r.channel,
        'total': r.total,
        'fraud': int(r.fraud or 0)
    } for r in results])


@analytics_bp.route('/monthly-summary', methods=['GET'])
@jwt_required()
def monthly_summary():
    # Use strftime for SQLite compatibility
    results = db.session.query(
        func.strftime('%Y', Transaction.transaction_date).label('year'),
        func.strftime('%m', Transaction.transaction_date).label('month'),
        func.count(Transaction.id).label('total'),
        func.sum(func.cast(Transaction.is_fraud, db.Integer)).label('fraud_count'),
        func.sum(Transaction.amount).label('total_amount'),
        func.avg(Transaction.fraud_score).label('avg_risk')
    ).group_by('year', 'month')\
     .order_by('year', 'month')\
     .limit(12).all()

    return jsonify([{
        'year': int(r.year or 0),
        'month': int(r.month or 0),
        'total': r.total,
        'fraud_count': int(r.fraud_count or 0),
        'total_amount': float(r.total_amount or 0),
        'avg_risk': float(r.avg_risk or 0)
    } for r in results])


@analytics_bp.route('/top-merchants', methods=['GET'])
@jwt_required()
def top_merchants():
    results = db.session.query(
        Transaction.merchant_name,
        func.count(Transaction.id).label('total'),
        func.sum(func.cast(Transaction.is_fraud, db.Integer)).label('fraud_count')
    ).filter(Transaction.is_fraud == True)\
     .group_by(Transaction.merchant_name)\
     .order_by(func.sum(func.cast(Transaction.is_fraud, db.Integer)).desc())\
     .limit(10).all()

    return jsonify([{
        'merchant': r.merchant_name,
        'total': r.total,
        'fraud_count': int(r.fraud_count or 0)
    } for r in results])
