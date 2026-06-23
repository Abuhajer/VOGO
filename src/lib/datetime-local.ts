/** Parse `datetime-local` value (YYYY-MM-DDTHH:mm) as local time. */
export function parseDateTimeLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5])
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a Date as `datetime-local` value (YYYY-MM-DDTHH:mm). */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Convert ISO / DB datetime string to `datetime-local` for forms. */
export function fromIsoToDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return toDateTimeLocalValue(date);
}

/** Locale-aware display for picker trigger. */
export function formatDateTimeDisplay(value: string | null | undefined, locale: string): string {
  const date = parseDateTimeLocal(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function buildCalendarDays(year: number, month: number, weekStartsOn = 0): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const cells: (Date | null)[] = [];

  for (let i = 0; i < leading; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }

  return cells;
}

export function getWeekdayLabels(locale: string, weekStartsOn = 0): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = (weekStartsOn + i) % 7;
    const date = new Date(2024, 0, day === 0 ? 7 : day);
    labels.push(formatter.format(date));
  }
  return labels;
}
