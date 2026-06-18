import { FormEvent, useState } from "react";
import { Activity, AlertCircle, Loader2, LogIn, UserPlus } from "lucide-react";

import { Button } from "../components/ui/Button";
import { useAuth } from "../features/auth/AuthContext";

type AuthMode = "sign-in" | "sign-up";

export default function AuthPage() {
  const { signIn, signUp, authError } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const isSignUp = mode === "sign-up";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      if (isSignUp) {
        await signUp({ name, email, password });
        setSuccessMessage("Account created. Your workspace is ready.");
      } else {
        await signIn({ email, password });
        setSuccessMessage("Signed in successfully.");
      }
    } catch {
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="brand-mark flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Activity className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">AI report analyzer</p>
              <h1 className="text-2xl font-black tracking-normal">
                Med<span className="text-primary">Decode</span> <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-black text-white">AI</span>
              </h1>
            </div>
          </div>
          <div>
            <p className="inline-flex rounded-full bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Secure workflow</p>
            <h2 className="mt-3 max-w-xl text-4xl font-black tracking-normal">Sign in, upload, analyze, then track real trends.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              New accounts start empty. Dashboards, charts, history, and AI summaries appear only after reports are uploaded and extracted.
            </p>
          </div>
        </section>

        <section className="med-card rounded-lg p-6">
          <div className="mb-6 grid grid-cols-2 rounded-md bg-rose-50 p-1">
            <button
              type="button"
              className={`rounded-sm px-3 py-2 text-sm font-semibold transition ${mode === "sign-in" ? "bg-white text-slate-950 shadow-sm" : "text-rose-700"}`}
              onClick={() => setMode("sign-in")}
            >
              Login
            </button>
            <button
              type="button"
              className={`rounded-sm px-3 py-2 text-sm font-semibold transition ${mode === "sign-up" ? "bg-white text-slate-950 shadow-sm" : "text-rose-700"}`}
              onClick={() => setMode("sign-up")}
            >
              Sign up
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignUp ? (
              <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
            ) : null}
            <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
            <Field label="Password" value={password} onChange={setPassword} type="password" autoComplete={isSignUp ? "new-password" : "current-password"} />

            {authError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 flex-none" aria-hidden="true" />
                  <span>{authError}</span>
                </div>
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">
                {successMessage}
              </div>
            ) : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : isSignUp ? <UserPlus className="h-4 w-4" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
              {isSignUp ? "Create account" : "Login"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-rose-200 bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-rose-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        autoComplete={autoComplete}
      />
    </label>
  );
}
