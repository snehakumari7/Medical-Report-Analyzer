import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MedicalReportUploader from "./MedicalReportUploader";
import { AuthProvider } from "../auth/AuthContext";
import { MedicalRecordsProvider } from "../records/MedicalRecordsContext";
import { UploadSessionProvider } from "./UploadSessionContext";

vi.mock("../../services/uploadApi", () => ({
  generateAiSummary: vi.fn(async () => ({
    simple_summary: "Your report has values that may need monitoring.",
    detailed_explanation: "Glucose is borderline high and LDL is high. This is not a diagnosis.",
    lifestyle_suggestions: ["Keep regular meal timing.", "Discuss activity goals with your clinician."],
    questions_to_ask_doctor: ["Should I repeat these tests?", "What follow-up interval is right for me?"],
    disclaimer: "This output is educational and does not diagnose diseases.",
  })),
  analyzeUploadedReport: vi.fn(async () => ({
    file_id: "abc123",
    filename: "report.png",
    raw_text: "Glucose 104 mg/dL\nLDL 160 mg/dL",
    extracted_parameters: [
      {
        parameter_name: "Glucose",
        value: 104,
        unit: "mg/dL",
        reference_range: "Fasting: 70-99 mg/dL",
        confidence_score: 0.95,
        matched_text: "Glucose 104 mg/dL",
      },
      {
        parameter_name: "LDL",
        value: 160,
        unit: "mg/dL",
        reference_range: "<100 mg/dL",
        confidence_score: 0.93,
        matched_text: "LDL 160 mg/dL",
      },
    ],
    extraction_logs: [
      { parameter_name: "Glucose", status: "extracted", confidence_score: 0.95 },
      { parameter_name: "LDL", status: "extracted", confidence_score: 0.93 },
      { parameter_name: "Hemoglobin", status: "not_found", message: "No matching value found in OCR text." },
    ],
    intelligence: {
      parameters: [
        {
          parameter: "Glucose",
          value: 104,
          unit: "mg/dL",
          status: "borderline_high",
          severity: "borderline",
          recommendation: "Glucose is borderline high. Review follow-up timing with a clinician.",
          reference_unit: "mg/dL",
          classification_band: "borderline_high",
        },
        {
          parameter: "LDL",
          value: 160,
          unit: "mg/dL",
          status: "high",
          severity: "high",
          recommendation: "LDL is high. Discuss cardiovascular risk reduction with a qualified clinician.",
          reference_unit: "mg/dL",
          classification_band: "high",
        },
      ],
      risk_indicators: [
        {
          parameter: "Glucose",
          status: "borderline_high",
          severity: "borderline",
          message: "Glucose is near a reference boundary and should be monitored.",
        },
      ],
      health_score: 83,
      disclaimer: "This output classifies reported parameter abnormalities only. It does not diagnose diseases.",
    },
  })),
  uploadMedicalReport: vi.fn(async (_file: File, onProgress: (progress: number) => void) => {
    onProgress(100);
    return {
      file_id: "abc123",
      filename: "report.png",
      upload_time: "2026-05-31T05:30:00Z",
    };
  }),
}));

function renderUploader() {
  localStorage.setItem(
    "medical-analyzer-users",
    JSON.stringify([{ id: "user-1", name: "Test User", email: "test@example.com", passwordHash: "hash", createdAt: new Date().toISOString() }]),
  );
  localStorage.setItem("medical-analyzer-session", "user-1");

  return render(
    <AuthProvider>
      <MedicalRecordsProvider>
        <UploadSessionProvider>
          <MedicalReportUploader />
        </UploadSessionProvider>
      </MedicalRecordsProvider>
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("MedicalReportUploader", () => {
  it("shows success after a valid upload", async () => {
    const user = userEvent.setup();
    renderUploader();

    const file = new File(["valid image"], "report.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/drop your report here or browse/i), file);
    await user.click(screen.getByRole("button", { name: /upload report/i }));

    expect(await screen.findByText(/upload complete/i)).toBeInTheDocument();
    expect(screen.getByText(/abc123/i)).toBeInTheDocument();
  });

  it("shows extracted report information after analysis", async () => {
    const user = userEvent.setup();
    renderUploader();

    const file = new File(["valid image"], "report.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/drop your report here or browse/i), file);
    await user.click(screen.getByRole("button", { name: /upload report/i }));
    await user.click(await screen.findByRole("button", { name: /extract and analyze report/i }));

    expect(await screen.findByText("83/100")).toBeInTheDocument();
    expect(screen.getByText("Glucose")).toBeInTheDocument();
    expect(screen.getByText("LDL")).toBeInTheDocument();
    expect(screen.getByText(/does not diagnose diseases/i)).toBeInTheDocument();
  });

  it("keeps extracted report information after the uploader remounts", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "medical-analyzer-users",
      JSON.stringify([{ id: "user-1", name: "Test User", email: "test@example.com", passwordHash: "hash", createdAt: new Date().toISOString() }]),
    );
    localStorage.setItem("medical-analyzer-session", "user-1");

    function ToggleHarness() {
      const [isVisible, setIsVisible] = React.useState(true);
      return (
        <AuthProvider>
          <MedicalRecordsProvider>
            <UploadSessionProvider>
              <button type="button" onClick={() => setIsVisible((value) => !value)}>
                Toggle uploader
              </button>
              {isVisible ? <MedicalReportUploader /> : <div>Another dashboard page</div>}
            </UploadSessionProvider>
          </MedicalRecordsProvider>
        </AuthProvider>
      );
    }

    render(<ToggleHarness />);

    const file = new File(["valid image"], "report.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/drop your report here or browse/i), file);
    await user.click(screen.getByRole("button", { name: /upload report/i }));
    await user.click(await screen.findByRole("button", { name: /extract and analyze report/i }));
    expect(await screen.findByText("83/100")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /toggle uploader/i }));
    expect(screen.getByText("Another dashboard page")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /toggle uploader/i }));
    expect(await screen.findByText("83/100")).toBeInTheDocument();
    expect(screen.getByText("Upload complete")).toBeInTheDocument();
  });

  it("generates and displays an AI summary after analysis", async () => {
    const user = userEvent.setup();
    renderUploader();

    const file = new File(["valid image"], "report.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/drop your report here or browse/i), file);
    await user.click(screen.getByRole("button", { name: /upload report/i }));
    await user.click(await screen.findByRole("button", { name: /extract and analyze report/i }));
    await user.click(await screen.findByRole("button", { name: /generate ai summary/i }));

    expect(await screen.findByText("Simple summary")).toBeInTheDocument();
    expect(screen.getByText(/values that may need monitoring/i)).toBeInTheDocument();
    expect(screen.getByText("Questions to ask doctor")).toBeInTheDocument();
    expect(screen.getByText(/should i repeat these tests/i)).toBeInTheDocument();
  });

  it("rejects unsupported files before upload", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderUploader();

    const file = new File(["notes"], "notes.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText(/drop your report here or browse/i), file);

    expect(screen.getByRole("alert")).toHaveTextContent("Unsupported file type");
  });
});
