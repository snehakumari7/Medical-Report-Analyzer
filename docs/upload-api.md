# Upload API

Phase 2 adds secure local file upload for medical reports.

## Endpoint

```http
POST /upload
Content-Type: multipart/form-data
```

### Form Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | File | Yes | Medical report file. Supports PDF, PNG, JPG, and JPEG. |

### Validation

| Rule | Behavior |
| --- | --- |
| Maximum file size | Rejects files over 20MB with `413`. |
| Supported formats | Rejects non-PDF/image files with `415`. |
| Corrupted images | Rejects invalid PNG/JPG/JPEG content with `400`. |
| Corrupted PDFs | Rejects invalid PDF content with `400`. |
| Empty files | Rejects empty uploads with `400`. |

### Success Response

Status: `201 Created`

```json
{
  "file_id": "6e8bbaf3e43d45a5b5d4d62a34e89479",
  "filename": "blood-report.pdf",
  "upload_time": "2026-05-31T06:00:00.000000Z"
}
```

### Error Responses

Unsupported type:

```json
{
  "detail": "Unsupported file type. Upload a PDF, PNG, JPG, or JPEG file."
}
```

File too large:

```json
{
  "detail": "File too large. Maximum upload size is 20MB."
}
```

Corrupted image:

```json
{
  "detail": "Corrupted image file."
}
```

Corrupted PDF:

```json
{
  "detail": "Corrupted PDF file."
}
```

## Local Storage

Uploaded files are stored in:

```text
backend/storage/uploads
```

The storage directory can be changed with:

```text
UPLOAD_DIR=storage/uploads
```

## Manual Test

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@sample-report.pdf"
```

## Automated Tests

```bash
cd backend
pytest
```

```bash
cd frontend
npm test
```
