import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import App from "./App";
import { AuthProvider } from "../features/auth/AuthContext";

const userId = "user-1";

function renderApp(initialPath = "/") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  );
}

function seedSignedInUser() {
  localStorage.setItem(
    "medical-analyzer-users",
    JSON.stringify([{ id: userId, name: "Test User", email: "test@example.com", passwordHash: "hash", createdAt: new Date().toISOString() }]),
  );
  localStorage.setItem("medical-analyzer-session", userId);
}

function seedReport() {
  localStorage.setItem(
    "medical-analyzer-reports",
    JSON.stringify([
      {
        id: "report-1",
        userId,
        fileId: "file-1",
        filename: "blood-report.pdf",
        uploadedAt: "2026-05-31T08:00:00.000Z",
        rawText: "Hemoglobin 14.2 g/dL LDL 160 mg/dL",
        healthScore: 82,
        riskIndicators: [],
        recommendations: [],
        parameters: [
          { name: "Hemoglobin", value: 14.2, unit: "g/dL", range: "13.0-17.5", status: "normal", severity: "normal", confidence: 0.93, trend: 0 },
          { name: "LDL", value: 160, unit: "mg/dL", range: "<100", status: "high", severity: "high", confidence: 0.9, trend: 0 },
        ],
      },
    ]),
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("App authenticated workflow", () => {
  it("shows login before a user is authenticated", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: /sign in, upload, analyze, then track real trends/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /login/i }).length).toBeGreaterThan(0);
  });

  it("sends a new signed-in user to an empty dashboard with an upload CTA", () => {
    seedSignedInUser();
    renderApp();

    expect(screen.getByRole("heading", { name: /transform medical reports into actionable health insights/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /upload report/i })).toBeInTheDocument();
    expect(screen.queryByText("annual-health-panel.pdf")).not.toBeInTheDocument();
  });

  it("renders dashboard widgets from saved extracted report data", async () => {
    const user = userEvent.setup();
    seedSignedInUser();
    seedReport();
    renderApp("/dashboard");

    expect(screen.getByRole("heading", { name: /clinical overview/i })).toBeInTheDocument();
    expect(screen.getByText(/blood-report\.pdf/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf report/i })).toBeInTheDocument();
    expect(screen.getAllByText("LDL").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("link", { name: /analytics/i }));
    expect(screen.getByRole("heading", { name: /longitudinal insights/i })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /history/i }));
    expect(screen.getByRole("heading", { name: /report timeline/i })).toBeInTheDocument();
    expect(screen.getByText("1 abnormal markers")).toBeInTheDocument();
  });
});
