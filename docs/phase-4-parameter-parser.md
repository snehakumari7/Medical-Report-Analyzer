# Phase 4 Medical Parameter Extraction Engine

## What Was Added

- `backend/app/services/parameter_parser.py`
- Regex-based medical parameter extraction from OCR text
- Confidence scoring per extracted parameter
- Extraction logs for found and missing parameters
- Unit tests for multiple report formats

## Supported Parameters

- Hemoglobin
- RBC
- WBC
- Platelets
- Cholesterol
- HDL
- LDL
- Triglycerides
- Glucose
- HbA1c
- Vitamin D
- Vitamin B12

## Input

Raw OCR text:

```python
from app.services.parameter_parser import get_parameter_parser

result = get_parameter_parser().parse(ocr_text)
```

## Output

```json
{
  "parameters": [
    {
      "parameter_name": "Hemoglobin",
      "value": 13.8,
      "unit": "g/dL",
      "reference_range": "Male: 13.5-17.5 g/dL; Female: 12.0-15.5 g/dL",
      "confidence_score": 0.93,
      "matched_text": "Hb: 13.8 g/dL"
    }
  ],
  "extraction_logs": [
    {
      "parameter_name": "Hemoglobin",
      "status": "extracted",
      "matched_alias": "Hb",
      "matched_text": "Hb: 13.8 g/dL",
      "confidence_score": 0.93
    }
  ]
}
```

## Alias Handling

Examples:

- Hemoglobin: `Hb`, `HGB`, `Hemoglobin`, `Haemoglobin`
- WBC: `WBC`, `White Blood Cells`, `Leukocytes`, `TLC`
- RBC: `RBC`, `Red Blood Cells`, `Erythrocytes`
- Platelets: `Platelets`, `Platelet Count`, `PLT`
- HbA1c: `HbA1c`, `Hb A1c`, `A1C`, `Glycated Hemoglobin`

## Run Tests

```bash
cd backend
.venv\Scripts\activate
pytest tests/services/test_parameter_parser.py
```

## Troubleshooting

### Parameter is not detected

Cause: OCR text may use an alias not yet listed, or the value may appear far away from the parameter name.

Fix: Add the alias to `PARAMETER_DEFINITIONS` and add a unit test with the real report format.

### Wrong unit is returned

Cause: The OCR text may omit the unit or OCR may misread symbols.

Fix: The parser uses default units when units are missing. Add the observed unit spelling to `allowed_units`.

### Confidence score is low

Cause: Usually the value was found without a unit or with a short alias.

Fix: Improve OCR quality or include units near values in the source report.
