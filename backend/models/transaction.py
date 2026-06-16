from extensions import db
from datetime import datetime

class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.String(50), unique=True, nullable=False)
    account_number = db.Column(db.String(20), nullable=False)
    customer_name = db.Column(db.String(150))
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.Enum('debit', 'credit', 'transfer', 'withdrawal', 'deposit'))
    merchant_name = db.Column(db.String(150))
    merchant_category = db.Column(db.String(100))
    location = db.Column(db.String(200))
    ip_address = db.Column(db.String(45))
    device_type = db.Column(db.String(50))
    channel = db.Column(db.Enum('online', 'atm', 'branch', 'mobile', 'pos'))
    status = db.Column(db.Enum('completed', 'pending', 'failed', 'reversed'), default='completed')
    is_fraud = db.Column(db.Boolean, default=False)
    fraud_score = db.Column(db.Float, default=0.0)
    risk_level = db.Column(db.Enum('low', 'medium', 'high', 'critical'), default='low')
    flagged_for_review = db.Column(db.Boolean, default=False)
    transaction_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    investigation = db.relationship('Investigation', backref='transaction', uselist=False, lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'account_number': self.account_number,
            'customer_name': self.customer_name,
            'amount': self.amount,
            'transaction_type': self.transaction_type,
            'merchant_name': self.merchant_name,
            'merchant_category': self.merchant_category,
            'location': self.location,
            'ip_address': self.ip_address,
            'device_type': self.device_type,
            'channel': self.channel,
            'status': self.status,
            'is_fraud': self.is_fraud,
            'fraud_score': round(self.fraud_score, 4) if self.fraud_score else 0,
            'risk_level': self.risk_level,
            'flagged_for_review': self.flagged_for_review,
            'transaction_date': self.transaction_date.isoformat(),
            'created_at': self.created_at.isoformat()
        }
