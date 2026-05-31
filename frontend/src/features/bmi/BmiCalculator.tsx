import { FormEvent, useMemo, useState } from "react";
import { Calculator, HeartPulse, RotateCcw } from "lucide-react";

import { Button } from "../../components/ui/Button";

interface BmiResult {
  bmi: number;
  category: string;
  message: string;
  tone: string;
}

export function BmiCalculator() {
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo<BmiResult | null>(() => {
    if (!submitted || error) {
      return null;
    }

    const heightMeters = Number(height) / 100;
    const bmi = Number(weight) / (heightMeters * heightMeters);
    return classifyBmi(bmi);
  }, [error, height, submitted, weight]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateInputs(Number(age), Number(height), Number(weight));
    setError(validationError);
    setSubmitted(!validationError);
  };

  const reset = () => {
    setAge("");
    setHeight("");
    setWeight("");
    setError("");
    setSubmitted(false);
  };

  return (
    <section className="rounded-lg border border-rose-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-base font-semibold text-slate-950">BMI index calculator</h3>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Enter age, height, and weight to calculate body mass index.</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-rose-700 transition hover:bg-rose-50"
          aria-label="Reset BMI calculator"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form className="mt-5 grid gap-3 sm:grid-cols-3" onSubmit={handleSubmit}>
        <NumberField label="Age" value={age} onChange={setAge} suffix="yrs" />
        <NumberField label="Height" value={height} onChange={setHeight} suffix="cm" />
        <NumberField label="Weight" value={weight} onChange={setWeight} suffix="kg" />

        <div className="sm:col-span-3">
          <Button className="w-full" type="submit">
            <Calculator className="h-4 w-4" aria-hidden="true" />
            Calculate BMI
          </Button>
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
          {error}
        </div>
      ) : null}

      {!submitted && !error ? (
        <div className="mt-4 rounded-md border border-dashed border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          Your BMI result will appear here after calculation.
        </div>
      ) : null}

      {result ? (
        <div className={`mt-4 rounded-md border p-4 ${result.tone}`} role="status" aria-live="polite">
          <p className="text-sm font-semibold">BMI index</p>
          <p className="mt-1 text-3xl font-semibold">{result.bmi.toFixed(1)}</p>
          <p className="mt-2 text-sm font-semibold">{result.category}</p>
          <p className="mt-1 text-sm leading-6">{result.message}</p>
        </div>
      ) : null}
    </section>
  );
}

function NumberField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (value: string) => void; suffix: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2 flex h-11 overflow-hidden rounded-md border border-rose-200 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-rose-100">
        <input
          className="min-w-0 flex-1 px-3 text-sm outline-none"
          inputMode="decimal"
          min="0"
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="inline-flex items-center border-l border-rose-100 bg-rose-50 px-3 text-xs font-semibold text-muted-foreground">{suffix}</span>
      </div>
    </label>
  );
}

function validateInputs(age: number, height: number, weight: number): string {
  if (!Number.isFinite(age) || !Number.isFinite(height) || !Number.isFinite(weight)) {
    return "Enter valid numbers for age, height, and weight.";
  }
  if (age < 1 || age > 120) {
    return "Age must be between 1 and 120 years.";
  }
  if (height < 50 || height > 250) {
    return "Height must be between 50 and 250 cm.";
  }
  if (weight < 2 || weight > 350) {
    return "Weight must be between 2 and 350 kg.";
  }
  return "";
}

function classifyBmi(bmi: number): BmiResult {
  if (bmi < 18.5) {
    return {
      bmi,
      category: "Below reference range",
      message: "BMI is below the usual adult reference range. Discuss nutrition and clinical context with a qualified clinician.",
      tone: "border-amber-200 bg-amber-50 text-amber-950",
    };
  }
  if (bmi < 25) {
    return {
      bmi,
      category: "Within reference range",
      message: "BMI is within the usual adult reference range. Keep interpreting it alongside labs, history, and clinician guidance.",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-950",
    };
  }
  if (bmi < 30) {
    return {
      bmi,
      category: "Above reference range",
      message: "BMI is above the usual adult reference range. Consider discussing activity, nutrition, and metabolic markers with a clinician.",
      tone: "border-orange-200 bg-orange-50 text-orange-950",
    };
  }
  return {
    bmi,
    category: "High range",
    message: "BMI is in a high range. This is not a diagnosis; review it with a qualified clinician alongside other health data.",
    tone: "border-red-200 bg-red-50 text-red-950",
  };
}
