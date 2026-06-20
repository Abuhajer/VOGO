"use client";

import { formatNumber } from "@/lib/format";

type Segment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  segments: Segment[];
  locale: string;
  emptyLabel: string;
};

export default function DonutChart({ segments, locale, emptyLabel }: DonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative h-40 w-40 shrink-0 rounded-full border border-gold-glow/15 bg-void/40 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wider text-ivory-faint">Total</span>
          <span className="font-serif text-2xl text-ivory-faint">{formatNumber(0, locale)}</span>
        </div>
        <p className="text-sm text-ivory-faint flex-1">{emptyLabel}</p>
      </div>
    );
  }

  let cursor = 0;
  const gradientParts = segments.map((segment) => {
    const start = (cursor / total) * 100;
    cursor += segment.value;
    const end = (cursor / total) * 100;
    return `${segment.color} ${start}% ${end}%`;
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${gradientParts.join(", ")})`,
        }}
      >
        <div className="absolute inset-5 rounded-full bg-obsidian flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wider text-ivory-faint">Total</span>
          <span className="font-serif text-2xl text-gold">{formatNumber(total, locale)}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2 w-full">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-ivory-muted min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="text-ivory tabular-nums shrink-0">
              {formatNumber(segment.value, locale)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
