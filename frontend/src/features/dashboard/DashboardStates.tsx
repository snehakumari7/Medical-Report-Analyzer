import { AlertCircle, Inbox, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading clinical dashboard" }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-white">
      <div className="text-center">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-slate-700">{label}</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
      <div>
        <Inbox className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-base font-semibold text-slate-950">{title}</p>
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-900" role="alert">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 flex-none" aria-hidden="true" />
        <div>
          <p className="font-semibold">Unable to load dashboard</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
