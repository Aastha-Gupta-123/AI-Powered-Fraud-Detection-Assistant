import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml', 'fraud_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml', 'scaler.pkl')

RISK_THRESHOLDS = {
    'low': 0.3,
    'medium': 0.5,
    'high': 0.7,
    'critical': 0.85
}

FRAUD_INDICATORS = [
    "Transaction amount significantly exceeds customer's average spending pattern",
    "Geographic anomaly detected - transaction location differs from usual activity area",
    "Multiple rapid transactions detected from same account within short timeframe",
    "High-risk merchant category associated with this transaction",
    "Transaction initiated from an unrecognized device or IP address",
    "Unusual transaction time - activity outside normal banking hours",
    "Transaction channel inconsistent with customer's historical behavior",
    "Velocity check triggered - spending limit threshold approached",
    "Account accessed from multiple locations in a short period",
    "Transaction pattern matches known fraud signature profiles"
]

class FraudDetectionService:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            self.model = joblib.load(MODEL_PATH)
            self.scaler = joblib.load(SCALER_PATH)
        else:
            self._train_on_mock_data()

    def _extract_features(self, txn: dict) -> list:
        amount = float(txn.get('amount', 0))
        hour = 0
        try:
            from datetime import datetime
            dt_str = txn.get('transaction_date', '')
            if dt_str:
                dt = datetime.fromisoformat(str(dt_str).replace('Z', ''))
                hour = dt.hour
        except:
            pass

        channel_map = {'online': 0, 'atm': 1, 'branch': 2, 'mobile': 3, 'pos': 4}
        type_map = {'debit': 0, 'credit': 1, 'transfer': 2, 'withdrawal': 3, 'deposit': 4}

        channel = channel_map.get(txn.get('channel', 'online'), 0)
        txn_type = type_map.get(txn.get('transaction_type', 'debit'), 0)

        is_night = 1 if hour < 6 or hour > 22 else 0
        is_high_amount = 1 if amount > 5000 else 0
        is_very_high = 1 if amount > 15000 else 0

        return [amount, hour, channel, txn_type, is_night, is_high_amount, is_very_high]

    def _train_on_mock_data(self):
        np.random.seed(42)
        n = 2000

        amounts_normal = np.random.exponential(500, int(n * 0.85))
        amounts_fraud = np.random.exponential(3000, int(n * 0.15))
        amounts = np.concatenate([amounts_normal, amounts_fraud])

        hours_normal = np.random.choice(range(8, 22), int(n * 0.85))
        hours_fraud = np.random.choice(list(range(0, 6)) + list(range(22, 24)), int(n * 0.15))
        hours = np.concatenate([hours_normal, hours_fraud])

        channels = np.random.randint(0, 5, n)
        txn_types = np.random.randint(0, 5, n)
        is_night = (hours < 6) | (hours > 22)
        is_high = amounts > 5000
        is_very_high = amounts > 15000

        X = np.column_stack([amounts, hours, channels, txn_types,
                             is_night.astype(int), is_high.astype(int), is_very_high.astype(int)])
        y = np.concatenate([np.zeros(int(n * 0.85)), np.ones(int(n * 0.15))])

        idx = np.random.permutation(len(y))
        X, y = X[idx], y[idx]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        self.scaler.fit(X_train)
        X_train_scaled = self.scaler.transform(X_train)

        self.model = RandomForestClassifier(
            n_estimators=100, max_depth=10, random_state=42,
            class_weight='balanced', n_jobs=-1
        )
        self.model.fit(X_train_scaled, y_train)

        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)

    def predict_single(self, txn: dict) -> dict:
        features = self._extract_features(txn)
        X = np.array([features])
        X_scaled = self.scaler.transform(X)

        proba = self.model.predict_proba(X_scaled)[0][1]
        is_fraud = proba >= 0.5

        if proba >= RISK_THRESHOLDS['critical']:
            risk = 'critical'
        elif proba >= RISK_THRESHOLDS['high']:
            risk = 'high'
        elif proba >= RISK_THRESHOLDS['medium']:
            risk = 'medium'
        else:
            risk = 'low'

        return {
            'is_fraud': bool(is_fraud),
            'fraud_score': round(float(proba), 4),
            'risk_level': risk
        }

    def batch_predict(self, rows: list) -> list:
        results = []
        for row in rows:
            pred = self.predict_single(row)
            pred.update({
                'transaction_id': row.get('transaction_id', ''),
                'amount': row.get('amount', 0)
            })
            results.append(pred)
        return results

    def explain_prediction(self, txn: dict) -> str:
        pred = self.predict_single(txn)
        score = pred['fraud_score']

        if score < 0.3:
            return "Transaction appears normal. No significant fraud indicators detected. Risk score is within acceptable limits."

        indicators = []
        features = self._extract_features(txn)
        amount, hour, channel, txn_type, is_night, is_high, is_very_high = features

        if is_very_high:
            indicators.append(FRAUD_INDICATORS[0])
        if is_night:
            indicators.append(FRAUD_INDICATORS[5])
        if channel == 0 and is_high:  # online + high amount
            indicators.append(FRAUD_INDICATORS[4])
        if txn_type == 2:  # transfer
            indicators.append(FRAUD_INDICATORS[7])
        if not indicators:
            indicators.append(FRAUD_INDICATORS[9])

        explanation = f"Fraud probability score: {score:.1%}. "
        explanation += f"Risk level classified as '{pred['risk_level'].upper()}'. "
        explanation += "Key risk factors identified: " + "; ".join(indicators[:3]) + "."
        return explanation

    def retrain(self, transactions: list) -> dict:
        if len(transactions) < 100:
            return {'error': 'Insufficient data'}

        features = [self._extract_features(t) for t in transactions]
        labels = [1 if t.get('is_fraud') else 0 for t in transactions]

        X = np.array(features)
        y = np.array(labels)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.scaler.fit(X_train)

        self.model = RandomForestClassifier(n_estimators=100, max_depth=10,
                                            random_state=42, class_weight='balanced')
        self.model.fit(self.scaler.transform(X_train), y_train)

        y_pred = self.model.predict(self.scaler.transform(X_test))
        auc = roc_auc_score(y_test, y_pred) if len(set(y_test)) > 1 else 0

        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)

        return {'status': 'success', 'auc_score': round(auc, 4), 'samples_trained': len(X_train)}
