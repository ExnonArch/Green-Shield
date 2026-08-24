import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "@/components/gs/page-header";
import { ProvenanceChip } from "@/components/gs/provenance";
import { DemoBanner, ErrorPanel, LoadingRow, PanelSkeleton } from "@/components/gs/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEnvironment } from "@/hooks/use-environment";
import { askGreenShieldAI } from "@/lib/gs/ai.functions";
import { formatTimestamp, locationLabel } from "@/lib/gs/format";
import { BAND_LABEL, BAND_TEXT } from "@/lib/gs/scoring";
import { useGreenShield } from "@/lib/gs/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "GreenShield AI Chat — GreenShield" },
      {
        name: "description",
        content:
          "Ask a location-aware assistant about live weather, air quality and the GreenShield risk score. It answers only from the measurements in the data brief.",
      },
      { property: "og:title", content: "GreenShield AI Chat — GreenShield" },
      {
        property: "og:description",
        content: "A climate assistant grounded in live Open-Meteo readings and transparent GreenShield scores.",
      },
    ],
  }),
  component: ChatPage,
});

interface Msg {
  role: "user" | "assistant";
  content: string;
  at: string;
}

const STARTERS = [
  "Explain today's environmental risk score in plain language.",
  "Which hazard is driving the score right now, and why?",
  "What should an outdoor worker do here over the next 24 hours?",
  "How does the air quality compare with WHO guideline values?",
];

function ChatPage() {
  const { bundle, risk, brief, isLoading, error, refetch } = useEnvironment();
  const { location, settings } = useGreenShield();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const ask = useServerFn(askGreenShieldAI);

  // A new location invalidates the grounding brief, so start a fresh thread.
  useEffect(() => {
    setMessages([]);
  }, [location.id]);

  const mutation = useMutation({
    mutationFn: (question: string) =>
      ask({
        data: {
          question,
          contextBrief: brief,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        },
      }),
    onSuccess: (res) => {
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer, at: res.generatedAt }]);
    },
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, mutation.isPending]);

  const send = (question: string) => {
    const q = question.trim();
    if (!q || !brief || mutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: q, at: new Date().toISOString() }]);
    setInput("");
    mutation.mutate(q);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="GreenShield AI"
        title="Ask about the conditions here"
        description="The assistant receives a data brief containing only the live Open-Meteo measurements and GreenShield scores for the active location. It is instructed never to invent a number, and to say so when a value is unavailable."
      />

      {isLoading ? <PanelSkeleton lines={5} /> : null}

      {error && !bundle ? (
        <ErrorPanel
          message="Live conditions could not be loaded, so the assistant has nothing to ground its answers in."
          onRetry={refetch}
        />
      ) : null}

      {!settings.aiExplanations ? (
        <div className="panel p-5">
          <p className="text-xs leading-relaxed">
            AI explanations are switched off in Settings. Turn them back on to use the chat — every other page keeps
            working on measurements and rule-based scoring alone.
          </p>
        </div>
      ) : null}

      {bundle && risk && settings.aiExplanations ? (
        <>
          {bundle.demo ? <DemoBanner onRetry={refetch} /> : null}

          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4">
              <div className="panel space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <p className="label-micro">Grounding snapshot</p>
                  <ProvenanceChip source="calc" />
                </div>
                <p className="text-sm font-bold">{locationLabel(location)}</p>
                <p className={cn("num text-4xl font-extrabold", BAND_TEXT[risk.band])}>{risk.score}</p>
                <p className={cn("num text-[10px] font-bold uppercase", BAND_TEXT[risk.band])}>
                  {BAND_LABEL[risk.band]} composite risk
                </p>
                <ul className="space-y-1 border-t pt-3">
                  {risk.subScores.map((s) => (
                    <li key={s.key} className="num flex justify-between text-[10px]">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-bold">{s.score}</span>
                    </li>
                  ))}
                </ul>
                <p className="num text-muted-foreground text-[9px] uppercase">
                  Observed {formatTimestamp(bundle.weather.observedAt, bundle.weather.timezone)}
                </p>
              </div>

              <div className="panel space-y-2 p-5">
                <p className="label-micro">Starter questions</p>
                <div className="space-y-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      disabled={mutation.isPending}
                      className="hover:bg-muted w-full rounded-md border px-3 py-2 text-left text-[11px] leading-relaxed transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="panel flex min-h-[520px] flex-col p-0">
              <div className="flex flex-wrap items-center gap-2 border-b px-5 py-3">
                <ProvenanceChip source="ai">AI INTERPRETATION</ProvenanceChip>
                <span className="num text-muted-foreground text-[9px] uppercase">
                  Grounded in Open-Meteo measurements
                </span>
                {messages.length ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMessages([])}
                    className="ml-auto h-7 text-[11px]"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Clear
                  </Button>
                ) : null}
              </div>

              <div
                ref={listRef}
                className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
                role="log"
                aria-live="polite"
                aria-label="Conversation"
              >
                {!messages.length ? (
                  <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
                    No messages yet. Ask anything about the readings for {locationLabel(location)} — the assistant can
                    explain the score, compare pollutants against guidelines, or translate the forecast into practical
                    steps. It cannot browse the web or read sensors it has not been given.
                  </p>
                ) : null}

                {messages.map((m, i) => (
                  <div
                    key={`${m.at}-${i}`}
                    className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {m.role === "assistant" ? (
                      <span className="bg-forest text-forest-foreground mt-0.5 grid size-7 shrink-0 place-items-center rounded-md">
                        <Sparkles className="size-3.5" aria-hidden />
                      </span>
                    ) : null}
                    <div
                      className={cn(
                        "max-w-[46rem] rounded-lg px-4 py-3 text-xs leading-relaxed",
                        m.role === "user" ? "bg-foreground text-background" : "bg-muted",
                      )}
                    >
                      {m.role === "assistant" ? (
                        <div className="gs-markdown space-y-2">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{m.content}</p>
                      )}
                      <p className="num mt-2 text-[9px] opacity-60 uppercase">{formatTimestamp(m.at)}</p>
                    </div>
                    {m.role === "user" ? (
                      <span className="bg-muted mt-0.5 grid size-7 shrink-0 place-items-center rounded-md">
                        <User className="size-3.5" aria-hidden />
                      </span>
                    ) : null}
                  </div>
                ))}

                {mutation.isPending ? <LoadingRow label="GreenShield AI is reading the brief" /> : null}

                {mutation.isError ? (
                  <ErrorPanel
                    title="The assistant could not answer"
                    message={(mutation.error as Error).message}
                    onRetry={() => {
                      const lastUser = [...messages].reverse().find((m) => m.role === "user");
                      if (lastUser) mutation.mutate(lastUser.content);
                    }}
                  />
                ) : null}
              </div>

              <form
                className="flex items-end gap-2 border-t px-5 py-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder={`Ask about conditions in ${locationLabel(location)}…`}
                  aria-label="Message GreenShield AI"
                  rows={2}
                  maxLength={2000}
                  className="min-h-[56px] resize-none text-xs"
                />
                <Button type="submit" disabled={!input.trim() || mutation.isPending} className="h-10">
                  <Send className="size-4" aria-hidden />
                  <span className="sr-only sm:not-sr-only">Send</span>
                </Button>
              </form>
            </section>
          </div>

          <p className="num text-muted-foreground text-[9px] uppercase">
            Answers are AI interpretation of Open-Meteo measurements and GreenShield calculations · the API key is held
            server-side and never reaches the browser
          </p>
        </>
      ) : null}
    </div>
  );
}
