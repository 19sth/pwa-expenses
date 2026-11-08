import type { ExpenseEntry } from "./expenses";

export interface ExpenseRangeFilter {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export function parseAmountBound(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Keep entries inside the given date and amount bounds.
 * Empty bounds are ignored. Amounts are matched on size (absolute value), which is how expenses are shown.
 * A date bound and an amount bound together both have to match.
 */
export function filterExpenseEntries(entries: ExpenseEntry[], filter: ExpenseRangeFilter): ExpenseEntry[] {
  const dateFrom = filter.dateFrom?.trim() ?? "";
  const dateTo = filter.dateTo?.trim() ?? "";
  const { amountMin, amountMax } = filter;

  return entries.filter((entry) => {
    if (dateFrom && entry.date < dateFrom) {
      return false;
    }
    if (dateTo && entry.date > dateTo) {
      return false;
    }
    const amount = Math.abs(entry.amount);
    if (amountMin != null && Number.isFinite(amountMin) && amount < amountMin) {
      return false;
    }
    if (amountMax != null && Number.isFinite(amountMax) && amount > amountMax) {
      return false;
    }
    return true;
  });
}
