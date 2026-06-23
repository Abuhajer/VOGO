"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  buildCalendarDays,
  formatDateTimeDisplay,
  getWeekdayLabels,
  parseDateTimeLocal,
  sameCalendarDay,
  toDateTimeLocalValue,
} from "@/lib/datetime-local";

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  locale: string;
  id?: string;
  className?: string;
  placeholder?: string;
  clearLabel?: string;
  timeLabel?: string;
  todayLabel?: string;
};

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4.5" width="18" height="16" rx="1.5" />
      <path d="M3 9.5h18M8 3v3M16 3v3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden>
      {direction === "left" ? (
        <path d="M12.5 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M7.5 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function DateTimePicker({
  value,
  onChange,
  locale,
  id,
  className = "",
  placeholder,
  clearLabel = "Clear",
  timeLabel = "Time",
  todayLabel = "Today",
}: Props) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const parsed = useMemo(() => parseDateTimeLocal(value), [value]);
  const today = useMemo(() => new Date(), []);
  const weekStartsOn = locale === "ar" ? 6 : 0;

  const [viewYear, setViewYear] = useState(() => (parsed ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (parsed ?? today).getMonth());
  const [hours, setHours] = useState(() => (parsed ?? today).getHours());
  const [minutes, setMinutes] = useState(() => (parsed ?? today).getMinutes());

  useEffect(() => {
    const date = parseDateTimeLocal(value);
    if (!date) return;
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setHours(date.getHours());
    setMinutes(date.getMinutes());
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(viewYear, viewMonth, 1)),
    [locale, viewMonth, viewYear]
  );
  const weekdays = useMemo(() => getWeekdayLabels(locale, weekStartsOn), [locale, weekStartsOn]);
  const days = useMemo(
    () => buildCalendarDays(viewYear, viewMonth, weekStartsOn),
    [viewMonth, viewYear, weekStartsOn]
  );

  const displayValue = formatDateTimeDisplay(value, locale);

  function commitDate(date: Date, nextHours = hours, nextMinutes = minutes) {
    const merged = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      nextHours,
      nextMinutes
    );
    onChange(toDateTimeLocalValue(merged));
  }

  function selectDay(day: Date) {
    commitDate(day);
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function handleHoursChange(nextHours: number) {
    const clamped = Math.min(23, Math.max(0, nextHours));
    setHours(clamped);
    const base = parsed ?? new Date(viewYear, viewMonth, today.getDate());
    commitDate(base, clamped, minutes);
  }

  function handleMinutesChange(nextMinutes: number) {
    const clamped = Math.min(59, Math.max(0, nextMinutes));
    setMinutes(clamped);
    const base = parsed ?? new Date(viewYear, viewMonth, today.getDate());
    commitDate(base, hours, clamped);
  }

  function handleToday() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setHours(now.getHours());
    setMinutes(now.getMinutes());
    onChange(toDateTimeLocalValue(now));
  }

  function handleClear() {
    onChange(null);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={inputId}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-sm border bg-void px-4 py-3 text-sm transition-colors ${
          open ? "border-gold/50 ring-1 ring-gold/20" : "border-gold-glow/20 hover:border-gold/30"
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-gold" />
        <span className={`flex-1 text-start ${displayValue ? "text-ivory" : "text-ivory-faint"}`}>
          {displayValue || placeholder}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={placeholder}
          className="absolute z-[60] mt-2 w-[min(100vw-2rem,20rem)] rounded-sm border border-gold-glow/25 bg-obsidian p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-sm border border-gold-glow/15 p-1.5 text-ivory-muted hover:border-gold/30 hover:text-gold"
              aria-label="Previous month"
            >
              <ChevronIcon direction={locale === "ar" ? "right" : "left"} />
            </button>
            <p className="font-serif text-sm text-ivory">{monthLabel}</p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-sm border border-gold-glow/15 p-1.5 text-ivory-muted hover:border-gold/30 hover:text-gold"
              aria-label="Next month"
            >
              <ChevronIcon direction={locale === "ar" ? "left" : "right"} />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekdays.map((label) => (
              <span
                key={label}
                className="py-1 text-center text-[10px] uppercase tracking-wider text-ivory-faint"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <span key={`empty-${index}`} />;
              }

              const selected = parsed ? sameCalendarDay(day, parsed) : false;
              const isToday = sameCalendarDay(day, today);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`aspect-square rounded-sm text-sm transition-colors ${
                    selected
                      ? "bg-gold text-void font-medium"
                      : isToday
                        ? "border border-gold/40 text-gold hover:bg-gold/10"
                        : "text-ivory hover:bg-gold/10 hover:text-gold"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-gold-glow/15 pt-4">
            <span className="text-[10px] uppercase tracking-wider text-ivory-faint">{timeLabel}</span>
            <div className="ms-auto flex items-center gap-1.5" dir="ltr">
              <input
                type="number"
                min={0}
                max={23}
                value={hours}
                onChange={(event) => handleHoursChange(Number(event.target.value))}
                className="w-14 rounded-sm border border-gold-glow/20 bg-void px-2 py-1.5 text-center text-sm text-ivory focus:border-gold/50 focus:outline-none tabular-nums"
                aria-label="Hours"
              />
              <span className="text-ivory-faint">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(event) => handleMinutesChange(Number(event.target.value))}
                className="w-14 rounded-sm border border-gold-glow/20 bg-void px-2 py-1.5 text-center text-sm text-ivory focus:border-gold/50 focus:outline-none tabular-nums"
                aria-label="Minutes"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleToday}
              className="text-[11px] uppercase tracking-wider text-gold hover:text-gold/80"
            >
              {todayLabel}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] uppercase tracking-wider text-ivory-faint hover:text-ivory"
            >
              {clearLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
