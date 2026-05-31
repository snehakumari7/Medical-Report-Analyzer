# Phase 7 Groq AI Summary

## What Was Added

- Groq API integration with `httpx`
- Retry mechanism for transient failures
- Timeout handling
- Empty response handling
- Invalid JSON handling
- Strict Pydantic response validation
- Browser-testable API endpoint
- Tests with mocked Groq responses

## Files

```text
backend/app/services/groq_summary_service.py
backend/app/schemas/ai_summary.py
backend/app/api/v1/ai_summary.py
backend/tests/services/test_groq_summary_service.py
backend/tests/api/test_ai_summary.py
```

## Endpoint

```text
POST /generate-ai-summary
```

## Input

```json
{
  "health_score": 95,
  "extracted_parameters": [
    {
      "parameter_name": "Glucose",
      "value": 104,
      "unit": "mg/dL",
      "status": "borderline_high",
      "severity": "borderline",
      "reference_range": "70-99 mg/dL"
    }
  ],
  "abnormal_values": [
    {
      "parameter_name": "Glucose",
      "value": 104,
      "unit": "mg/dL",
      "status": "borderline_high",
      "severity": "borderline",
      "reference_range": "70-99 mg/dL"
    }
  ]
}
```

## Output

```json
{
  "simple_summary": "Plain-language summary.",
  "detailed_explanation": "Plain-language explanation.",
  "lifestyle_suggestions": ["Short suggestion."],
  "questions_to_ask_doctor": ["Short question."],
  "disclaimer": "This output does not diagnose diseases."
}
```

## Environment

```text
GROQ_API_KEY=replace_with_your_groq_api_key
GROQ_MODEL=deepseek-v3
GROQ_API_BASE_URL=https://api.groq.com/openai/v1
GROQ_TIMEOUT_SECONDS=20
GROQ_MAX_RETRIES=2
```

## Safety Rules

The prompt tells Groq:

- Do not diagnose diseases.
- Do not claim the user has a condition.
- Only explain parameter abnormalities.
- Use simple language.
- Return valid JSON only.

## Run Tests

```bash
cd backend
.venv\Scripts\activate
pytest tests/services/test_groq_summary_service.py tests/api/test_ai_summary.py -p no:cacheprovider
```

## Troubleshooting

### API failure

Cause: Groq returns a non-success status.

Fix: Check API key, model name, quota, and network access.

### Timeout

Cause: Groq does not respond within `GROQ_TIMEOUT_SECONDS`.

Fix: Increase timeout or retry later.

### Empty response

Cause: Groq response contains no text.

Fix: Retry or inspect provider response logs.

### Invalid JSON

Cause: Groq returned prose or malformed JSON.

Fix: Retry. The service rejects invalid JSON to keep the app predictable.
