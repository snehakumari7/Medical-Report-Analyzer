# Website Upload-To-Analysis Workflow

## What Was Added

The website upload screen now connects to the backend analysis pipeline:

1. Upload report file.
2. Click `Extract and analyze report`.
3. Backend runs OCR.
4. Backend extracts supported medical parameters.
5. Backend classifies abnormalities.
6. Website displays:
   - health score
   - extracted parameter table
   - severity/status badges
   - risk indicators
   - recommendations
   - non-diagnostic disclaimer
7. Click `Generate AI summary` to request:
   - simple summary
   - detailed explanation
   - lifestyle suggestions
   - questions to ask doctor

## Backend Endpoint

```text
POST /analyze-uploaded-report
```

Request:

```json
{
  "file_id": "uploaded_file_id_from_upload_response",
  "filename": "original-report.pdf"
}
```

## Run Locally

Backend:

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8010
```

Frontend:

```bash
cd frontend
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

## Troubleshooting

### Analysis failed after upload

Cause: OCR could not extract text, Tesseract is missing, or the PDF is image-only.

Fix: For images, install Tesseract and set `TESSERACT_CMD`. For PDFs, use a text-based PDF until scanned-PDF OCR is added.

### AI summary failed

Cause: `GROQ_API_KEY` is missing, Groq timed out, or Groq returned invalid/empty JSON.

Fix: Set a valid Groq key in `.env`, restart backend, and try again:

```text
GROQ_API_KEY=your_real_key_here
```

### Network error

Cause: Frontend cannot reach backend.

Fix: Confirm backend is running:

```text
http://127.0.0.1:8010/health
```

### Port 8000 blocked

Cause: Windows may block port `8000`.

Fix: Use port `8010` for backend.
