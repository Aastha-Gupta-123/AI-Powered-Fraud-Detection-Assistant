"""
Seed script - populates DB with realistic mock data.
Run once: python utils/seed_data.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from models.user import User
from models.transaction import Transaction
from models.investigation import Investigation, CaseNote
import random
from datetime import datetime, timedelta
import uuid

MERCHANTS = [
    ("Amazon", "e-commerce"), ("Walmart", "retail"), ("Shell Gas Station", "fuel"),
    ("Starbucks", "food_beverage"), ("Apple Store", "electronics"),
    ("Netflix", "subscription"), ("Uber", "transportation"), ("Delta Airlines", "travel"),
    ("Best Buy", "electronics"), ("Target", "retail"), ("CVS Pharmacy", "pharmacy"),
    ("McDonald's", "food_beverage"), ("Home Depot", "home_improvement"),
    ("Spotify", "subscription"), ("PayPal Transfer", "p2p_transfer"),
    ("Western Union", "money_transfer"), ("Bitcoin Exchange", "crypto"),
    ("International Wire", "international"), ("Cash Advance ATM", "atm"),
    ("Unknown Merchant", "unclassified"), ("Luxury Goods Int'l", "luxury"),
    ("Online Casino", "gambling"), ("Foreign Exchange", "forex")
]

LOCATIONS = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX",
    "Miami, FL", "Seattle, WA", "Boston, MA", "Dallas, TX",
    "San Francisco, CA", "Atlanta, GA", "Mumbai, India", "Lagos, Nigeria",
    "London, UK", "Amsterdam, Netherlands", "Singapore", "Tokyo, Japan"
]

CUSTOMER_NAMES = [
    "James Wilson", "Sarah Johnson", "Michael Chen", "Emily Rodriguez",
    "David Kim", "Jessica Thompson", "Robert Davis", "Amanda Martinez",
    "Christopher Lee", "Michelle Taylor", "Daniel Anderson", "Jennifer White",
    "Matthew Harris", "Ashley Jackson", "Joshua Clark", "Stephanie Lewis"
]

ACCOUNTS = [f"ACC{random.randint(1000000, 9999999):07d}" for _ in range(50)]
IPS = [f"192.168.{random.randint(1,254)}.{random.randint(1,254)}" for _ in range(30)]
HIGH_RISK_IPS = [f"45.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}" for _ in range(10)]

def make_transaction(index, is_fraud_candidate=False):
    now = datetime.utcnow()
    days_back = random.randint(0, 365)
    txn_date = now - timedelta(days=days_back, hours=random.randint(0, 23), minutes=random.randint(0, 59))

    merchant, category = random.choice(MERCHANTS)
    channel = random.choice(['online', 'atm', 'branch', 'mobile', 'pos'])
    txn_type = random.choice(['debit', 'credit', 'transfer', 'withdrawal', 'deposit'])

    if is_fraud_candidate:
        amount = round(random.uniform(2000, 50000), 2)
        # Fraud patterns
        if random.random() > 0.5:
            txn_date = txn_date.replace(hour=random.choice([0, 1, 2, 3, 23]))
        ip = random.choice(HIGH_RISK_IPS)
        location = random.choice(LOCATIONS[10:])  # Foreign locations
        merchant, category = random.choice(MERCHANTS[-6:])  # High-risk merchants
    else:
        amount = round(random.uniform(5, 3000), 2)
        ip = random.choice(IPS)
        location = random.choice(LOCATIONS[:10])

    return {
        'transaction_id': f"TXN{datetime.utcnow().strftime('%Y%m%d')}{index:05d}",
        'account_number': random.choice(ACCOUNTS),
        'customer_name': random.choice(CUSTOMER_NAMES),
        'amount': amount,
        'transaction_type': txn_type,
        'merchant_name': merchant,
        'merchant_category': category,
        'location': location,
        'ip_address': ip,
        'device_type': random.choice(['desktop', 'mobile', 'tablet', 'unknown']),
        'channel': channel,
        'status': random.choice(['completed', 'completed', 'completed', 'pending', 'failed']),
        'transaction_date': txn_date
    }


def seed():
    app = create_app()
    with app.app_context():
        print("Clearing old data...")
        db.drop_all()
        db.create_all()

        # Users
        users_data = [
            ("admin", "admin@frauddetect.com", "Admin User", "admin", "Security Operations"),
            ("analyst1", "analyst1@frauddetect.com", "Maria Santos", "analyst", "Fraud Analytics"),
            ("analyst2", "analyst2@frauddetect.com", "Kevin Park", "analyst", "Fraud Analytics"),
            ("investigator1", "inv1@frauddetect.com", "Rachel Green", "investigator", "Investigations"),
            ("investigator2", "inv2@frauddetect.com", "Tom Bradley", "investigator", "Investigations"),
            ("viewer", "viewer@frauddetect.com", "Lisa Chang", "viewer", "Compliance"),
        ]

        users = []
        for uname, email, name, role, dept in users_data:
            u = User(username=uname, email=email, full_name=name, role=role, department=dept)
            u.set_password("password123")
            db.session.add(u)
            users.append(u)

        db.session.flush()
        print("Users created.")

        # Transactions
        from services.fraud_service import FraudDetectionService
        fraud_svc = FraudDetectionService()

        total = 1000
        fraud_target = 150  # ~15% fraud rate
        fraud_indices = set(random.sample(range(total), fraud_target))

        print(f"Seeding {total} transactions...")
        transactions = []
        for i in range(total):
            is_fraud = i in fraud_indices
            raw = make_transaction(i, is_fraud_candidate=is_fraud)
            pred = fraud_svc.predict_single({**raw, 'transaction_date': raw['transaction_date'].isoformat()})

            txn = Transaction(
                transaction_id=raw['transaction_id'],
                account_number=raw['account_number'],
                customer_name=raw['customer_name'],
                amount=raw['amount'],
                transaction_type=raw['transaction_type'],
                merchant_name=raw['merchant_name'],
                merchant_category=raw['merchant_category'],
                location=raw['location'],
                ip_address=raw['ip_address'],
                device_type=raw['device_type'],
                channel=raw['channel'],
                status=raw['status'],
                transaction_date=raw['transaction_date'],
                is_fraud=is_fraud,
                fraud_score=pred['fraud_score'],
                risk_level=pred['risk_level'],
                flagged_for_review=is_fraud and random.random() > 0.4
            )
            db.session.add(txn)
            transactions.append(txn)

        db.session.flush()
        print("Transactions created.")

        # Investigations for high-risk transactions
        inv_users = [u for u in users if u.role in ('investigator', 'analyst')]
        fraud_txns = [t for t in transactions if t.is_fraud][:40]

        statuses = ['open', 'in_progress', 'resolved', 'escalated', 'closed']
        priorities = ['low', 'medium', 'high', 'critical']

        for idx, txn in enumerate(fraud_txns):
            case_num = f"CASE-{datetime.utcnow().strftime('%Y%m')}-{(idx+1):04d}"
            status = random.choice(statuses)
            inv = Investigation(
                case_number=case_num,
                transaction_id=txn.id,
                investigator_id=random.choice(inv_users).id,
                title=f"Fraud Review: {txn.transaction_id}",
                description=f"Automated fraud detection flagged this transaction for investigation. Amount: ${txn.amount:,.2f}",
                status=status,
                priority=random.choice(priorities),
                fraud_explanation=fraud_svc.explain_prediction(txn.to_dict()),
                investigator_remarks="Under active review." if status == 'in_progress' else None,
                assigned_at=txn.transaction_date + timedelta(hours=random.randint(1, 24)),
                resolved_at=txn.transaction_date + timedelta(days=random.randint(1, 14)) if status in ('resolved', 'closed') else None,
                is_confirmed_fraud=True if status in ('resolved', 'closed') else None
            )
            db.session.add(inv)
            db.session.flush()

            # Add notes
            for _ in range(random.randint(1, 3)):
                note_texts = [
                    "Initial review completed. Transaction pattern is suspicious.",
                    "Customer contacted. Account holder confirms they did not initiate this transaction.",
                    "IP geolocation shows transaction originated from high-risk region.",
                    "Similar pattern found in 3 other accounts this week. Escalating.",
                    "Transaction reversed and customer notified.",
                    "Evidence collected. Forwarding to law enforcement."
                ]
                note = CaseNote(
                    investigation_id=inv.id,
                    author_id=random.choice(inv_users).id,
                    note_text=random.choice(note_texts),
                    note_type=random.choice(['comment', 'action', 'evidence'])
                )
                db.session.add(note)

        db.session.commit()
        print("Seed complete!")
        print("  Default login: admin / password123")


if __name__ == '__main__':
    seed()
