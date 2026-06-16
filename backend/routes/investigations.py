from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.investigation import Investigation, CaseNote
from models.transaction import Transaction
from extensions import db
from datetime import datetime
import uuid

investigations_bp = Blueprint('investigations', __name__)

def generate_case_number():
    return f"CASE-{datetime.utcnow().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}"

@investigations_bp.route('/', methods=['GET'])
@jwt_required()
def get_investigations():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', '')
    priority = request.args.get('priority', '')

    query = Investigation.query
    if status:
        query = query.filter(Investigation.status == status)
    if priority:
        query = query.filter(Investigation.priority == priority)

    query = query.order_by(Investigation.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'investigations': [i.to_dict() for i in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    })


@investigations_bp.route('/<int:inv_id>', methods=['GET'])
@jwt_required()
def get_investigation(inv_id):
    inv = Investigation.query.get_or_404(inv_id)
    data = inv.to_dict()
    data['notes'] = [n.to_dict() for n in inv.notes]
    data['transaction'] = inv.transaction.to_dict() if inv.transaction else None
    return jsonify(data)


@investigations_bp.route('/', methods=['POST'])
@jwt_required()
def create_investigation():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    txn = Transaction.query.get_or_404(data['transaction_id'])

    inv = Investigation(
        case_number=generate_case_number(),
        transaction_id=txn.id,
        investigator_id=user_id,
        title=data.get('title', f'Investigation for {txn.transaction_id}'),
        description=data.get('description', ''),
        priority=data.get('priority', 'medium'),
        fraud_explanation=data.get('fraud_explanation', ''),
        status='open',
        assigned_at=datetime.utcnow()
    )
    db.session.add(inv)
    db.session.commit()

    return jsonify(inv.to_dict()), 201


@investigations_bp.route('/<int:inv_id>', methods=['PATCH'])
@jwt_required()
def update_investigation(inv_id):
    inv = Investigation.query.get_or_404(inv_id)
    data = request.get_json()

    allowed = ['status', 'priority', 'investigator_remarks', 'resolution', 'is_confirmed_fraud', 'title']
    for field in allowed:
        if field in data:
            setattr(inv, field, data[field])

    if data.get('status') in ('resolved', 'closed') and not inv.resolved_at:
        inv.resolved_at = datetime.utcnow()

    db.session.commit()
    return jsonify(inv.to_dict())


@investigations_bp.route('/<int:inv_id>/notes', methods=['POST'])
@jwt_required()
def add_note(inv_id):
    inv = Investigation.query.get_or_404(inv_id)
    data = request.get_json()
    user_id = int(get_jwt_identity())

    note = CaseNote(
        investigation_id=inv.id,
        author_id=user_id,
        note_text=data['note_text'],
        note_type=data.get('note_type', 'comment')
    )
    db.session.add(note)
    db.session.commit()

    return jsonify(note.to_dict()), 201
