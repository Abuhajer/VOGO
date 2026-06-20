"use client";

import { formatNumber } from "@/lib/format";

type BarChartProps = {
  data: { label: string; value: number }[];
  locale: string;
  unit?: string;
  emptyLabel: string;
};

export default function BarChart({ data, locale, unit, emptyLabel }: BarChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const hasData = data.some((item) => item.value > 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-end justify-between gap-2 h-44 md:h-52 pt-4">
        {data.map((item) => {
          const height = item.value > 0 ? Math.max(8, Math.round((item.value / max) * 100)) : 4;
          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-2 min-w-0">
              <span className="text-[10px] text-gold/80 tabular-nums">
                {item.value > 0 ? formatNumber(item.value, locale) : "—"}
              </span>
              <div className="relative w-full max-w-[42px] h-32 md:h-40 flex items-end">
                <div
                  className={`w-full rounded-t-sm transition-all duration-500 ${
                    item.value > 0
                      ? "bg-gradient-to-t from-gold/30 via-gold/70 to-gold"
                      : "bg-gold/10"
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${formatNumber(item.value, locale)}${unit ? ` ${unit}` : ""}`}
                />
              </div>
              <span className="text-[10px] uppercase tracking-wide text-ivory-faint truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      {!hasData ? (
        <p className="mt-4 text-center text-xs text-ivory-faint">{emptyLabel}</p>
      ) : null}
    </div>
  );
}
