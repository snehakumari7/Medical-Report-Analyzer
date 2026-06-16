import type { DashboardData, SavedMedicalReport } from "../records/MedicalRecordsContext";

interface PdfReportInput {
  dashboardData: DashboardData;
  report: SavedMedicalReport;
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT_MARGIN = 48;
const TOP_Y = 792;
const BOTTOM_Y = 54;
const LINE_HEIGHT = 16;
const MAX_CHARS = 92;

export function downloadPdfReport({ dashboardData, report }: PdfReportInput) {
  const lines = buildReportLines(dashboardData, report);
  const pages = paginate(lines);
  const pdf = createPdf(pages);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `medical-report-${report.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildReportLines(dashboardData: DashboardData, report: SavedMedicalReport): string[] {
  const generatedAt = new Date().toLocaleString();
  const reportDate = report.uploadedAt ? new Date(report.uploadedAt).toLocaleString() : "Date unavailable";
  const abnormalParameters = report.parameters.filter((parameter) => parameter.severity !== "normal");

  return [
    "AI-Powered Visual Medical Report Analyzer",
    `Generated: ${generatedAt}`,
    `Report ID: ${report.id || "Unavailable"}`,
    `Report Date: ${reportDate}`,
    "",
    "Patient Summary",
    "Patient details were not provided in this application session.",
    `Source file: ${report.filename || "Unavailable"}`,
    `Extracted parameters: ${report.parameters.length}`,
    `Abnormal markers: ${abnormalParameters.length}`,
    "",
    "Health Score",
    report.healthScore === undefined ? "Health score unavailable." : `Health score: ${report.healthScore}/100`,
    `Improving markers: ${dashboardData.improvingMarkers ?? 0}`,
    "",
    "Parameter Analysis",
    ...parameterLines(report),
    "",
    "Charts",
    ...chartLines(dashboardData),
    "",
    "AI Summary",
    ...aiSummaryLines(report),
    "",
    "Medical Disclaimer",
    "This report is educational and assistive only. It does not diagnose, treat, cure, or prevent disease. Consult a qualified healthcare professional for medical advice.",
  ];
}

function parameterLines(report: SavedMedicalReport): string[] {
  if (!report.parameters.length) {
    return ["No extracted parameters are available for this report."];
  }

  return report.parameters.map((parameter) => {
    const confidence = Number.isFinite(parameter.confidence) ? `${Math.round(parameter.confidence * 100)}%` : "unknown confidence";
    return `${parameter.name}: ${parameter.value} ${parameter.unit || ""} | Status: ${formatLabel(parameter.status)} | Severity: ${parameter.severity} | Ref: ${parameter.range || "not available"} | Confidence: ${confidence}`;
  });
}

function chartLines(dashboardData: DashboardData): string[] {
  const lines: string[] = [];
  const parameterNameByKey = new Map((dashboardData.latestReport?.parameters ?? []).map((parameter) => [toReadableTrendKey(parameter.name), parameter.name]));

  if (dashboardData.trends.length) {
    lines.push("Trend chart data:");
    dashboardData.trends.forEach((point) => {
      const dynamicParameters = Object.entries(point)
        .filter(([key, value]) => key.startsWith("parameter_") && typeof value === "number")
        .map(([key, value]) => `${parameterNameByKey.get(key) ?? formatDynamicTrendLabel(key)} ${formatNumber(typeof value === "number" ? value : undefined)}`);
      lines.push(`${point.date}: health score ${point.healthScore}, abnormal markers ${point.abnormalMarkers}${dynamicParameters.length ? `, ${dynamicParameters.join(", ")}` : ""}`);
    });
  } else {
    lines.push("Trend chart data unavailable. At least one analyzed report is required.");
  }

  if (dashboardData.radar.length) {
    lines.push("Radar chart data:");
    dashboardData.radar.forEach((point) => {
      lines.push(`${point.category}: ${point.score}`);
    });
  } else {
    lines.push("Radar chart data unavailable. Supported report categories were not found.");
  }

  lines.push("If visual charts cannot be rendered, the underlying chart data above is included instead.");
  return lines;
}

function aiSummaryLines(report: SavedMedicalReport): string[] {
  if (!report.aiSummary) {
    return ["AI summary has not been generated for this report."];
  }

  const summary = report.aiSummary;
  return [
    `Simple summary: ${summary.simple_summary || "Not available."}`,
    `Detailed explanation: ${summary.detailed_explanation || "Not available."}`,
    "Lifestyle suggestions:",
    ...(summary.lifestyle_suggestions.length ? summary.lifestyle_suggestions.map((item) => `- ${item}`) : ["- No lifestyle suggestions were returned."]),
    "Questions to ask doctor:",
    ...(summary.questions_to_ask_doctor.length ? summary.questions_to_ask_doctor.map((item) => `- ${item}`) : ["- No doctor questions were returned."]),
    `AI disclaimer: ${summary.disclaimer || "Not available."}`,
  ];
}

function paginate(lines: string[]): string[][] {
  const pages: string[][] = [[]];
  let currentY = TOP_Y;

  lines.flatMap(wrapLine).forEach((line) => {
    if (currentY < BOTTOM_Y) {
      pages.push([]);
      currentY = TOP_Y;
    }
    pages[pages.length - 1].push(line);
    currentY -= LINE_HEIGHT;
  });

  return pages;
}

function wrapLine(line: string): string[] {
  if (!line) {
    return [""];
  }

  const words = line.split(" ");
  const wrapped: string[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= MAX_CHARS) {
      current = candidate;
      return;
    }
    if (current) {
      wrapped.push(current);
    }
    current = word;
  });

  if (current) {
    wrapped.push(current);
  }

  return wrapped;
}

function createPdf(pages: string[][]): string {
  const objects: string[] = [];
  const pageObjectIds: number[] = [];
  const fontObjectId = 3;

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";

  pages.forEach((pageLines, index) => {
    const pageObjectId = 4 + index * 2;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);
    objects[pageObjectId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    const stream = buildContentStream(pageLines, index + 1, pages.length);
    objects[contentObjectId] = `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;
  objects[fontObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  const orderedObjects = objects.map((object, index) => ({ index, object })).filter((entry) => entry.index > 0 && entry.object);
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  orderedObjects.forEach(({ index, object }) => {
    offsets[index] = byteLength(pdf);
    pdf += `${index} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = byteLength(pdf);
  const maxObjectId = Math.max(...orderedObjects.map((entry) => entry.index));
  pdf += `xref\n0 ${maxObjectId + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index <= maxObjectId; index += 1) {
    pdf += `${String(offsets[index] ?? 0).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

function buildContentStream(lines: string[], pageNumber: number, totalPages: number): string {
  const operations = ["BT", "/F1 10 Tf", `1 0 0 1 ${LEFT_MARGIN} ${TOP_Y} Tm`];

  lines.forEach((line, index) => {
    if (index > 0) {
      operations.push(`0 -${LINE_HEIGHT} Td`);
    }
    operations.push(`(${escapePdfText(line)}) Tj`);
  });

  operations.push("ET");
  operations.push("BT");
  operations.push("/F1 9 Tf");
  operations.push(`1 0 0 1 ${LEFT_MARGIN} 28 Tm`);
  operations.push(`(Page ${pageNumber} of ${totalPages}) Tj`);
  operations.push("ET");
  return operations.join("\n");
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function byteLength(value: string): number {
  return new Blob([value]).size;
}

function formatLabel(value: string): string {
  return value.split("_").join(" ");
}

function formatNumber(value: number | undefined): string {
  return value === undefined ? "not available" : String(value);
}

function toReadableTrendKey(name: string): string {
  return `parameter_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

function formatDynamicTrendLabel(key: string): string {
  return key
    .replace(/^parameter_/, "")
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
