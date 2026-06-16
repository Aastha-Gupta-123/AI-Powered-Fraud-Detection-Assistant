from extensions import db
from datetime import datetime

class Investigation(db.Model):
    __tablename__ = 'investigations'

    id = db.Column(db.Integer, primary_key=True)
    case_number = db.Column(db.String(30), unique=True, nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)
    investigator_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.Enum('open', 'in_progress', 'resolved', 'escalated', 'closed'), default='open')
    priority = db.Column(db.Enum('low', 'medium', 'high', 'critical'), default='medium')
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    fraud_explanation = db.Column(db.Text)
    investigator_remarks = db.Column(db.Text)
    resolution = db.Column(db.Text)
    is_confirmed_fraud = db.Column(db.Boolean)
    assigned_at = db.Column(db.DateTime)
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    notes = db.relationship('CaseNote', backref='investigation', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'case_number': self.case_number,
            'transaction_id': self.transaction_id,
            'investigator_id': self.investigator_id,
            'investigator_name': self.investigator.full_name if self.investigator else None,
            'status': self.status,
            'priority': self.priority,
            'title': self.title,
            'description': self.description,
            'fraud_explanation': self.fraud_explanation,
            'investigator_remarks': self.investigator_remarks,
            'resolution': self.resolution,
            'is_confirmed_fraud': self.is_confirmed_fraud,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class CaseNote(db.Model):
    __tablename__ = 'case_notes'

    id = db.Column(db.Integer, primary_key=True)
    investigation_id = db.Column(db.Integer, db.ForeignKey('investigations.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    note_text = db.Column(db.Text, nullable=False)
    note_type = db.Column(db.Enum('comment', 'action', 'evidence', 'escalation'), default='comment')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', backref='case_notes')

    def to_dict(self):
        return {
            'id': self.id,
            'investigation_id': self.investigation_id,
            'author_id': self.author_id,
            'author_name': self.author.full_name if self.author else 'Unknown',
            'note_text': self.note_text,
            'note_type': self.note_type,
            'created_at': self.created_at.isoformat()
        }


class Report(db.Model):
    __tablename__ = 'reports'

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(30), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    report_type = db.Column(db.Enum('fraud_summary', 'transaction_audit', 'investigation_report', 'risk_assessment'))
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    file_path = db.Column(db.String(300))
    parameters = db.Column(db.JSON)
    status = db.Column(db.Enum('generating', 'ready', 'failed'), default='generating')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    generator = db.relationship('User', backref='reports')

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'title': self.title,
            'report_type': self.report_type,
            'generated_by': self.generated_by,
            'generated_by_name': self.generator.full_name if self.generator else None,
            'status': self.status,
            'parameters': self.parameters,
            'created_at': self.created_at.isoformat()
        }
