# Phase 2 Secure File Upload

## What Was Added

Backend:

- `POST /upload`
- Server-side file size validation
- Extension and media type validation
- Corrupted PDF validation with `pdfplumber`
- Corrupted image validation with Pillow
- Local file storage under `backend/storage/uploads`
- Pydantic upload response schema
- Automated endpoint tests

Frontend:

- Drag and drop upload interface
- Browse file input
- Client-side validation
- Upload progress bar
- Success state
- Error state for unsupported type, file too large, network error, and server validation errors
- Component tests

## Run Backend

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Upload test:

```bash
curl -X POST http://localhost:8000/upload -F "file=@sample-report.pdf"
```

## Run Frontend

```bash
cd frontend
npm install --cache .npm-cache
npm run dev
```

Open:

```text
http://localhost:5173
```

## Run Tests

Backend:

```bash
cd backend
.venv\Scripts\activate
pytest
```

Frontend:

```bash
cd frontend
npm test -- --run
```

Build:

```bash
cd frontend
npm run build
```

## Troubleshooting

### File too large

Cause: File exceeds `MAX_UPLOAD_SIZE_BYTES`.

Fix: Upload a file under 20MB or change the limit in `.env`.

```text
MAX_UPLOAD_SIZE_BYTES=20971520
```

### Unsupported type

Cause: File extension or MIME type is not PDF, PNG, JPG, or JPEG.

Fix: Upload one of:

```text
.pdf, .png, .jpg, .jpeg
```

### Corrupted PDF

Cause: The file extension says PDF, but the file cannot be parsed as a PDF.

Fix: Re-export the medical report as a valid PDF and upload again.

### Corrupted image

Cause: The image cannot be opened and verified by Pillow.

Fix: Re-save the image as PNG or JPEG and upload again.

### Network error

Cause: Frontend cannot reach the backend.

Fix: Start FastAPI on port `8000` and confirm:

```bash
curl http://localhost:8000/health
```

Also confirm:

```text
VITE_API_BASE_URL=http://localhost:8000
```

### PowerShell blocks npm

Cause: Windows execution policy blocks `npm.ps1`.

Fix: Use:

```bash
npm.cmd install
npm.cmd run dev
```

### npm cache permission error

Cause: npm tries to write cache files outside the workspace.

Fix:

```bash
npm.cmd install --cache .npm-cache
```
