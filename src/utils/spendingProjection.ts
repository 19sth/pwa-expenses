import { addMonths, differenceInCalendarDays, eachDayOfInterval, format, parseISO, startOfDay } from "date-fns";
import type { ExpenseEntry } from "./expenses";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export interface SpendingProjectionPoint {
  date: string;
  actual: number | null;
  projected: number | null;
  spentOnDay: number;
}

export interface SpendingProjection {
  windowStart: Date;
  windowEnd: Date;
  today: Date;
  daysElapsed: number;
  daysRemaining: number;
  actualSpend: number;
  dailyPace: number;
  projectedTotal: number;
  points: SpendingProjectionPoint[];
}

const earliestDocumentDate = (entries: ExpenseEntry[]) => {
  const dates = entries.map((entry) => entry.date).filter((date) => ISO_DATE.test(date));
  dates.sort();
  return dates[0] ?? null;
};

/**
 * Project spending from the earliest date in the imported documents through one calendar month later.
 * Pace is spending between that first date and today, divided by the days elapsed in the window so far.
 */
export function buildSpendingProjection(entries: ExpenseEntry[], now: Date = new Date()): SpendingProjection {
  const today = startOfDay(now);
  const todayKey = format(today, "yyyy-MM-dd");
  const windowStart = parseISO(earliestDocumentDate(entries) ?? todayKey);
  const windowEnd = addMonths(windowStart, 1);
  const windowStartKey = format(windowStart, "yyyy-MM-dd");
  const windowEndKey = format(windowEnd, "yyyy-MM-dd");

  const elapsedEndKey =
    todayKey < windowStartKey ? null : todayKey < windowEndKey ? todayKey : windowEndKey;
  const daysElapsed = elapsedEndKey ? differenceInCalendarDays(parseISO(elapsedEndKey), windowStart) + 1 : 0;
  const daysRemaining =
    todayKey >= windowEndKey
      ? 0
      : todayKey < windowStartKey
        ? differenceInCalendarDays(windowEnd, windowStart) + 1
        : differenceInCalendarDays(windowEnd, today);

  const spentByDay = new Map<string, number>();
  entries.forEach((entry) => {
    if (entry.amount >= 0 || !ISO_DATE.test(entry.date)) {
      return;
    }
    if (entry.date < windowStartKey || entry.date > windowEndKey) {
      return;
    }
    if (elapsedEndKey && entry.date > elapsedEndKey) {
      return;
    }
    if (!elapsedEndKey) {
      return;
    }
    spentByDay.set(entry.date, (spentByDay.get(entry.date) ?? 0) + Math.abs(entry.amount));
  });

  let exactSpend = 0;
  spentByDay.forEach((value) => {
    exactSpend += value;
  });
  const actualSpend = roundMoney(exactSpend);
  const dailyPace = daysElapsed > 0 ? actualSpend / daysElapsed : 0;

  let running = 0;
  const points = eachDayOfInterval({ start: windowStart, end: windowEnd }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    const spentOnDay = spentByDay.get(date) ?? 0;
    const isActual = elapsedEndKey != null && date <= elapsedEndKey;
    const isProjected = date >= todayKey && date <= windowEndKey;
    if (isActual) {
      running += spentOnDay;
    }
    const daysAfterToday = differenceInCalendarDays(day, today);
    return {
      date,
      spentOnDay: isActual ? spentOnDay : 0,
      actual: isActual ? roundMoney(running) : null,
      projected: isProjected ? roundMoney(actualSpend + dailyPace * Math.max(daysAfterToday, 0)) : null,
    };
  });

  const lastPoint = points[points.length - 1];
  const projectedTotal = lastPoint ? lastPoint.projected ?? lastPoint.actual ?? actualSpend : actualSpend;

  return {
    windowStart,
    windowEnd,
    today,
    daysElapsed,
    daysRemaining,
    actualSpend,
    dailyPace,
    projectedTotal,
    points,
  };
}
