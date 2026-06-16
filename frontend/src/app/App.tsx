import { Activity, BarChart3, Clock3, FileSearch, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";

import AnalyticsPage from "../pages/AnalyticsPage";
import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import HistoryPage from "../pages/HistoryPage";
import ReportViewerPage from "../pages/ReportViewerPage";
import UploadPage from "../pages/UploadPage";
import { cn } from "../lib/utils";
import { useAuth } from "../features/auth/AuthContext";
import { MedicalRecordsProvider, useMedicalRecords } from "../features/records/MedicalRecordsContext";
import { UploadSessionProvider } from "../features/upload/UploadSessionContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/report-viewer", label: "Report Viewer", icon: FileSearch },
  { to: "/history", label: "History", icon: Clock3 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function App() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  return (
    <MedicalRecordsProvider>
      <UploadSessionProvider>
        <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-rose-100 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 xl:grid-cols-[auto_1fr_auto] xl:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shadow-rose-200">
                  <Activity className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Medical Report Analyzer</p>
                  <h1 className="text-lg font-semibold tracking-normal">Healthcare Dashboard</h1>
                </div>
              </div>

              <nav className="flex flex-wrap gap-2 xl:justify-center">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/dashboard"}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                        isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-rose-800 hover:bg-rose-50 hover:text-rose-950",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="flex flex-wrap items-center justify-start gap-3 text-sm font-medium text-muted-foreground xl:justify-end">
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
      </UploadSessionProvider>
    </MedicalRecordsProvider>
  );
}

function StartPage() {
  const { dashboardData } = useMedicalRecords();
  return <Navigate to={dashboardData ? "/dashboard" : "/report-viewer"} replace />;
}
