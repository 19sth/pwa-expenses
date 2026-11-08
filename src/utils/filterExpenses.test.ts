import type { ExpenseEntry } from "./expenses";
import { filterExpenseEntries, parseAmountBound } from "./filterExpenses";

const entry = (date: string, amount: number, process = "Market"): ExpenseEntry => ({
  date,
  amount,
  category: "Food",
  process,
  source: "statement.csv",
  sheet: "Sheet1",
});

const rows = [
  entry("2026-10-15", -50, "Bus"),
  entry("2026-11-01", -100, "Market"),
  entry("2026-11-02", -400, "Market"),
  entry("2026-11-03", -20, "Cafe"),
];

describe("parseAmountBound", () => {
  it("treats empty and invalid text as an unset bound", () => {
    expect(parseAmountBound("")).toBeUndefined();
    expect(parseAmountBound("   ")).toBeUndefined();
    expect(parseAmountBound("-")).toBeUndefined();
    expect(parseAmountBound("abc")).toBeUndefined();
  });

  it("parses zero and decimals", () => {
    expect(parseAmountBound("0")).toBe(0);
    expect(parseAmountBound(" 120.50 ")).toBe(120.5);
  });
});

describe("filterExpenseEntries", () => {
  it("returns every entry when no bounds are set", () => {
    expect(filterExpenseEntries(rows, {})).toEqual(rows);
  });

  it("keeps dates on and after a start date", () => {
    expect(filterExpenseEntries(rows, { dateFrom: "2026-11-02" }).map((item) => item.date)).toEqual([
      "2026-11-02",
      "2026-11-03",
    ]);
  });

  it("keeps dates on and before an end date", () => {
    expect(filterExpenseEntries(rows, { dateTo: "2026-11-01" }).map((item) => item.date)).toEqual([
      "2026-10-15",
      "2026-11-01",
    ]);
  });

  it("keeps an inclusive date range", () => {
    expect(filterExpenseEntries(rows, { dateFrom: "2026-11-01", dateTo: "2026-11-02" }).map((item) => item.amount)).toEqual([
      -100,
      -400,
    ]);
  });

  it("keeps amounts at or above a minimum", () => {
    expect(filterExpenseEntries(rows, { amountMin: 100 }).map((item) => item.amount)).toEqual([-100, -400]);
  });

  it("keeps amounts at or below a maximum", () => {
    expect(filterExpenseEntries(rows, { amountMax: 50 }).map((item) => item.amount)).toEqual([-50, -20]);
  });

  it("applies a date range and an amount range together", () => {
    const filtered = filterExpenseEntries(rows, {
      dateFrom: "2026-11-01",
      dateTo: "2026-11-03",
      amountMin: 50,
      amountMax: 100,
    });

    expect(filtered).toEqual([rows[1]]);
  });

  it("applies a partial date bound and a partial amount bound together", () => {
    const filtered = filterExpenseEntries(rows, {
      dateFrom: "2026-11-02",
      amountMax: 20,
    });

    expect(filtered).toEqual([rows[3]]);
  });

  it("matches amount size even though expenses are stored as negative values", () => {
    expect(filterExpenseEntries(rows, { amountMin: 400, amountMax: 400 })).toEqual([rows[2]]);
  });

  it("returns nothing when the bounds cannot overlap", () => {
    expect(filterExpenseEntries(rows, { amountMin: 500, amountMax: 10 })).toEqual([]);
    expect(filterExpenseEntries(rows, { dateFrom: "2026-12-01", dateTo: "2026-10-01" })).toEqual([]);
  });
});
