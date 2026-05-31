interface ProgressProps {
  value: number;
}

export function Progress({ value }: ProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-200" aria-hidden="true">
      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${normalizedValue}%` }} />
    </div>
  );
}
