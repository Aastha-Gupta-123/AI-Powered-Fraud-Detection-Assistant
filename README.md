# AI-Powered Fraud Detection & Investigation Assistant

A full-stack enterprise fraud monitoring platform built as a final-year engineering project with AI orchestration, API integrations, customer support automation, and Twilio-based communication support.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS v4, React Router, Recharts, Axios
- **Backend:** Python Flask, Flask-JWT-Extended, SQLAlchemy
- **Database:** MySQL 8.0
- **ML:** Scikit-learn Random Forest Classifier
- **AI Layer:** LangChain-style prompt orchestration, AI assistant workflows, and API-driven fraud analysis
- **Multimodal Ready:** Embedding-friendly document and transaction analysis for future OCR / image / report support
- **Communications:** Twilio SMS alerts and customer notification hooks
- **PDF Reports:** ReportLab

## Project Structure
```
AIfrauddetection/
├── backend/
│   ├── app.py              # Flask app factory
│   ├── config.py           # Configuration
│   ├── requirements.txt
│   ├── models/             # SQLAlchemy models
│   ├── routes/             # API blueprints
│   ├── services/           # Business logic (ML, reports)
│   ├── utils/              # Seed data script
│   └── ml/                 # Trained model artifacts (auto-generated)
├── frontend/
│   └── src/
│       ├── components/     # Layout + UI components
│       ├── pages/          # Route pages
│       ├── services/       # Axios API client
│       ├── hooks/          # Custom React hooks
│       ├── context/        # Auth context
│       └── utils/          # Helpers
└── database/
    ├── schema.sql          # MySQL DDL
    └── sample_transactions.csv
```

## Prerequisites
- Node.js 18+
- Python 3.10+
- MySQL 8.0+

## Installation

### 1. Database Setup
```sql
mysql -u root -p
CREATE DATABASE fraud_detection_db;
-- Run schema
source database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Configure DB (edit config.py or set env vars)
set DB_PASSWORD=yourpassword

# Seed database with 1000 sample transactions
python utils/seed_data.py

# Start Flask server
python app.py
```

Backend runs on: http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

## Default Login Credentials
| Role          | Username       | Password      |
|---------------|----------------|---------------|
| Admin         | admin          | password123   |
| Analyst       | analyst1       | password123   |
| Investigator  | investigator1  | password123   |
| Viewer        | viewer         | password123   |

## Features
- **Dashboard** — Live fraud stats, trend charts, recent activity feed
- **Transactions** — Searchable/filterable table with 1000+ records
- **Fraud Detection** — Single transaction scoring + batch CSV upload
- **Customer Chat** — AI assistant for customer support and fraud questions
- **Investigations** — Case management with notes and status tracking
- **Reports** — PDF report generation and download
- **Analytics** — Interactive charts (trends, risk dist, channels, merchants)
- **Advanced AI Stack** — API integrations, Twilio SMS alert hooks, and LangChain-inspired AI workflow design

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Authenticate user |
| GET | /api/dashboard/summary | Dashboard KPIs |
| GET | /api/transactions/ | List transactions (paginated) |
| GET | /api/transactions/:id | Transaction detail |
| POST | /api/fraud/predict | Single prediction |
| POST | /api/fraud/upload | Batch CSV prediction |
| GET | /api/fraud/explain/:id | AI explanation |
| GET | /api/investigations/ | List cases |
| POST | /api/investigations/ | Create case |
| PATCH | /api/investigations/:id | Update case |
| POST | /api/investigations/:id/notes | Add case note |
| POST | /api/reports/generate | Generate PDF |
| GET | /api/analytics/fraud-trends | Time series data |
| GET | /api/analytics/risk-distribution | Risk breakdown |

## ML Model
The Random Forest classifier is trained on synthetic transaction data with features:
- Transaction amount
- Hour of day
- Channel type
- Transaction type
- Risk indicators (night time, high amount flags)

Model auto-trains on first run and saves to `backend/ml/`. Retrain via `POST /api/fraud/retrain`.
