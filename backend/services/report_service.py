import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

REPORTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'reports')

class ReportService:
    def __init__(self):
        os.makedirs(REPORTS_DIR, exist_ok=True)

    def generate(self, report_id: str, report_type: str, params: dict) -> str:
        file_path = os.path.join(REPORTS_DIR, f'{report_id}.pdf')

        dispatch = {
            'fraud_summary': self._fraud_summary,
            'investigation_report': self._investigation_report,
            'transaction_audit': self._transaction_audit,
            'risk_assessment': self._risk_assessment,
        }
        dispatch.get(report_type, self._generic)(file_path, params)
        return file_path

    def _get_doc_and_styles(self, file_path):
        doc = SimpleDocTemplate(
            file_path, pagesize=A4,
            topMargin=0.75*inch, bottomMargin=0.75*inch,
            leftMargin=0.75*inch, rightMargin=0.75*inch
        )
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            'BrandTitle', parent=styles['Title'],
            textColor=colors.HexColor('#1e3a5f'), fontSize=22, spaceAfter=4
        ))
        styles.add(ParagraphStyle(
            'SubTitle', parent=styles['Normal'],
            textColor=colors.HexColor('#64748b'), fontSize=10, spaceAfter=2
        ))
        styles.add(ParagraphStyle(
            'SectionHeader', parent=styles['Heading2'],
            textColor=colors.HexColor('#2563eb'), fontSize=13, spaceBefore=14, spaceAfter=6
        ))
        return doc, styles

    def _header(self, styles, subtitle):
        return [
            Paragraph("FraudGuard AI Detection System", styles['BrandTitle']),
            Paragraph(subtitle, styles['SectionHeader']),
            Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}", styles['SubTitle']),
            HRFlowable(width="100%", color=colors.HexColor('#2563eb'), thickness=1.5),
            Spacer(1, 0.2*inch),
        ]

    def _styled_table(self, data, col_widths):
        t = Table(data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4ff')]),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ]))
        return t

    def _fraud_summary(self, file_path, params):
        from models.transaction import Transaction
        from app import db
        from sqlalchemy import func

        doc, styles = self._get_doc_and_styles(file_path)
        story = self._header(styles, "Fraud Summary Report")

        total = Transaction.query.count()
        fraud_count = Transaction.query.filter_by(is_fraud=True).count()
        fraud_amount = db.session.query(func.sum(Transaction.amount)).filter_by(is_fraud=True).scalar() or 0
        flagged = Transaction.query.filter_by(flagged_for_review=True).count()

        # KPI table
        kpi_data = [
            ['Metric', 'Value'],
            ['Total Transactions Analyzed', f'{total:,}'],
            ['Fraudulent Transactions', f'{fraud_count:,}'],
            ['Fraud Rate', f'{(fraud_count/total*100):.2f}%' if total else '0%'],
            ['Total Fraud Amount', f'${float(fraud_amount):,.2f}'],
            ['Flagged for Review', f'{flagged:,}'],
        ]
        story.append(Paragraph("Executive Summary", styles['SectionHeader']))
        story.append(self._styled_table(kpi_data, [3*inch, 3*inch]))
        story.append(Spacer(1, 0.2*inch))

        # Risk breakdown
        risk_data = [['Risk Level', 'Count', 'Percentage']]
        for level in ['critical', 'high', 'medium', 'low']:
            cnt = Transaction.query.filter_by(risk_level=level).count()
            pct = f'{(cnt/total*100):.1f}%' if total else '0%'
            risk_data.append([level.upper(), str(cnt), pct])

        story.append(Paragraph("Risk Level Breakdown", styles['SectionHeader']))
        story.append(self._styled_table(risk_data, [2*inch, 2*inch, 2*inch]))
        story.append(Spacer(1, 0.2*inch))

        # Recent frauds
        recent = Transaction.query.filter_by(is_fraud=True)\
            .order_by(Transaction.transaction_date.desc()).limit(25).all()

        if recent:
            story.append(Paragraph("Recent Fraudulent Transactions", styles['SectionHeader']))
            rows = [['Transaction ID', 'Customer', 'Amount', 'Risk', 'Channel', 'Date']]
            for t in recent:
                rows.append([
                    t.transaction_id,
                    t.customer_name or '-',
                    f'${t.amount:,.2f}',
                    t.risk_level.upper(),
                    t.channel or '-',
                    t.transaction_date.strftime('%Y-%m-%d %H:%M'),
                ])
            story.append(self._styled_table(rows, [1.4*inch, 1.2*inch, 1*inch, 0.8*inch, 0.8*inch, 1.3*inch]))

        doc.build(story)

    def _investigation_report(self, file_path, params):
        from models.investigation import Investigation

        doc, styles = self._get_doc_and_styles(file_path)
        story = self._header(styles, "Investigation Report")

        investigations = Investigation.query.order_by(Investigation.created_at.desc()).limit(50).all()

        counts = {'open': 0, 'in_progress': 0, 'resolved': 0, 'escalated': 0, 'closed': 0}
        for inv in investigations:
            counts[inv.status] = counts.get(inv.status, 0) + 1

        summary_data = [['Status', 'Count']] + [[s.replace('_', ' ').title(), str(c)] for s, c in counts.items()]
        story.append(Paragraph("Case Status Summary", styles['SectionHeader']))
        story.append(self._styled_table(summary_data, [3*inch, 3*inch]))
        story.append(Spacer(1, 0.2*inch))

        if investigations:
            story.append(Paragraph("Investigation Cases", styles['SectionHeader']))
            rows = [['Case #', 'Status', 'Priority', 'Investigator', 'Created']]
            for inv in investigations:
                rows.append([
                    inv.case_number,
                    inv.status.replace('_', ' ').title(),
                    inv.priority.upper(),
                    inv.investigator.full_name if inv.investigator else 'Unassigned',
                    inv.created_at.strftime('%Y-%m-%d'),
                ])
            story.append(self._styled_table(rows, [1.5*inch, 1.1*inch, 0.9*inch, 1.5*inch, 1.1*inch]))

        doc.build(story)

    def _transaction_audit(self, file_path, params):
        from models.transaction import Transaction

        doc, styles = self._get_doc_and_styles(file_path)
        story = self._header(styles, "Transaction Audit Report")

        txns = Transaction.query.order_by(Transaction.transaction_date.desc()).limit(100).all()

        story.append(Paragraph(f"Transaction Audit Log — Last {len(txns)} Transactions", styles['SectionHeader']))
        rows = [['ID', 'Account', 'Amount', 'Type', 'Status', 'Fraud', 'Date']]
        for t in txns:
            rows.append([
                t.transaction_id,
                t.account_number,
                f'${t.amount:,.2f}',
                t.transaction_type or '-',
                t.status or '-',
                'YES' if t.is_fraud else 'No',
                t.transaction_date.strftime('%Y-%m-%d'),
            ])
        story.append(self._styled_table(rows, [1.2*inch, 1*inch, 0.9*inch, 0.8*inch, 0.8*inch, 0.6*inch, 1*inch]))
        doc.build(story)

    def _risk_assessment(self, file_path, params):
        from models.transaction import Transaction
        from app import db
        from sqlalchemy import func

        doc, styles = self._get_doc_and_styles(file_path)
        story = self._header(styles, "Risk Assessment Report")

        story.append(Paragraph("Risk Score Distribution", styles['SectionHeader']))

        buckets = [
            ('0% – 30%  (Low Risk)',      Transaction.fraud_score < 0.3),
            ('30% – 50% (Medium Risk)',   (Transaction.fraud_score >= 0.3) & (Transaction.fraud_score < 0.5)),
            ('50% – 70% (High Risk)',     (Transaction.fraud_score >= 0.5) & (Transaction.fraud_score < 0.7)),
            ('70% – 85% (Very High)',     (Transaction.fraud_score >= 0.7) & (Transaction.fraud_score < 0.85)),
            ('85%+       (Critical)',     Transaction.fraud_score >= 0.85),
        ]
        rows = [['Score Range', 'Transaction Count']]
        for label, condition in buckets:
            cnt = Transaction.query.filter(condition).count()
            rows.append([label, str(cnt)])

        story.append(self._styled_table(rows, [3.5*inch, 2.5*inch]))

        # Top risky accounts
        story.append(Paragraph("Highest Risk Accounts", styles['SectionHeader']))
        risky = db.session.query(
            Transaction.account_number,
            func.count(Transaction.id).label('fraud_count'),
            func.avg(Transaction.fraud_score).label('avg_score')
        ).filter_by(is_fraud=True)\
         .group_by(Transaction.account_number)\
         .order_by(func.count(Transaction.id).desc())\
         .limit(15).all()

        if risky:
            acct_rows = [['Account Number', 'Fraud Transactions', 'Avg Risk Score']]
            for r in risky:
                acct_rows.append([r.account_number, str(r.fraud_count), f'{float(r.avg_score)*100:.1f}%'])
            story.append(self._styled_table(acct_rows, [2.5*inch, 2*inch, 2*inch]))

        doc.build(story)

    def _generic(self, file_path, params):
        doc, styles = self._get_doc_and_styles(file_path)
        story = self._header(styles, "System Report")
        story.append(Paragraph("Report generated successfully.", styles['Normal']))
        doc.build(story)
