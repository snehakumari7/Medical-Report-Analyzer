import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, Loader2, MessageCircle, Send, Sparkles } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { askMedicalChatbot } from "../../services/uploadApi";
import type { AiSummaryParameter, ChatMessage } from "../../types/upload";
import type { DashboardData, DashboardParameter } from "../records/MedicalRecordsContext";

interface DashboardChatbotProps {
  dashboardData: DashboardData | null;
}

export function DashboardChatbot({ dashboardData }: DashboardChatbotProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const chatbotContext = useMemo(() => buildChatbotContext(dashboardData), [dashboardData]);

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || state === "loading") {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmedQuestion }];
    setMessages(nextMessages);
    setQuestion("");
    setState("loading");
    setError("");

    try {
      const response = await askMedicalChatbot({
        question: trimmedQuestion,
        context: chatbotContext,
        conversation: messages.slice(-8),
      });
      setMessages([...nextMessages, { role: "assistant", content: `${response.answer}\n\n${response.safety_note}` }]);
      setState("success");
    } catch (chatError) {
      setState("error");
      setError(resolveChatError(chatError));
    }
  };

  return (
    <section className="rounded-lg border border-rose-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-base font-semibold text-slate-950">Medical report chatbot</h3>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Ask questions about your uploaded report, abnormal markers, trends, or what to discuss with your doctor.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Groq AI
        </span>
      </div>

      <div className="mt-5 min-h-48 space-y-3 rounded-lg border border-rose-100 bg-rose-50/60 p-3">
        {messages.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center text-center">
            <div>
              <MessageCircle className="mx-auto h-7 w-7 text-primary" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-950">Your private report assistant is ready.</p>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                {dashboardData ? "Try asking: Which values should I monitor first?" : "Upload a report for context-aware answers, or ask a general report-reading question."}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}-${message.content.slice(0, 12)}`} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  message.role === "user"
                    ? "max-w-[86%] rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground"
                    : "max-w-[92%] whitespace-pre-line rounded-lg border border-rose-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
                }
              >
                {message.content}
              </div>
            </div>
          ))
        )}

        {state === "loading" ? (
          <div className="flex items-center gap-2 text-sm font-medium text-rose-900" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Thinking through your report context...
          </div>
        ) : null}
      </div>

      {state === "error" && error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 flex-none" aria-hidden="true" />
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={submitQuestion}>
        <label className="sr-only" htmlFor="medical-chat-question">
          Ask a medical report question
        </label>
        <input
          id="medical-chat-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about glucose, LDL, health score, or next questions for your doctor..."
          className="min-h-10 flex-1 rounded-md border border-rose-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-rose-100"
          maxLength={1200}
          disabled={state === "loading"}
        />
        <Button type="submit" disabled={!question.trim() || state === "loading"} className="sm:w-auto">
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          Ask
        </Button>
      </form>
    </section>
  );
}

function buildChatbotContext(dashboardData: DashboardData | null) {
  const parameters = dashboardData?.parameters ?? [];
  const aiParameters = parameters.map(toAiParameter);

  return {
    health_score: dashboardData?.healthScore ?? null,
    extracted_parameters: aiParameters,
    abnormal_values: parameters.filter((parameter) => parameter.severity !== "normal").map(toAiParameter),
    report_filename: dashboardData?.latestReport?.filename ?? null,
  };
}

function toAiParameter(parameter: DashboardParameter): AiSummaryParameter {
  return {
    parameter_name: parameter.name,
    value: parameter.value,
    unit: parameter.unit,
    status: parameter.status,
    severity: parameter.severity === "normal" ? "none" : parameter.severity,
    reference_range: parameter.range,
  };
}

function resolveChatError(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) {
      return response.data.detail;
    }
  }

  if (typeof error === "object" && error !== null && "request" in error) {
    return "Network error. Check that the backend server is running on port 8011.";
  }

  return "The chatbot could not answer right now. Please try again.";
}
