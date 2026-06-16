from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.chat import ChatHistory
from extensions import db
from services.chat_service import ChatEngine

chat_bp = Blueprint('chat', __name__)
engine = ChatEngine()


@chat_bp.route('/modes', methods=['GET'])
@jwt_required()
def get_modes():
    return jsonify({
        'modes': [
            {'id': 'auto', 'label': 'Auto Mode', 'description': 'AI-assisted fraud analysis and next-step guidance'},
            {'id': 'manual', 'label': 'Manual Mode', 'description': 'Direct customer chat prompt handling'}
        ],
        'active_mode': 'auto'
    })


@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'error': 'Message cannot be empty'}), 400
    if len(message) > 1000:
        return jsonify({'error': 'Message too long'}), 400

    result = engine.process(message, user_id)

    entry = ChatHistory(
        user_id=user_id,
        message=message,
        response=result['response'],
        intent=result['intent']
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({
        'id': entry.id,
        'message': message,
        'response': result['response'],
        'intent': result['intent'],
        'mode': 'manual',
        'timestamp': entry.timestamp.isoformat()
    })


@chat_bp.route('/auto', methods=['POST'])
@jwt_required()
def auto_mode():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    message = (data.get('message') or '').strip() or 'Provide a brief fraud-risk summary and recommended next actions for a flagged transaction.'

    result = engine.process(message, user_id)

    entry = ChatHistory(
        user_id=user_id,
        message=message,
        response=result['response'],
        intent=result['intent']
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({
        'id': entry.id,
        'message': message,
        'response': result['response'],
        'intent': result['intent'],
        'mode': 'auto',
        'timestamp': entry.timestamp.isoformat(),
        'status': 'ready'
    })


@chat_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    limit = request.args.get('limit', 50, type=int)

    history = ChatHistory.query\
        .filter_by(user_id=user_id)\
        .order_by(ChatHistory.timestamp.desc())\
        .limit(limit).all()

    return jsonify([h.to_dict() for h in reversed(history)])


@chat_bp.route('/history', methods=['DELETE'])
@jwt_required()
def clear_history():
    user_id = int(get_jwt_identity())
    ChatHistory.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({'message': 'Chat history cleared'})


@chat_bp.route('/context/<int:txn_id>', methods=['GET'])
@jwt_required()
def get_transaction_context(txn_id):
    """Called when investigator opens a transaction — returns auto analysis"""
    from models.transaction import Transaction
    txn = Transaction.query.get_or_404(txn_id)
    result = engine.process(f"analyze transaction {txn.transaction_id}", int(get_jwt_identity()))
    return jsonify({'response': result['response'], 'transaction_id': txn.transaction_id})
