import { useEffect, useState } from "react";
import { Activity, BarChart3, Clock3, FileSearch, LayoutDashboard, LogOut, ShieldCheck, UploadCloud } from "lucide-react";
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
        <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-rose-100 bg-white/95 shadow-sm backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
            <div className="flex h-full flex-col px-4 py-4 sm:px-6 lg:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shadow-rose-200">
                  <Activity className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-muted-foreground">Medical Report Analyzer</p>
                  <h1 className="text-lg font-semibold tracking-normal">MediScan</h1>
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
                        isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-rose-800 hover:bg-rose-50 hover:text-rose-950",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-auto hidden rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-950 lg:block">
                <p className="font-semibold">Report-first insights</p>
                <p className="mt-1 text-muted-foreground">Your graphs and suggestions are built only from uploaded reports.</p>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="border-b border-rose-100 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
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
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-rose-200" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-rose-200">
            <UploadCloud className="h-8 w-8 animate-bounce" aria-hidden="true" />
          </div>
        </div>
        <p className="mt-6 text-sm font-semibold uppercase text-primary">MediScan is preparing your workspace</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Loading medical insights</h2>
        <p className="mt-2 text-sm text-muted-foreground">Secure upload, OCR, AI suggestions, and charts are getting ready.</p>
      </div>
    </div>
  );
}
