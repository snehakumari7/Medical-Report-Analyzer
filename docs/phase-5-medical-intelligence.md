# Phase 5 Medical Intelligence Engine

## What Was Added

- `backend/app/data/medical_ranges.json`
- `backend/app/services/medical_intelligence_service.py`
- `backend/tests/services/test_medical_intelligence_service.py`

## Purpose

This phase classifies extracted medical parameters into abnormality bands. It does not diagnose disease.

## Input

List of extracted parameters from Phase 4:

```python
[
  {
    "parameter_name": "Glucose",
    "value": 104,
    "unit": "mg/dL",
    "reference_range": "Fasting: 70-99 mg/dL",
    "confidence_score": 0.95
  }
]
```

## Output

```json
{
  "parameters": [
    {
      "parameter": "Glucose",
      "value": 104.0,
      "unit": "mg/dL",
      "status": "borderline_high",
      "severity": "borderline",
      "recommendation": "Glucose is borderline high. Review fasting status, diet, activity, and follow-up timing with a clinician.",
      "reference_unit": "mg/dL",
      "classification_band": "borderline_high"
    }
  ],
  "risk_indicators": [
    {
      "parameter": "Glucose",
      "status": "borderline_high",
      "severity": "borderline",
      "message": "Glucose is near a reference boundary and should be monitored."
    }
  ],
  "health_score": 95,
  "disclaimer": "This output classifies reported parameter abnormalities only. It does not diagnose diseases."
}
```

## Severity Rules

| Classification Band | Severity |
| --- | --- |
| `normal` | `none` |
| `borderline_low`, `borderline_high` | `borderline` |
| `low`, `high` | `high` |
| `critical_low`, `critical_high` | `critical` |

## Health Score

The score starts at `100`.

Penalties:

- Normal: `0`
- Borderline: `5`
- High/Low abnormal: `12`
- Critical: `25`
- Unknown: `8`

The final score is clamped between `0` and `100`.

## Run Tests

```bash
cd backend
.venv\Scripts\activate
pytest tests/services/test_medical_intelligence_service.py -p no:cacheprovider
```

## Browser Test

Run the backend:

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

```text
http://localhost:8000/docs
```

Use:

```text
POST /analyze-parameters
```

Sample request:

```json
{
  "parameters": [
    {
      "parameter_name": "Glucose",
      "value": 104,
      "unit": "mg/dL",
      "reference_range": "Fasting: 70-99 mg/dL",
      "confidence_score": 0.95
    },
    {
      "parameter_name": "LDL",
      "value": 160,
      "unit": "mg/dL",
      "reference_range": "<100 mg/dL",
      "confidence_score": 0.93
    }
  ]
}
```

## Safety Rule

The engine only classifies reported values. It does not diagnose diseases, infer conditions, or replace clinician review.
