# Phase 6 PostgreSQL Schema and CRUD APIs

## What Was Added

- SQLAlchemy database base/session setup
- SQLAlchemy models for:
  - `users`
  - `reports`
  - `extracted_parameters`
  - `health_scores`
  - `ai_summaries`
- Pydantic validation schemas
- CRUD API endpoints
- Alembic configuration
- Alembic migration
- API endpoint tests

## Files

```text
backend/app/db/base.py
backend/app/db/session.py
backend/app/models/medical_records.py
backend/app/schemas/medical_records.py
backend/app/api/v1/medical_records.py
backend/alembic.ini
backend/alembic/env.py
backend/alembic/versions/20260531_0001_create_medical_records.py
backend/tests/api/test_medical_records_crud.py
```

## Tables

### users

- `id`
- `email`
- `full_name`
- `is_active`
- `created_at`
- `updated_at`

### reports

- `id`
- `user_id`
- `original_filename`
- `storage_path`
- `file_type`
- `file_size_bytes`
- `upload_time`
- `processing_status`
- `created_at`
- `updated_at`

### extracted_parameters

- `id`
- `report_id`
- `parameter_name`
- `value`
- `unit`
- `reference_range`
- `confidence_score`
- `extraction_log`
- `created_at`
- `updated_at`

### health_scores

- `id`
- `report_id`
- `score`
- `risk_level`
- `risk_indicators`
- `created_at`
- `updated_at`

### ai_summaries

- `id`
- `report_id`
- `summary_text`
- `model_name`
- `summary_type`
- `created_at`
- `updated_at`

## CRUD Endpoints

```text
POST   /users
GET    /users
GET    /users/{user_id}
PATCH  /users/{user_id}
DELETE /users/{user_id}

POST   /reports
GET    /reports
GET    /reports/{report_id}
PATCH  /reports/{report_id}
DELETE /reports/{report_id}

POST   /extracted-parameters
GET    /extracted-parameters
GET    /extracted-parameters/{parameter_id}
PATCH  /extracted-parameters/{parameter_id}
DELETE /extracted-parameters/{parameter_id}

POST   /health-scores
GET    /health-scores
GET    /health-scores/{health_score_id}
PATCH  /health-scores/{health_score_id}
DELETE /health-scores/{health_score_id}

POST   /ai-summaries
GET    /ai-summaries
GET    /ai-summaries/{summary_id}
PATCH  /ai-summaries/{summary_id}
DELETE /ai-summaries/{summary_id}
```

## Apply Migration

Confirm `.env` has:

```text
DATABASE_URL=postgresql+psycopg://medical_report_user:change_me@localhost:5432/medical_report_analyzer
```

Run:

```bash
cd backend
.venv\Scripts\activate
python -m alembic -c alembic.ini upgrade head
```

## Test In Browser

Run backend:

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

```text
http://localhost:8000/docs
```

Start with:

```text
POST /users
```

Example:

```json
{
  "email": "patient@example.com",
  "full_name": "Patient One",
  "is_active": true
}
```

Then create a report using the returned `id` as `user_id`.

## Run Tests

```bash
cd backend
.venv\Scripts\activate
pytest -p no:cacheprovider
```

## Troubleshooting

### PostgreSQL connection fails

Cause: PostgreSQL is not running or `.env` credentials are wrong.

Fix: Start PostgreSQL, create the database/user, and update `DATABASE_URL`.

### Migration cannot find app imports

Cause: Alembic was run from the wrong directory.

Fix: Run commands from `backend`.

### Foreign key validation fails

Cause: Creating a report, parameter, score, or summary with a missing parent ID.

Fix: Create the parent resource first and use its returned `id`.

### Duplicate email

Cause: `users.email` is unique.

Fix: Use a different email or update the existing user.

### OneDrive pytest cache warning

Cause: OneDrive may block `.pytest_cache` writes.

Fix:

```bash
pytest -p no:cacheprovider
```
