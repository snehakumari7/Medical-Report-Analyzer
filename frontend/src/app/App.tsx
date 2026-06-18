import { useEffect, useState } from "react";
import { BarChart3, Clock3, FileSearch, HeartPulse, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";

import AnalyticsPage from "../pages/AnalyticsPage";
import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import HistoryPage from "../pages/HistoryPage";
import ReportViewerPage from "../pages/ReportViewerPage";
import UploadPage from "../pages/UploadPage";
import { cn } from "../lib/utils";
import { useAuth } from "../features/auth/AuthContext";
import { MedicalRecordsProvider } from "../features/records/MedicalRecordsContext";
import { UploadSessionProvider } from "../features/upload/UploadSessionContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/report-viewer", label: "Report Viewer", icon: FileSearch },
  { to: "/history", label: "History", icon: Clock3 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function App() {
  const { user, signOut } = useAuth();
  const [isBooting, setIsBooting] = useState(() => import.meta.env.MODE !== "test");

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  if (isBooting) {
    return <LoadingSplash />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <MedicalRecordsProvider>
      <UploadSessionProvider>
        <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[304px_1fr]">
          <aside className="border-b border-rose-100 bg-white/90 shadow-sm backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
            <div className="flex h-full flex-col px-4 py-5 sm:px-6 lg:px-6">
              <div className="flex items-center gap-3">
                <LogoMark size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">AI report analyzer</p>
                  <h1 className="text-xl font-black tracking-normal">
                    Med<span className="text-primary">Decode</span> <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-black text-white">AI</span>
                  </h1>
                </div>
              </div>

              <nav className="mt-5 flex flex-wrap gap-2 lg:flex-col">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/dashboard"}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                        isActive ? "bg-primary text-primary-foreground shadow-sm shadow-rose-200" : "text-rose-800 hover:bg-rose-50 hover:text-rose-950",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-auto hidden rounded-lg border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4 text-sm leading-6 text-rose-950 shadow-sm lg:block">
                <p className="font-semibold">Understand. Analyze. Improve.</p>
                <p className="mt-1 text-muted-foreground">Insights are generated only from your uploaded report data.</p>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="border-b border-rose-100 bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Medical Intelligence Workspace</p>
                <div className="ml-auto flex w-fit flex-wrap items-center justify-end gap-3 text-sm font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-800 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
                </div>
              </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<StartPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/report-viewer" element={<ReportViewerPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </UploadSessionProvider>
    </MedicalRecordsProvider>
  );
}

function StartPage() {
  return <Navigate to="/dashboard" replace />;
}

function LoadingSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-rose-200" />
          <LogoMark size="lg" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-primary">MedDecode AI</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Loading medical insights</h2>
        <p className="mt-2 text-sm text-muted-foreground">Secure upload, OCR, AI suggestions, and charts are getting ready.</p>
      </div>
    </div>
  );
}

function LogoMark({ size }: { size: "sm" | "lg" }) {
  const wrapperSize = size === "lg" ? "h-20 w-20 rounded-3xl" : "h-12 w-12 rounded-2xl";
  const iconSize = size === "lg" ? "h-10 w-10" : "h-6 w-6";

  return (
    <div className={`brand-mark relative flex ${wrapperSize} items-center justify-center bg-primary text-white`}>
      <div className="absolute -left-2 bottom-1 h-9 w-9 rounded-full border-[5px] border-white/95 border-r-transparent border-t-transparent" aria-hidden="true" />
      <HeartPulse className={`${iconSize} relative z-10`} aria-hidden="true" />
      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white" aria-hidden="true" />
    </div>
  );
}
