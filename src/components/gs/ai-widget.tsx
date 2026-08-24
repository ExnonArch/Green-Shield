import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingRow } from "@/components/gs/states";
import { ProvenanceChip } from "@/components/gs/provenance";
import { useEnvironment } from "@/hooks/use-environment";
import { askGreenShieldAI } from "@/lib/gs/ai.functions";
import { locationLabel } from "@/lib/gs/format";
import { BAND_LABEL, BAND_TEXT } from "@/lib/gs/scoring";
import { useGreenShield } from "@/lib/gs/store";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const QUICK = [
  "Explain today's risk score",
  "What is driving the score?",
  "Is it safe to exercise outside?",
];

/** Floating, location-aware assistant available on every page. */
export function AiWidget() {
  const { location, settings } = useGreenShield();
  const { bundle, risk, brief } = useEnvironment();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const ask = useServerFn(askGreenShieldAI);

  useEffect(() => setMessages([]), [location.id]);

  const mutation = useMutation({
    mutationFn: (question: string) =>
      ask({ data: { question, contextBrief: brief, history: messages.slice(-8) } }),
    onSuccess: (res) => setMessages((p) => [...p, { role: "assistant", content: res.answer }]),
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, mutation.isPending]);

  useEffect(() => {
    if (open) taRef.current?.focus();
  }, [open, mutation.isPending]);

  if (!settings.aiExplanations) return null;

  const send = (q: string) => {
    const question = q.trim();
    if (!question || !brief || mutation.isPending) return;
    setMessages((p) => [...p, { role: "user", content: question }]);
    setInput("");
    mutation.mutate(question);
  };

  return (
    <>
      {open ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 bg-background fixed right-3 bottom-3 z-[800] flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-1.5rem))] flex-col rounded-2xl border shadow-2xl duration-200 sm:right-5 sm:bottom-5">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <span className="bg-forest text-forest-foreground grid size-7 shrink-0 place-items-center rounded-md">
              <Sparkles className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold">GreenShield AI</p>
              <p className="num text-muted-foreground truncate text-[9px] uppercase">
                {locationLabel(location)}
                {risk ? (
                  <>
                    {" · "}
                    <span className={cn("font-bold", BAND_TEXT[risk.band])}>
                      {risk.score} {BAND_LABEL[risk.band]}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="size-7" aria-label="Close assistant" onClick={() => setOpen(false)}>
              <X className="size-4" aria-hidden />
            </Button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
            {!messages.length ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Grounded in the live Open-Meteo readings for this location. It never invents a measurement.
                </p>
                <div className="space-y-1.5">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      disabled={!brief}
                      className="hover:bg-muted w-full rounded-md border px-3 py-2 text-left text-[11px] transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-[11px] leading-relaxed",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="gs-markdown space-y-2">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}

            {mutation.isPending ? <LoadingRow label="Running AI System" /> : null}
            {mutation.isError ? (
              <p className="text-destructive text-[11px]">{(mutation.error as Error).message}</p>
            ) : null}
            {!bundle ? <p className="text-muted-foreground text-[11px]">Loading live readings…</p> : null}
          </div>

          <form
            className="flex items-end gap-2 border-t px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              maxLength={2000}
              aria-label="Message GreenShield AI"
              placeholder="Ask about these conditions…"
              className="max-h-24 min-h-9 resize-none py-2 text-[11px]"
            />
            <Button type="submit" size="icon" className="size-9 shrink-0" disabled={!input.trim() || mutation.isPending}>
              <Send className="size-4" aria-hidden />
              <span className="sr-only">Send</span>
            </Button>
          </form>

          <div className="flex items-center gap-2 border-t px-3 py-2">
            <ProvenanceChip source="ai">AI INTERPRETATION</ProvenanceChip>
            <span className="num text-muted-foreground text-[9px] uppercase">Open-Meteo grounded</span>
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close GreenShield AI" : "Open GreenShield AI"}
        className={cn(
          "fixed right-3 bottom-3 z-[790] h-12 gap-2 rounded-full px-4 shadow-xl transition-transform hover:scale-105 sm:right-5 sm:bottom-5",
          open && "hidden",
        )}
      >
        <MessageSquare className="size-4" aria-hidden />
        <span className="text-xs font-bold">Ask AI</span>
      </Button>
    </>
  );
}
