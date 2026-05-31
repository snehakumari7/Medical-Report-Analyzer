from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class MedicalIntelligenceError(ValueError):
    pass


class MedicalIntelligenceEngine:
    def __init__(self, ranges_path: str | Path | None = None) -> None:
        self.ranges_path = Path(ranges_path) if ranges_path else Path(__file__).resolve().parents[1] / "data" / "medical_ranges.json"
        self.ranges = self._load_ranges()

    def analyze(self, extracted_parameters: list[dict[str, Any]]) -> dict[str, Any]:
        if not isinstance(extracted_parameters, list):
            raise MedicalIntelligenceError("Extracted parameters must be a list.")

        results: list[dict[str, Any]] = []
        risk_indicators: list[dict[str, str]] = []

        for parameter in extracted_parameters:
            result = self._analyze_parameter(parameter)
            results.append(result)
            if result["severity"] != "none":
                risk_indicators.append(
                    {
                        "parameter": result["parameter"],
                        "status": result["status"],
                        "severity": result["severity"],
                        "message": self._risk_message(result),
                    }
                )

        health_score = self._calculate_health_score(results)
        return {
            "parameters": results,
            "risk_indicators": risk_indicators,
            "health_score": health_score,
            "disclaimer": "This output classifies reported parameter abnormalities only. It does not diagnose diseases.",
        }

    def _load_ranges(self) -> dict[str, Any]:
        try:
            return json.loads(self.ranges_path.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            raise MedicalIntelligenceError("Medical ranges configuration file was not found.") from exc
        except json.JSONDecodeError as exc:
            raise MedicalIntelligenceError("Medical ranges configuration file is invalid JSON.") from exc

    def _analyze_parameter(self, parameter: dict[str, Any]) -> dict[str, Any]:
        name = str(parameter.get("parameter_name") or parameter.get("parameter") or "").strip()
        if not name:
            raise MedicalIntelligenceError("Each extracted parameter must include parameter_name.")
        if name not in self.ranges:
            raise MedicalIntelligenceError(f"No medical range configuration found for {name}.")

        value = self._coerce_value(parameter.get("value"), name)
        range_config = self.ranges[name]
        classification = self._classify_value(value, range_config["ranges"])
        status, severity = self._status_and_severity(classification)
        recommendation = self._recommendation(range_config, severity)

        return {
            "parameter": name,
            "value": value,
            "unit": parameter.get("unit") or range_config["unit"],
            "status": status,
            "severity": severity,
            "recommendation": recommendation,
            "reference_unit": range_config["unit"],
            "classification_band": classification,
        }

    def _classify_value(self, value: float, ranges: dict[str, dict[str, float]]) -> str:
        ordered_bands = (
            "critical_low",
            "critical_high",
            "low",
            "high",
            "borderline_low",
            "borderline_high",
            "normal",
        )
        for band in ordered_bands:
            if band in ranges and self._value_in_range(value, ranges[band]):
                return band
        return "unclassified"

    def _value_in_range(self, value: float, band: dict[str, float]) -> bool:
        min_value = band.get("min")
        max_value = band.get("max")
        if min_value is not None and value < min_value:
            return False
        if max_value is not None and value > max_value:
            return False
        return True

    def _status_and_severity(self, classification: str) -> tuple[str, str]:
        status_map = {
            "normal": ("normal", "none"),
            "borderline_low": ("borderline_low", "borderline"),
            "borderline_high": ("borderline_high", "borderline"),
            "low": ("low", "high"),
            "high": ("high", "high"),
            "critical_low": ("critical_low", "critical"),
            "critical_high": ("critical_high", "critical"),
        }
        return status_map.get(classification, ("unclassified", "unknown"))

    def _recommendation(self, range_config: dict[str, Any], severity: str) -> str:
        recommendation_key = severity if severity in {"normal", "borderline", "high", "critical"} else "high"
        if severity == "none":
            recommendation_key = "normal"
        return str(range_config["recommendations"][recommendation_key])

    def _calculate_health_score(self, results: list[dict[str, Any]]) -> int:
        if not results:
            return 100

        penalty_by_severity = {
            "none": 0,
            "borderline": 5,
            "high": 12,
            "critical": 25,
            "unknown": 8,
        }
        total_penalty = sum(penalty_by_severity.get(result["severity"], 8) for result in results)
        return max(0, min(100, 100 - total_penalty))

    def _risk_message(self, result: dict[str, Any]) -> str:
        severity = result["severity"]
        if severity == "critical":
            return f"{result['parameter']} is in a critical abnormal range and needs prompt medical review."
        if severity == "high":
            return f"{result['parameter']} is outside the expected range and should be reviewed with a clinician."
        if severity == "borderline":
            return f"{result['parameter']} is near a reference boundary and should be monitored."
        return f"{result['parameter']} could not be classified confidently."

    def _coerce_value(self, value: Any, parameter_name: str) -> float:
        try:
            return float(value)
        except (TypeError, ValueError) as exc:
            raise MedicalIntelligenceError(f"Invalid numeric value for {parameter_name}.") from exc


def get_medical_intelligence_engine() -> MedicalIntelligenceEngine:
    return MedicalIntelligenceEngine()
