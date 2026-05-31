# Phase 1 Setup

Project: AI-Powered Visual Medical Report Analyzer

This milestone creates the project scaffold only. It defines the frontend, backend, documentation folders, dependency manifests, and environment variable template. Business logic, endpoints, database models, OCR pipelines, AI analysis, and UI components are intentionally deferred to later milestones.

## Folder Tree

```text
.
├── .env.example
├── backend
│   ├── alembic
│   │   └── versions
│   ├── app
│   │   ├── api
│   │   │   └── v1
│   │   ├── core
│   │   ├── db
│   │   ├── models
│   │   ├── repositories
│   │   ├── schemas
│   │   ├── services
│   │   └── utils
│   ├── requirements.txt
│   └── tests
│       ├── api
│       └── services
├── docs
│   └── phase-1-setup.md
└── frontend
    ├── package.json
    └── src
        ├── app
        ├── assets
        ├── components
        │   └── ui
        ├── features
        ├── hooks
        ├── lib
        ├── pages
        ├── routes
        ├── services
        └── types
```

## Installation Commands

### Frontend

```bash
cd frontend
npm install
```

Vite, React, TypeScript, Tailwind CSS, Shadcn UI support packages, React Router, React Query, Axios, Recharts, Zod, and common UI utilities are declared in `package.json`.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

FastAPI, SQLAlchemy, Alembic, PostgreSQL driver, Pydantic, OCR libraries, AI API support, and testing/linting tools are declared in `requirements.txt`.

### Environment

```bash
copy .env.example .env
```

Update `DATABASE_URL`, `POSTGRES_PASSWORD`, `GROQ_API_KEY`, `SECRET_KEY`, and `TESSERACT_CMD` for your machine or deployment platform.

## Expected Output

After this phase, the repository contains a clean full-stack structure ready for incremental implementation. There is no running app yet because Phase 1 is limited to project setup and folder structure.

## Troubleshooting

### `npm install` fails

Cause: Node.js is missing or too old.

Fix:

```bash
node --version
npm --version
```

Install Node.js 20 LTS or newer, then rerun `npm install`.

### Python virtual environment fails

Cause: Python is not installed or not on PATH.

Fix:

```bash
python --version
```

Install Python 3.11 or newer and rerun the virtual environment commands.

### PostgreSQL connection fails later

Cause: PostgreSQL is not running, the database does not exist, or credentials do not match `.env`.

Fix:

```bash
psql -U postgres
CREATE DATABASE medical_report_analyzer;
CREATE USER medical_report_user WITH PASSWORD 'change_me';
GRANT ALL PRIVILEGES ON DATABASE medical_report_analyzer TO medical_report_user;
```

Then update `.env` with secure production credentials.

### Tesseract OCR fails later

Cause: The Tesseract executable is not installed or `TESSERACT_CMD` is empty on systems where it cannot be auto-detected.

Fix:

Install Tesseract OCR and set `TESSERACT_CMD` to the executable path, for example:

```bash
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### Groq API requests fail later

Cause: `GROQ_API_KEY` is missing, invalid, or restricted.

Fix:

Create a valid Groq API key, place it in `.env`, and verify model access in GroqCloud.
