from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.investigation import Report
from models.transaction import Transaction
from app import db
from services.report_service import ReportService
import uuid
from datetime import datetime

reports_bp = Blueprint('reports', __name__)
report_service = ReportService()

@reports_bp.route('/', methods=['GET'])
@jwt_required()
def get_reports():
    reports = Report.query.order_by(Report.created_at.desc()).limit(50).all()
    return jsonify([r.to_dict() for r in reports])


@reports_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_report():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    report_type = data.get('report_type', 'fraud_summary')
    params = data.get('parameters', {})

    report_record = Report(
        report_id=f"RPT-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}",
        title=data.get('title', f'{report_type.replace("_", " ").title()} Report'),
        report_type=report_type,
        generated_by=user_id,
        parameters=params,
        status='generating'
    )
    db.session.add(report_record)
    db.session.commit()

    try:
        file_path = report_service.generate(report_record.report_id, report_type, params)
        report_record.file_path = file_path
        report_record.status = 'ready'
    except Exception as e:
        report_record.status = 'failed'
        db.session.commit()
        return jsonify({'error': str(e)}), 500

    db.session.commit()
    return jsonify(report_record.to_dict()), 201


@reports_bp.route('/<int:report_id>/download', methods=['GET'])
@jwt_required()
def download_report(report_id):
    report = Report.query.get_or_404(report_id)
    if report.status != 'ready' or not report.file_path:
        return jsonify({'error': 'Report not ready'}), 404

    return send_file(report.file_path, as_attachment=True,
                     download_name=f"{report.report_id}.pdf")
