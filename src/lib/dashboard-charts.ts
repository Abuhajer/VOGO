import type { ChartBar } from "@/types/dashboard";

export function lastSevenDaysLabels(locale: string) {
  const labels: string[] = [];
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
    weekday: "short",
  });

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    labels.push(formatter.format(date));
  }

  return labels;
}

export function buildRevenueTrend(
  weekOrders: { total: number; createdAt: Date }[],
  locale: string
): ChartBar[] {
  const dayTotals = new Map<number, number>();

  for (const order of weekOrders) {
    const day = new Date(order.createdAt);
    day.setHours(0, 0, 0, 0);
    dayTotals.set(day.getTime(), (dayTotals.get(day.getTime()) ?? 0) + order.total);
  }

  const labels = lastSevenDaysLabels(locale);
  const trend: ChartBar[] = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    trend.push({
      label: labels[6 - index]!,
      value: dayTotals.get(date.getTime()) ?? 0,
    });
  }

  return trend;
}
