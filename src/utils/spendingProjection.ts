import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";
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
  monthStart: Date;
  nextMonthEnd: Date;
  today: Date;
  daysElapsed: number;
  daysRemaining: number;
  actualSpend: number;
  dailyPace: number;
  projectedTotal: number;
  points: SpendingProjectionPoint[];
}

/**
 * Project how much will be spent from the start of the current month through the end of next month.
 * Pace is spending recorded from the start of this month through today, divided by days elapsed (today included).
 * That daily pace is extended through the remaining days until the last day of next month.
 */
export function buildSpendingProjection(entries: ExpenseEntry[], now: Date = new Date()): SpendingProjection {
  const today = startOfDay(now);
  const monthStart = startOfMonth(today);
  const nextMonthEnd = startOfDay(endOfMonth(addMonths(today, 1)));
  const todayKey = format(today, "yyyy-MM-dd");
  const monthStartKey = format(monthStart, "yyyy-MM-dd");

  const spentByDay = new Map<string, number>();
  entries.forEach((entry) => {
    if (entry.amount >= 0 || !ISO_DATE.test(entry.date)) {
      return;
    }
    if (entry.date < monthStartKey || entry.date > todayKey) {
      return;
    }
    spentByDay.set(entry.date, (spentByDay.get(entry.date) ?? 0) + Math.abs(entry.amount));
  });

  let exactSpend = 0;
  spentByDay.forEach((value) => {
    exactSpend += value;
  });
  const actualSpend = roundMoney(exactSpend);
  const daysElapsed = differenceInCalendarDays(today, monthStart) + 1;
  const daysRemaining = differenceInCalendarDays(nextMonthEnd, today);
  const dailyPace = daysElapsed > 0 ? actualSpend / daysElapsed : 0;

  let running = 0;
  const points = eachDayOfInterval({ start: monthStart, end: nextMonthEnd }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    const spentOnDay = spentByDay.get(date) ?? 0;
    const isActual = date <= todayKey;
    const isProjected = date >= todayKey;
    if (isActual) {
      running += spentOnDay;
    }
    const daysAfterToday = differenceInCalendarDays(day, today);
    return {
      date,
      spentOnDay: isActual ? spentOnDay : 0,
      actual: isActual ? roundMoney(running) : null,
      projected: isProjected ? roundMoney(actualSpend + dailyPace * daysAfterToday) : null,
    };
  });

  const projectedTotal = points.length ? points[points.length - 1].projected ?? actualSpend : actualSpend;

  return {
    monthStart,
    nextMonthEnd,
    today,
    daysElapsed,
    daysRemaining,
    actualSpend,
    dailyPace,
    projectedTotal,
    points,
  };
}
