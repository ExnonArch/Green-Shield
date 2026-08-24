import { Link } from "@tanstack/react-router";
import { BAND_BG, BAND_LABEL, BAND_TEXT, bandOf } from "@/lib/gs/scoring";
import type { RiskResult } from "@/lib/gs/types";
import { cn } from "@/lib/utils";
import { ProvenanceChip } from "./provenance";

const BANDS = ["low", "moderate", "elevated", "high", "severe"] as const;

/** SVG arc gauge — the signature instrument of the observatory theme. */
function Gauge({ score, band, size = 216 }: { score: number; band: RiskResult["band"]; size?: number }) {
  const stroke = 11;
  const r = (size - stroke) / 2 - 6;
  const c = 2 * Math.PI * r;
  const filled = Math.min(Math.max(score, 0), 100) / 100;
  const offset = c * (1 - filled);

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Environmental risk score ${score} out of 100, ${BAND_LABEL[band]} severity`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn("gauge-arc", BAND_TEXT[band])}
          style={{
            filter: `drop-shadow(0 0 14px color-mix(in oklab, currentColor 55%, transparent))`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("num text-6xl leading-none font-bold tracking-tight", BAND_TEXT[band])}>
          {score}
        </span>
        <span className="text-muted-foreground num mt-1 text-xs">/100</span>
        <span
          className={cn(
            "num mt-3 rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-[0.18em] uppercase",
            BAND_BG[band],
            "text-primary-foreground",
          )}
        >
          {BAND_LABEL[band]}
        </span>
      </div>
    </div>
  );
}

export function RiskGauge({ risk, compact = false }: { risk: RiskResult; compact?: boolean }) {
  const activeIndex = BANDS.indexOf(risk.band);

  return (
    <div className="panel flex h-full flex-col justify-between p-6">
      <div>
        <div className="mb-5 flex items-start justify-between gap-2">
          <span className="label-micro">Environmental risk score</span>
          <ProvenanceChip source="calc">GS-CALC-V1</ProvenanceChip>
        </div>

        <Gauge score={risk.score} band={risk.band} />

        <div className="mt-6 flex h-1.5 w-full gap-1">
          {BANDS.map((band, i) => (
            <div
              key={band}
              className={cn(
                "h-full flex-1 rounded-[2px] transition-opacity",
                BAND_BG[band],
                i === activeIndex ? "opacity-100" : "opacity-20",
              )}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted-foreground num text-[10px]">0 = safest</span>
          <span className="text-muted-foreground num text-[10px]">100 = severe</span>
        </div>

        {!compact ? (
          <p className="mt-4 text-xs leading-relaxed font-medium">
            {risk.drivers.length ? (
              <>
                Driven mainly by{" "}
                {risk.drivers.map((d, i) => (
                  <span key={d.key}>
                    {i > 0 ? " and " : ""}
                    <span className={BAND_TEXT[d.band]}>{d.label.toLowerCase()}</span>
                  </span>
                ))}
                , weighted against the other measured hazards.
              </>
            ) : (
              <>All measured hazard components are currently at or near zero for this location.</>
            )}
          </p>
        ) : null}
      </div>

      <div className="mt-8 space-y-3">
        {risk.subScores.map((s) => (
          <div
            key={s.key}
            className="border-border/70 flex items-center justify-between gap-3 border-b pb-2 last:border-0"
          >
            <span className="text-muted-foreground text-[11px]">{s.label}</span>
            <span className="num text-[11px] font-bold">
              <span className={BAND_TEXT[bandOf(s.score)]}>{BAND_LABEL[bandOf(s.score)]}</span> ({s.score})
            </span>
          </div>
        ))}
        <Link
          to="/methodology"
          className="text-muted-foreground hover:text-primary num inline-block pt-1 text-[10px] uppercase underline underline-offset-4 transition-colors"
        >
          How this score is computed
        </Link>
      </div>
    </div>
  );
}

export function RiskBreakdown({ risk }: { risk: RiskResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {risk.subScores.map((s) => (
        <div key={s.key} className="panel panel-hover space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">{s.label}</h3>
              <p className="text-muted-foreground num mt-1 text-[10px] uppercase">
                Weight {Math.round(s.weight * 100)}% of composite
              </p>
            </div>
            <div className={cn("num text-2xl font-extrabold", BAND_TEXT[s.band])}>{s.score}</div>
          </div>
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={cn("h-full rounded-full transition-[width] duration-700", BAND_BG[s.band])}
              style={{ width: `${s.score}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">{s.explanation}</p>
          <ul className="space-y-1">
            {s.inputs.map((input) => (
              <li key={input} className="num flex items-center gap-2 text-[10px]">
                <span className="bg-forest size-1 shrink-0 rounded-full" aria-hidden />
                {input}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
