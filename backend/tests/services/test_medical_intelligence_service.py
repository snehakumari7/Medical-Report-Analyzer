import json
from pathlib import Path

import pytest

from app.services.medical_intelligence_service import MedicalIntelligenceEngine, MedicalIntelligenceError


def test_classifies_normal_borderline_high_and_critical_parameters() -> None:
    extracted_parameters = [
        {"parameter_name": "Hemoglobin", "value": 14.2, "unit": "g/dL"},
        {"parameter_name": "LDL", "value": 122, "unit": "mg/dL"},
        {"parameter_name": "Triglycerides", "value": 260, "unit": "mg/dL"},
        {"parameter_name": "Glucose", "value": 302, "unit": "mg/dL"},
    ]

    result = MedicalIntelligenceEngine().analyze(extracted_parameters)
    by_parameter = {item["parameter"]: item for item in result["parameters"]}

    assert by_parameter["Hemoglobin"]["status"] == "normal"
    assert by_parameter["Hemoglobin"]["severity"] == "none"
    assert by_parameter["LDL"]["status"] == "borderline_high"
    assert by_parameter["LDL"]["severity"] == "borderline"
    assert by_parameter["Triglycerides"]["status"] == "high"
    assert by_parameter["Triglycerides"]["severity"] == "high"
    assert by_parameter["Glucose"]["status"] == "critical_high"
    assert by_parameter["Glucose"]["severity"] == "critical"
    assert result["health_score"] == 58
    assert len(result["risk_indicators"]) == 3
    assert "does not diagnose diseases" in result["disclaimer"]


def test_classifies_low_direction_parameters() -> None:
    extracted_parameters = [
        {"parameter_name": "HDL", "value": 34, "unit": "mg/dL"},
        {"parameter_name": "Vitamin D", "value": 24, "unit": "ng/mL"},
        {"parameter_name": "Vitamin B12", "value": 130, "unit": "pg/mL"},
    ]

    result = MedicalIntelligenceEngine().analyze(extracted_parameters)
    by_parameter = {item["parameter"]: item for item in result["parameters"]}

    assert by_parameter["HDL"]["status"] == "low"
    assert by_parameter["HDL"]["severity"] == "high"
    assert by_parameter["Vitamin D"]["status"] == "borderline_low"
    assert by_parameter["Vitamin D"]["severity"] == "borderline"
    assert by_parameter["Vitamin B12"]["status"] == "critical_low"
    assert by_parameter["Vitamin B12"]["severity"] == "critical"
    assert result["health_score"] == 58


def test_health_score_stays_between_zero_and_one_hundred() -> None:
    extracted_parameters = [
        {"parameter_name": "Hemoglobin", "value": 5, "unit": "g/dL"},
        {"parameter_name": "WBC", "value": 50000, "unit": "cells/uL"},
        {"parameter_name": "Platelets", "value": 20, "unit": "10^3/uL"},
        {"parameter_name": "Glucose", "value": 400, "unit": "mg/dL"},
        {"parameter_name": "HbA1c", "value": 12, "unit": "%"},
    ]

    result = MedicalIntelligenceEngine().analyze(extracted_parameters)

    assert result["health_score"] == 0
    assert all(item["severity"] == "critical" for item in result["parameters"])


def test_accepts_phase_4_parameter_name_shape() -> None:
    extracted_parameters = [
        {
            "parameter_name": "HbA1c",
            "value": 5.9,
            "unit": "%",
            "reference_range": "<5.7%",
            "confidence_score": 0.95,
        }
    ]

    result = MedicalIntelligenceEngine().analyze(extracted_parameters)

    assert result["parameters"][0]["parameter"] == "HbA1c"
    assert result["parameters"][0]["status"] == "borderline_high"


def test_rejects_unknown_parameter() -> None:
    with pytest.raises(MedicalIntelligenceError, match="No medical range configuration"):
        MedicalIntelligenceEngine().analyze([{"parameter_name": "Calcium", "value": 9.2, "unit": "mg/dL"}])


def test_rejects_invalid_numeric_value() -> None:
    with pytest.raises(MedicalIntelligenceError, match="Invalid numeric value"):
        MedicalIntelligenceEngine().analyze([{"parameter_name": "Glucose", "value": "not-number", "unit": "mg/dL"}])


def test_rejects_invalid_input_shape() -> None:
    with pytest.raises(MedicalIntelligenceError, match="must be a list"):
        MedicalIntelligenceEngine().analyze({"parameter_name": "Glucose"})  # type: ignore[arg-type]


def test_rejects_invalid_ranges_json(tmp_path: Path) -> None:
    ranges_path = tmp_path / "medical_ranges.json"
    ranges_path.write_text("{not-json", encoding="utf-8")

    with pytest.raises(MedicalIntelligenceError, match="invalid JSON"):
        MedicalIntelligenceEngine(ranges_path=ranges_path)


def test_ranges_file_contains_required_status_bands() -> None:
    ranges_path = Path(__file__).resolve().parents[2] / "app" / "data" / "medical_ranges.json"
    ranges = json.loads(ranges_path.read_text(encoding="utf-8"))

    for parameter_name, config in ranges.items():
        assert "normal" in config["ranges"], parameter_name
        assert any(key.startswith("borderline") for key in config["ranges"]), parameter_name
        assert any(key in config["ranges"] for key in ("high", "low")), parameter_name
        assert any(key.startswith("critical") for key in config["ranges"]), parameter_name
