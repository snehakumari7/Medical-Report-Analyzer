import pytest

from app.services.parameter_parser import MedicalParameterParser, ParameterParserError


def test_parse_complete_cbc_and_lipid_report() -> None:
    text = """
    CBC REPORT
    Hb: 13.8 g/dL
    RBC 4.92 million/uL
    White Blood Cells: 7200 cells/uL
    Platelet Count - 2.41 lakhs/cumm
    Total Cholesterol 182 mg/dL
    HDL Cholesterol 48 mg/dL
    LDL Cholesterol 96 mg/dL
    Triglycerides 132 mg/dL
    """

    result = MedicalParameterParser().parse(text)
    parameters = {item["parameter_name"]: item for item in result["parameters"]}

    assert parameters["Hemoglobin"]["value"] == 13.8
    assert parameters["Hemoglobin"]["unit"] == "g/dL"
    assert parameters["WBC"]["value"] == 7200
    assert parameters["Platelets"]["value"] == 2.41
    assert parameters["Cholesterol"]["value"] == 182
    assert parameters["HDL"]["value"] == 48
    assert parameters["LDL"]["value"] == 96
    assert parameters["Triglycerides"]["value"] == 132
    assert all(item["confidence_score"] > 0.7 for item in result["parameters"])


def test_parse_diabetes_and_vitamin_report_with_aliases() -> None:
    text = """
    Fasting Blood Sugar: 104 mg/dL
    Hb A1c = 5.8 %
    25-OH Vitamin D 22.5 ng/ml
    Vit B12: 310 pg/ml
    HGB 12.4 gm/dl
    TLC 8400 /uL
    """

    result = MedicalParameterParser().parse(text)
    parameters = {item["parameter_name"]: item for item in result["parameters"]}

    assert parameters["Glucose"]["value"] == 104
    assert parameters["HbA1c"]["value"] == 5.8
    assert parameters["Vitamin D"]["value"] == 22.5
    assert parameters["Vitamin B12"]["value"] == 310
    assert parameters["Hemoglobin"]["unit"] == "g/dL"
    assert parameters["WBC"]["unit"] == "/uL"


def test_parse_table_like_report_format() -> None:
    text = """
    Test Name                 Result       Unit
    Hemoglobin                14.2         g/dL
    Red Blood Cells           5.10         million/uL
    Leukocytes                6,900        cells/uL
    PLT                       245          10^3/uL
    Random Blood Sugar        118          mg/dL
    """

    result = MedicalParameterParser().parse(text)
    parameters = {item["parameter_name"]: item for item in result["parameters"]}

    assert parameters["Hemoglobin"]["value"] == 14.2
    assert parameters["RBC"]["value"] == 5.1
    assert parameters["WBC"]["value"] == 6900
    assert parameters["Platelets"]["value"] == 245
    assert parameters["Glucose"]["value"] == 118


def test_logs_include_not_found_entries() -> None:
    result = MedicalParameterParser().parse("Hemoglobin 13.0 g/dL")

    extracted = [log for log in result["extraction_logs"] if log["status"] == "extracted"]
    missing = [log for log in result["extraction_logs"] if log["status"] == "not_found"]

    assert extracted[0]["parameter_name"] == "Hemoglobin"
    assert len(missing) == 11
    assert missing[0]["message"] == "No matching value found in OCR text."


def test_reject_empty_ocr_text() -> None:
    with pytest.raises(ParameterParserError, match="empty"):
        MedicalParameterParser().parse("   ")


def test_reject_non_string_ocr_text() -> None:
    with pytest.raises(ParameterParserError, match="must be a string"):
        MedicalParameterParser().parse(None)  # type: ignore[arg-type]
