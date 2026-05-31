from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ParameterDefinition:
    canonical_name: str
    aliases: tuple[str, ...]
    default_unit: str
    reference_range: str
    allowed_units: tuple[str, ...]


PARAMETER_DEFINITIONS: tuple[ParameterDefinition, ...] = (
    ParameterDefinition("Hemoglobin", ("hemoglobin", "haemoglobin", "hgb", "hb"), "g/dL", "Male: 13.5-17.5 g/dL; Female: 12.0-15.5 g/dL", ("g/dl", "gm/dl", "g%", "g/l")),
    ParameterDefinition("RBC", ("rbc", "red blood cells", "red blood cell count", "erythrocytes"), "million/uL", "4.2-5.9 million/uL", ("million/ul", "mill/ul", "m/ul", "10^6/ul", "x10^6/ul", "million/cumm")),
    ParameterDefinition("WBC", ("wbc", "white blood cells", "white blood cell count", "leukocytes", "total leukocyte count", "tlc"), "cells/uL", "4,000-11,000 cells/uL", ("cells/ul", "/ul", "cumm", "10^3/ul", "x10^3/ul", "thousand/ul")),
    ParameterDefinition("Platelets", ("platelets", "platelet count", "plt"), "lakhs/cumm", "1.5-4.5 lakhs/cumm", ("lakhs/cumm", "lakh/cumm", "10^3/ul", "x10^3/ul", "cells/ul", "/ul")),
    ParameterDefinition("Cholesterol", ("cholesterol", "total cholesterol", "serum cholesterol"), "mg/dL", "<200 mg/dL", ("mg/dl", "mmol/l")),
    ParameterDefinition("HDL", ("hdl", "hdl cholesterol", "high density lipoprotein"), "mg/dL", ">40 mg/dL", ("mg/dl", "mmol/l")),
    ParameterDefinition("LDL", ("ldl", "ldl cholesterol", "low density lipoprotein"), "mg/dL", "<100 mg/dL", ("mg/dl", "mmol/l")),
    ParameterDefinition("Triglycerides", ("triglycerides", "triglyceride", "tg", "vldl triglycerides"), "mg/dL", "<150 mg/dL", ("mg/dl", "mmol/l")),
    ParameterDefinition("Glucose", ("glucose", "blood glucose", "fasting glucose", "fasting blood sugar", "fbs", "random blood sugar", "rbs"), "mg/dL", "Fasting: 70-99 mg/dL", ("mg/dl", "mmol/l")),
    ParameterDefinition("HbA1c", ("hba1c", "hb a1c", "glycated hemoglobin", "glycosylated hemoglobin", "a1c"), "%", "<5.7%", ("%", "percent")),
    ParameterDefinition("Vitamin D", ("vitamin d", "25 hydroxy vitamin d", "25-oh vitamin d", "25 oh vitamin d", "vit d"), "ng/mL", "30-100 ng/mL", ("ng/ml", "nmol/l")),
    ParameterDefinition("Vitamin B12", ("vitamin b12", "vit b12", "cyanocobalamin", "b12"), "pg/mL", "200-900 pg/mL", ("pg/ml", "pmol/l")),
)


class ParameterParserError(ValueError):
    pass


class MedicalParameterParser:
    def parse(self, ocr_text: str) -> dict[str, list[dict[str, Any]]]:
        if not isinstance(ocr_text, str):
            raise ParameterParserError("OCR text must be a string.")

        normalized_text = self._normalize_text(ocr_text)
        if not normalized_text:
            raise ParameterParserError("OCR text is empty.")

        extraction_logs: list[dict[str, Any]] = []
        parameters: list[dict[str, Any]] = []
        occupied_spans: list[tuple[int, int]] = []

        for definition in PARAMETER_DEFINITIONS:
            match = self._find_best_match(definition, normalized_text, occupied_spans)
            if match is None:
                extraction_logs.append(
                    {
                        "parameter_name": definition.canonical_name,
                        "status": "not_found",
                        "message": "No matching value found in OCR text.",
                    }
                )
                continue

            occupied_spans.append(match["span"])
            parameters.append(
                {
                    "parameter_name": definition.canonical_name,
                    "value": match["value"],
                    "unit": match["unit"],
                    "reference_range": definition.reference_range,
                    "confidence_score": match["confidence_score"],
                    "matched_text": match["matched_text"],
                }
            )
            extraction_logs.append(
                {
                    "parameter_name": definition.canonical_name,
                    "status": "extracted",
                    "matched_alias": match["matched_alias"],
                    "matched_text": match["matched_text"],
                    "confidence_score": match["confidence_score"],
                }
            )

        return {"parameters": parameters, "extraction_logs": extraction_logs}

    def _find_best_match(
        self,
        definition: ParameterDefinition,
        text: str,
        occupied_spans: list[tuple[int, int]],
    ) -> dict[str, Any] | None:
        matches: list[dict[str, Any]] = []
        for alias in definition.aliases:
            alias_pattern = self._alias_pattern(alias)
            unit_pattern = self._unit_pattern(definition.allowed_units)
            pattern = re.compile(
                rf"(?P<alias>{alias_pattern})\s*[:=\-]?\s*(?P<value>\d{{1,5}}(?:,\d{{3}})*(?:\.\d+)?)\s*(?P<unit>{unit_pattern})?",
                flags=re.IGNORECASE,
            )

            for match in pattern.finditer(text):
                if self._overlaps(match.span(), occupied_spans):
                    continue

                raw_value = match.group("value")
                raw_unit = match.group("unit")
                unit = self._normalize_unit(raw_unit) if raw_unit else definition.default_unit
                confidence = self._calculate_confidence(alias=alias, raw_unit=raw_unit, matched_text=match.group(0))
                matches.append(
                    {
                        "matched_alias": match.group("alias"),
                        "matched_text": match.group(0).strip(),
                        "value": self._normalize_value(raw_value),
                        "unit": unit,
                        "span": match.span(),
                        "confidence_score": confidence,
                    }
                )

        if not matches:
            return None

        return sorted(matches, key=lambda item: item["confidence_score"], reverse=True)[0]

    def _normalize_text(self, text: str) -> str:
        replacements = {
            "\u00a0": " ",
            "\u2013": "-",
            "\u2014": "-",
            "\u2212": "-",
            "\u00b5": "u",
            "\u03bc": "u",
        }
        for source, target in replacements.items():
            text = text.replace(source, target)
        return re.sub(r"[ \t]+", " ", text).strip()

    def _alias_pattern(self, alias: str) -> str:
        escaped_words = [re.escape(part) for part in alias.split()]
        return r"\b" + r"\s+".join(escaped_words) + r"\b"

    def _unit_pattern(self, units: tuple[str, ...]) -> str:
        escaped_units = sorted((re.escape(unit) for unit in units), key=len, reverse=True)
        return r"(?:" + "|".join(escaped_units) + r")\b"

    def _normalize_value(self, value: str) -> float:
        return float(value.replace(",", ""))

    def _normalize_unit(self, unit: str) -> str:
        normalized = unit.strip().replace("µ", "u").replace("μ", "u")
        unit_map = {
            "gm/dl": "g/dL",
            "g/dl": "g/dL",
            "g%": "g/dL",
            "g/l": "g/L",
            "mg/dl": "mg/dL",
            "ng/ml": "ng/mL",
            "pg/ml": "pg/mL",
            "mmol/l": "mmol/L",
            "nmol/l": "nmol/L",
            "pmol/l": "pmol/L",
            "million/ul": "million/uL",
            "mill/ul": "million/uL",
            "m/ul": "million/uL",
            "10^6/ul": "10^6/uL",
            "x10^6/ul": "10^6/uL",
            "10^3/ul": "10^3/uL",
            "x10^3/ul": "10^3/uL",
            "cells/ul": "cells/uL",
            "/ul": "/uL",
            "percent": "%",
        }
        return unit_map.get(normalized.lower(), normalized)

    def _calculate_confidence(self, alias: str, raw_unit: str | None, matched_text: str) -> float:
        score = 0.72
        if raw_unit:
            score += 0.18
        if len(alias) > 3:
            score += 0.05
        if ":" in matched_text or "=" in matched_text:
            score += 0.03
        return round(min(score, 0.98), 2)

    def _overlaps(self, span: tuple[int, int], occupied_spans: list[tuple[int, int]]) -> bool:
        start, end = span
        return any(start < occupied_end and end > occupied_start for occupied_start, occupied_end in occupied_spans)


def get_parameter_parser() -> MedicalParameterParser:
    return MedicalParameterParser()
