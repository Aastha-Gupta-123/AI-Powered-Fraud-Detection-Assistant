"""
Rule-based AI chat engine that simulates a fraud analyst assistant.
Handles intents: transaction lookup, risk explanation, stats, recommendations, general fraud Q&A.
"""
import re
from datetime import datetime, timedelta

INVESTIGATION_STEPS = {
    'critical': [
        "Immediately freeze the account to prevent further unauthorized activity",
        "Contact the account holder via registered phone number for verification",
        "File a Suspicious Activity Report (SAR) within 24 hours",
        "Preserve all transaction logs and IP address records",
        "Escalate to senior fraud analyst and compliance team",
        "Initiate chargeback process if funds are still recoverable"
    ],
    'high': [
        "Place a temporary hold on the flagged transaction",
        "Contact customer to verify if they authorized this transaction",
        "Review the last 30 days of account activity for similar patterns",
        "Check if the IP address or device is recognized",
        "Document findings and update the investigation case",
        "Escalate if customer cannot be reached within 2 hours"
    ],
    'medium': [
        "Flag the transaction for secondary review",
        "Send an automated verification SMS/email to the customer",
        "Monitor account for additional suspicious activity over next 48 hours",
        "Review merchant history and category for known fraud patterns",
        "Update risk profile if pattern persists"
    ],
    'low': [
        "Log the transaction for audit trail purposes",
        "Monitor for repeated patterns from same account",
        "No immediate action required — continue routine monitoring"
    ]
}

FRAUD_PATTERNS = {
    'account_takeover': {
        'name': 'Account Takeover (ATO)',
        'indicators': ['login from new device', 'password changed recently', 'contact info updated', 'unusual location'],
        'description': 'A third party gains unauthorized access to a legitimate account and conducts fraudulent transactions.'
    },
    'card_not_present': {
        'name': 'Card-Not-Present (CNP) Fraud',
        'indicators': ['online transaction', 'high amount', 'international merchant', 'new delivery address'],
        'description': 'Fraudulent use of card details for online purchases without the physical card.'
    },
    'money_mule': {
        'name': 'Money Mule Activity',
        'indicators': ['multiple transfers', 'round amounts', 'foreign recipients', 'rapid fund movement'],
        'description': 'Account used to transfer illicitly obtained funds to obscure their origin.'
    },
    'synthetic_identity': {
        'name': 'Synthetic Identity Fraud',
        'indicators': ['new account', 'limited history', 'rapid credit utilization', 'unusual spending'],
        'description': 'Fraudsters combine real and fake information to create a new identity for financial gain.'
    }
}

GENERAL_ANSWERS = {
    'what is fraud score': "A fraud score is a probability value between 0% and 100% that indicates how likely a transaction is fraudulent. Scores above 85% are critical, 70-85% are high risk, 50-70% are medium risk, and below 30% are considered low risk.",
    'how does risk scoring work': "Risk scoring uses a Random Forest machine learning model trained on thousands of transactions. It analyzes 7 key features: transaction amount, time of day, channel type, transaction type, night-time flag, high-amount flag, and very-high-amount flag. The model combines 100 decision trees and returns a probability score.",
    'what is random forest': "Random Forest is a machine learning algorithm that builds 100 decision trees, each trained on different subsets of data. For fraud detection, each tree votes whether a transaction is fraud or legitimate. The final score is the percentage of trees that voted fraud — giving a robust, reliable prediction.",
    'what is aml': "AML stands for Anti-Money Laundering. It refers to laws, regulations, and procedures intended to prevent criminals from disguising illegally obtained funds as legitimate income. Our system flags transactions that match known money laundering patterns.",
    'what is sar': "A Suspicious Activity Report (SAR) is a document financial institutions must file with regulatory authorities when they detect suspicious transactions that may indicate money laundering, fraud, or other financial crimes. SARs must typically be filed within 30 days of detection.",
    'what is chargeback': "A chargeback is a transaction reversal initiated by a bank to refund a customer who reports an unauthorized or disputed transaction. For fraud cases, initiating a chargeback quickly is critical before funds are withdrawn by the fraudster.",
    'what is kyc': "KYC stands for Know Your Customer — a mandatory process banks use to verify the identity of clients and assess potential risks of illegal intentions. It includes ID verification, address proof, and ongoing transaction monitoring.",
    'types of fraud': "Common fraud types we monitor include: Card-Not-Present (CNP) fraud, Account Takeover (ATO), Money Mule activity, Synthetic Identity fraud, Phishing-related fraud, Wire fraud, and ATM skimming. Each has distinct transaction patterns our model recognizes.",
    'help': "I can help you with:\n• **Transaction Analysis** — ask 'analyze transaction TXN123' or 'why was TXN123 flagged'\n• **Risk Scores** — ask 'explain risk score 92' or 'what does score 75 mean'\n• **Statistics** — ask 'show fraud summary' or 'today's stats'\n• **Recommendations** — ask 'what should I do for high risk transaction'\n• **Find Transaction** — ask 'find transaction TXN123'\n• **Fraud Patterns** — ask 'explain account takeover' or 'what is CNP fraud'\n• **General Questions** — ask about AML, SAR, KYC, chargebacks"
}

class ChatEngine:
    def __init__(self):
        self.intent_patterns = [
            (r'\b(why|reason|flagged|suspicious|why was|explain why)\b.*\b(TXN\w+)\b', 'analyze_transaction'),
            (r'\b(analyze|analysis|details|info|about)\b.*\b(TXN\w+)\b', 'analyze_transaction'),
            (r'\b(find|search|lookup|locate|get)\b.*\b(TXN\w+)\b', 'find_transaction'),
            (r'\b(TXN\w+)\b', 'find_transaction'),
            (r'\b(explain|what.*mean|interpret)\b.*\b(risk score|score)\b.*\b(\d+)\b', 'explain_score'),
            (r'\b(risk score|score)\b.*\b(\d+)\b', 'explain_score'),
            (r'\bscore\s+(?:is\s+)?(\d+)\b', 'explain_score'),
            (r'\b(summary|stats|statistics|overview|today|dashboard|how many)\b', 'fraud_stats'),
            (r'\b(what should|recommend|next steps|action|what to do|advice)\b', 'recommendations'),
            (r'\b(account takeover|ato)\b', 'fraud_pattern_ato'),
            (r'\b(card.?not.?present|cnp)\b', 'fraud_pattern_cnp'),
            (r'\b(money mule|mule)\b', 'fraud_pattern_mule'),
            (r'\b(synthetic identity|synthetic fraud)\b', 'fraud_pattern_synthetic'),
            (r'\b(hello|hi|hey|good morning|good afternoon|greet)\b', 'greeting'),
            (r'\b(help|what can you do|capabilities|commands)\b', 'help'),
        ]

    def detect_intent(self, message: str):
        msg = message.lower().strip()
        for pattern, intent in self.intent_patterns:
            if re.search(pattern, msg, re.IGNORECASE):
                return intent

        # Check general answers
        for key in GENERAL_ANSWERS:
            if key in msg:
                return 'general_qa'

        return 'unknown'

    def extract_txn_id(self, message: str):
        match = re.search(r'\b(TXN\w+)\b', message, re.IGNORECASE)
        return match.group(1).upper() if match else None

    def extract_score(self, message: str):
        match = re.search(r'\b(\d{1,3})\b', message)
        return int(match.group(1)) if match else None

    def process(self, message: str, user_id: int) -> dict:
        intent = self.detect_intent(message)
        response = self._route(intent, message, user_id)
        return {'intent': intent, 'response': response}

    def _route(self, intent: str, message: str, user_id: int) -> str:
        if intent == 'greeting':
            return self._greeting()
        elif intent == 'help':
            return GENERAL_ANSWERS['help']
        elif intent == 'analyze_transaction':
            txn_id = self.extract_txn_id(message)
            return self._analyze_transaction(txn_id) if txn_id else "Please provide a transaction ID. Example: *Why was TXN20240101001 flagged?*"
        elif intent == 'find_transaction':
            txn_id = self.extract_txn_id(message)
            return self._find_transaction(txn_id) if txn_id else "Please provide a transaction ID. Example: *Find transaction TXN20240101001*"
        elif intent == 'explain_score':
            score = self.extract_score(message)
            return self._explain_score(score) if score else "Please provide a score value. Example: *Explain risk score 85*"
        elif intent == 'fraud_stats':
            return self._fraud_stats()
        elif intent == 'recommendations':
            return self._recommendations(message)
        elif intent.startswith('fraud_pattern_'):
            pattern_key = intent.replace('fraud_pattern_', '')
            pattern_map = {'ato': 'account_takeover', 'cnp': 'card_not_present', 'mule': 'money_mule', 'synthetic': 'synthetic_identity'}
            return self._fraud_pattern(pattern_map.get(pattern_key, 'account_takeover'))
        elif intent == 'general_qa':
            for key, answer in GENERAL_ANSWERS.items():
                if key in message.lower():
                    return answer
        return self._fallback(message)

    def _greeting(self) -> str:
        hour = datetime.utcnow().hour
        time_str = "Good morning" if hour < 12 else "Good afternoon" if hour < 17 else "Good evening"
        return (f"{time_str}! I'm **FraudGuard AI Assistant**, your intelligent fraud investigation partner.\n\n"
                f"I can help you:\n"
                f"• Analyze flagged transactions\n"
                f"• Explain risk scores\n"
                f"• Provide investigation recommendations\n"
                f"• Show fraud statistics\n"
                f"• Answer fraud-related questions\n\n"
                f"Type **help** to see all commands, or ask me anything about a transaction.")

    def _analyze_transaction(self, txn_id: str) -> str:
        from models.transaction import Transaction
        txn = Transaction.query.filter(
            Transaction.transaction_id.ilike(f'%{txn_id}%')
        ).first()

        if not txn:
            return (f"Transaction **{txn_id}** was not found in the database.\n\n"
                    f"Please verify the transaction ID and try again. You can find transaction IDs in the **Transactions** module.")

        score_pct = round(txn.fraud_score * 100, 1)
        risk_emoji = {'critical': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🟢'}.get(txn.risk_level, '⚪')

        reasons = self._build_reasons(txn)
        steps = INVESTIGATION_STEPS.get(txn.risk_level, INVESTIGATION_STEPS['medium'])

        response = f"**Analysis: {txn.transaction_id}** {risk_emoji}\n\n"
        response += f"**Verdict:** {'⚠️ FRAUDULENT' if txn.is_fraud else '✅ LEGITIMATE'}\n"
        response += f"**Risk Score:** {score_pct}% ({txn.risk_level.upper()})\n"
        response += f"**Amount:** ${txn.amount:,.2f}\n"
        response += f"**Customer:** {txn.customer_name}\n"
        response += f"**Channel:** {txn.channel} | **Type:** {txn.transaction_type}\n"
        response += f"**Merchant:** {txn.merchant_name}\n"
        response += f"**Date:** {txn.transaction_date.strftime('%b %d, %Y at %H:%M')}\n\n"

        if reasons:
            response += f"**Why it was flagged:**\n"
            for r in reasons:
                response += f"• {r}\n"
            response += "\n"

        if txn.is_fraud or txn.risk_level in ('high', 'critical'):
            response += f"**Recommended Actions:**\n"
            for s in steps[:3]:
                response += f"• {s}\n"

        return response

    def _find_transaction(self, txn_id: str) -> str:
        from models.transaction import Transaction
        txn = Transaction.query.filter(
            Transaction.transaction_id.ilike(f'%{txn_id}%')
        ).first()

        if not txn:
            return f"No transaction found matching **{txn_id}**. Please check the ID and try again."

        score_pct = round(txn.fraud_score * 100, 1)
        risk_emoji = {'critical': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🟢'}.get(txn.risk_level, '⚪')

        response = f"**Transaction Found** {risk_emoji}\n\n"
        response += f"| Field | Value |\n"
        response += f"|-------|-------|\n"
        response += f"| ID | {txn.transaction_id} |\n"
        response += f"| Customer | {txn.customer_name} |\n"
        response += f"| Account | {txn.account_number} |\n"
        response += f"| Amount | ${txn.amount:,.2f} |\n"
        response += f"| Type | {txn.transaction_type} |\n"
        response += f"| Channel | {txn.channel} |\n"
        response += f"| Merchant | {txn.merchant_name} |\n"
        response += f"| Location | {txn.location} |\n"
        response += f"| Status | {txn.status} |\n"
        response += f"| Fraud Status | {'⚠️ FRAUD' if txn.is_fraud else '✅ Legitimate'} |\n"
        response += f"| Risk Score | {score_pct}% |\n"
        response += f"| Risk Level | {txn.risk_level.upper()} |\n"
        response += f"| Date | {txn.transaction_date.strftime('%b %d, %Y %H:%M')} |\n"

        if txn.investigation:
            response += f"\n**Active Investigation:** {txn.investigation.case_number} ({txn.investigation.status})"

        return response

    def _explain_score(self, score: int) -> str:
        if score >= 85:
            level, emoji, desc = 'CRITICAL', '🔴', 'extremely high probability of fraud'
            action = "Immediate account freeze and SAR filing required."
        elif score >= 70:
            level, emoji, desc = 'HIGH', '🟠', 'strong indicators of fraudulent activity'
            action = "Transaction should be held pending customer verification."
        elif score >= 50:
            level, emoji, desc = 'MEDIUM', '🟡', 'moderate risk requiring review'
            action = "Flag for secondary review and send customer verification."
        elif score >= 30:
            level, emoji, desc = 'LOW-MEDIUM', '🟡', 'slightly elevated risk'
            action = "Monitor account activity over the next 48 hours."
        else:
            level, emoji, desc = 'LOW', '🟢', 'normal transaction behavior'
            action = "No immediate action required."

        response = f"**Risk Score: {score}%** {emoji}\n\n"
        response += f"**Classification:** {level}\n"
        response += f"**Interpretation:** A score of {score}% indicates {desc}.\n\n"
        response += f"**Score Breakdown:**\n"
        response += f"• Scores 0–30%: Low risk — normal transaction patterns\n"
        response += f"• Scores 30–50%: Medium risk — some unusual indicators\n"
        response += f"• Scores 50–70%: High risk — multiple fraud signals present\n"
        response += f"• Scores 70–85%: Critical — strong fraud indicators\n"
        response += f"• Scores 85–100%: Critical — near-certain fraud\n\n"
        response += f"**Recommended Action:** {action}\n\n"
        response += f"**Key Contributing Factors at {score}%:**\n"

        if score >= 70:
            response += "• Transaction amount significantly above account average\n"
            response += "• Activity during high-risk hours (late night/early morning)\n"
            response += "• Online channel with high-value transfer type\n"
        elif score >= 50:
            response += "• Moderate amount exceeding typical spending\n"
            response += "• Some behavioral deviation from account history\n"
        else:
            response += "• Transaction amount within normal range\n"
            response += "• Activity during regular business hours\n"
            response += "• Familiar channel and merchant category\n"

        return response

    def _fraud_stats(self) -> str:
        from models.transaction import Transaction
        from models.investigation import Investigation
        from extensions import db
        from sqlalchemy import func

        total = Transaction.query.count()
        fraud_count = Transaction.query.filter_by(is_fraud=True).count()
        flagged = Transaction.query.filter_by(flagged_for_review=True).count()
        open_cases = Investigation.query.filter(Investigation.status.in_(['open', 'in_progress'])).count()
        critical = Transaction.query.filter_by(risk_level='critical').count()
        high = Transaction.query.filter_by(risk_level='high').count()

        fraud_amount = db.session.query(func.sum(Transaction.amount)).filter_by(is_fraud=True).scalar() or 0
        avg_score = db.session.query(func.avg(Transaction.fraud_score)).scalar() or 0

        last_24h = datetime.utcnow() - timedelta(hours=24)
        recent_fraud = Transaction.query.filter(
            Transaction.is_fraud == True,
            Transaction.transaction_date >= last_24h
        ).count()

        fraud_rate = round((fraud_count / total * 100), 2) if total else 0

        response = "**Fraud Intelligence Summary** 📊\n\n"
        response += f"**Overall Statistics:**\n"
        response += f"• Total Transactions: **{total:,}**\n"
        response += f"• Fraud Detected: **{fraud_count:,}** ({fraud_rate}% rate)\n"
        response += f"• Flagged for Review: **{flagged:,}**\n"
        response += f"• Open Investigations: **{open_cases:,}**\n\n"
        response += f"**Risk Breakdown:**\n"
        response += f"• 🔴 Critical Risk: **{critical:,}** transactions\n"
        response += f"• 🟠 High Risk: **{high:,}** transactions\n"
        response += f"• Average Risk Score: **{round(avg_score * 100, 1)}%**\n\n"
        response += f"**Financial Impact:**\n"
        response += f"• Total Fraud Amount: **${float(fraud_amount):,.2f}**\n"
        response += f"• Fraud in Last 24h: **{recent_fraud}** transactions\n\n"
        response += f"*Data refreshed in real-time from transaction database.*"

        return response

    def _recommendations(self, message: str) -> str:
        msg = message.lower()
        if any(w in msg for w in ['critical', 'high risk', 'urgent', 'freeze']):
            level = 'critical'
        elif any(w in msg for w in ['high', 'suspicious']):
            level = 'high'
        elif any(w in msg for w in ['medium', 'moderate']):
            level = 'medium'
        else:
            level = 'high'  # default to high

        steps = INVESTIGATION_STEPS[level]
        response = f"**Investigation Recommendations** ({level.upper()} risk)\n\n"
        response += f"**Immediate Actions:**\n"
        for i, step in enumerate(steps, 1):
            response += f"{i}. {step}\n"

        response += f"\n**Investigation Best Practices:**\n"
        response += f"• Document all findings in the case notes\n"
        response += f"• Maintain chain of custody for digital evidence\n"
        response += f"• Follow your institution's fraud response SOP\n"
        response += f"• Coordinate with compliance if SAR filing is needed\n"
        response += f"• Update case status as investigation progresses"

        return response

    def _fraud_pattern(self, pattern_key: str) -> str:
        p = FRAUD_PATTERNS.get(pattern_key)
        if not p:
            return "Pattern not found."

        response = f"**Fraud Pattern: {p['name']}** 🔍\n\n"
        response += f"**Description:**\n{p['description']}\n\n"
        response += f"**Key Indicators:**\n"
        for indicator in p['indicators']:
            response += f"• {indicator}\n"
        response += f"\n**Detection Approach:**\n"
        response += f"• Monitor for sudden changes in transaction behavior\n"
        response += f"• Cross-reference with device fingerprinting data\n"
        response += f"• Apply velocity checks on account activity\n"
        response += f"• Use ML risk scoring to flag anomalous patterns\n\n"
        response += f"*Ask me about other patterns: account takeover, CNP fraud, money mule, synthetic identity*"
        return response

    def _build_reasons(self, txn) -> list:
        reasons = []
        hour = txn.transaction_date.hour if txn.transaction_date else 12

        if txn.amount > 15000:
            reasons.append(f"Transaction amount ${txn.amount:,.2f} is extremely high — far above average spending")
        elif txn.amount > 5000:
            reasons.append(f"Transaction amount ${txn.amount:,.2f} exceeds normal spending threshold of $5,000")

        if hour < 6 or hour > 22:
            reasons.append(f"Transaction occurred at {hour:02d}:00 — outside normal banking hours (high-risk window)")

        if txn.transaction_type in ('transfer', 'withdrawal'):
            reasons.append(f"Transaction type '{txn.transaction_type}' is commonly associated with fraud")

        if txn.channel == 'online' and txn.amount > 3000:
            reasons.append("High-value online transaction without additional authentication flags")

        if txn.merchant_name and any(w in txn.merchant_name.lower() for w in ['unknown', 'crypto', 'bitcoin', 'casino', 'exchange', 'wire']):
            reasons.append(f"Merchant '{txn.merchant_name}' belongs to a high-risk category")

        if txn.location and any(c in txn.location for c in ['Nigeria', 'Netherlands', 'Singapore', 'India', 'Japan']):
            reasons.append(f"Transaction originated from {txn.location} — flagged geographic region")

        if not reasons:
            reasons.append(f"Combination of transaction features produced a high ML risk score of {round(txn.fraud_score*100,1)}%")

        return reasons

    def _fallback(self, message: str) -> str:
        for key, answer in GENERAL_ANSWERS.items():
            if any(word in message.lower() for word in key.split()):
                return answer

        return (f"I didn't quite understand that. Here are some things I can help with:\n\n"
                f"• **Analyze transaction** — *'Why was TXN20240101001 flagged?'*\n"
                f"• **Find transaction** — *'Find transaction TXN20240101001'*\n"
                f"• **Explain score** — *'Explain risk score 85'*\n"
                f"• **Fraud stats** — *'Show fraud summary'*\n"
                f"• **Recommendations** — *'What should I do for high risk?'*\n"
                f"• **Fraud patterns** — *'Explain account takeover'*\n\n"
                f"Type **help** for the full command list.")
