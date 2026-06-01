# AI-Powered Visual Medical Report Analyzer

A full-stack healthcare SaaS-style application for uploading medical reports, extracting values with OCR, classifying abnormal parameters, generating AI summaries, and visualizing health trends over time.

The app does not diagnose diseases. It classifies report values against reference ranges and provides educational explanations only.

## Features

- Secure report upload for PDF, PNG, JPG, and JPEG files
- File validation with 20MB size limit and corrupted-file rejection
- OCR extraction with `pdfplumber`, Tesseract OCR, OpenCV, and Pillow
- Regex-based medical parameter extraction
- Abnormality classification and health score generation
- Groq AI summary generation
- Login/sign-up flow using local browser storage
- Real-data dashboard with no demo data for new users
- History, analytics, trend charts, radar chart, severity cards, report table
- BMI calculator
- FastAPI Swagger documentation

## Tech Stack

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios
- React Query
- Recharts

Backend:

- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- PostgreSQL

OCR and AI:

- Tesseract OCR
- OpenCV
- Pillow
- pdfplumber
- Groq OpenAI-compatible API

## Project Structure

```text
Medical Report Analyser/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── data/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── docs/
├── .env.example
└── README.md
```

## Environment Variables

Do not commit real secrets. This repo includes `.env.example` as a template.

After cloning, create your own `.env` file:

```powershell
copy .env.example .env
```

Then edit `.env` and add your own values:

```env
VITE_API_BASE_URL=http://127.0.0.1:8011
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8011
BACKEND_CORS_ORIGINS=http://localhost:5174,http://127.0.0.1:5174

GROQ_API_KEY=replace_with_your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_API_BASE_URL=https://api.groq.com/openai/v1
```

Each developer must use their own Groq API key.

## Required Ports

Use these ports consistently:

- Frontend: `http://127.0.0.1:5174`
- Backend: `http://127.0.0.1:8011`
- API Docs: `http://127.0.0.1:8011/docs`

## Backend Setup

```powershell
cd "backend"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Run the backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8011 --reload
```

Health check:

```text
http://127.0.0.1:8011/health
```

Expected response:

```json
{"status":"ok"}
```

## Frontend Setup

```powershell
cd "frontend"
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5174
```

## App Workflow

1. Sign up or login.
2. Open Report Viewer.
3. Upload a PDF, PNG, JPG, or JPEG medical report.
4. Click Upload report.
5. Click Extract and analyze report.
6. Generate the AI summary.
7. View Dashboard, Analytics, and History.

New users will not see demo health data. Charts and history populate only after real report analysis.

## API Endpoints

Core endpoints:

- `GET /health`
- `POST /upload`
- `POST /analyze-uploaded-report`
- `POST /generate-ai-summary`
- CRUD endpoints for users, reports, extracted parameters, health scores, and AI summaries

Swagger docs:

```text
http://127.0.0.1:8011/docs
```

## Tests

Backend:

```powershell
cd "backend"
.\.venv\Scripts\python.exe -m pytest --basetemp C:\tmp\medical-report-pytest
```

Frontend:

```powershell
cd "frontend"
npm test -- --run
```

Frontend production build:

```powershell
cd "frontend"
npm run build
```

## Troubleshooting

### Upload says network error

Make sure both servers are running:

```text
Frontend: http://127.0.0.1:5174
Backend:  http://127.0.0.1:8011/health
```

Also confirm `.env` contains:

```env
VITE_API_BASE_URL=http://127.0.0.1:8011
```

After changing env values, restart the frontend dev server.

### Browser still uses old code

Hard refresh:

```text
Ctrl + F5
```

### AI summary fails

Check that `.env` contains a valid Groq key:

```env
GROQ_API_KEY=your_key_here
```

Restart the backend after changing `.env`.

### OCR fails for images

Install Tesseract OCR and set `TESSERACT_CMD` in `.env` if it is not available on PATH.

Example:

```env
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### Pytest temp permission error on Windows

Use a writable base temp directory:

```powershell
.\.venv\Scripts\python.exe -m pytest --basetemp C:\tmp\medical-report-pytest
```

## Security Notes

- Do not commit `.env`.
- Use `.env.example` only for safe placeholder values.
- Uploaded reports are stored locally under backend storage and are ignored by git.
- AI explanations are educational and should not be treated as medical diagnosis.

## Medical Disclaimer

This project is for educational and assistive analysis only. It does not diagnose, treat, cure, or prevent disease. Users should consult a qualified healthcare professional for medical advice.
