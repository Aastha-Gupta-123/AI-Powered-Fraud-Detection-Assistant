from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.transaction import Transaction
from extensions import db
from sqlalchemy import or_, and_

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '').strip()
    risk_level = request.args.get('risk_level', '')
    is_fraud = request.args.get('is_fraud', '')
    channel = request.args.get('channel', '')
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    sort_by = request.args.get('sort_by', 'transaction_date')
    sort_order = request.args.get('sort_order', 'desc')

    query = Transaction.query

    if search:
        query = query.filter(or_(
            Transaction.transaction_id.ilike(f'%{search}%'),
            Transaction.account_number.ilike(f'%{search}%'),
            Transaction.customer_name.ilike(f'%{search}%'),
            Transaction.merchant_name.ilike(f'%{search}%')
        ))

    if risk_level:
        query = query.filter(Transaction.risk_level == risk_level)
    if is_fraud != '':
        query = query.filter(Transaction.is_fraud == (is_fraud == 'true'))
    if channel:
        query = query.filter(Transaction.channel == channel)
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    sort_col = getattr(Transaction, sort_by, Transaction.transaction_date)
    if sort_order == 'desc':
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'transactions': [t.to_dict() for t in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page,
        'per_page': per_page
    })


@transactions_bp.route('/<int:txn_id>', methods=['GET'])
@jwt_required()
def get_transaction(txn_id):
    txn = Transaction.query.get_or_404(txn_id)
    data = txn.to_dict()
    if txn.investigation:
        data['investigation'] = txn.investigation.to_dict()
    return jsonify(data)


@transactions_bp.route('/<int:txn_id>/flag', methods=['PATCH'])
@jwt_required()
def flag_transaction(txn_id):
    txn = Transaction.query.get_or_404(txn_id)
    txn.flagged_for_review = not txn.flagged_for_review
    db.session.commit()
    return jsonify({'flagged': txn.flagged_for_review, 'transaction_id': txn_id})
