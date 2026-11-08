import { format } from "date-fns";
import type { ExpenseEntry } from "./expenses";
import { buildSpendingProjection } from "./spendingProjection";

const entry = (date: string, amount: number, process = "Market"): ExpenseEntry => ({
  date,
  amount,
  category: "Food",
  process,
  source: "statement.csv",
  sheet: "Sheet1",
});

describe("buildSpendingProjection", () => {
  const today = new Date(2026, 10, 8, 15, 30, 0);

  it("projects this month's pace from the start of the month through the end of next month", () => {
    const projection = buildSpendingProjection(
      [
        entry("2026-10-15", -1000),
        entry("2026-11-01", -80),
        entry("2026-11-08", -80),
        entry("2026-11-20", -500),
        entry("2026-11-03", 250),
      ],
      today
    );

    expect(format(projection.monthStart, "yyyy-MM-dd")).toBe("2026-11-01");
    expect(format(projection.nextMonthEnd, "yyyy-MM-dd")).toBe("2026-12-31");
    expect(projection.daysElapsed).toBe(8);
    expect(projection.daysRemaining).toBe(53);
    expect(projection.actualSpend).toBe(160);
    expect(projection.dailyPace).toBe(20);
    expect(projection.projectedTotal).toBe(1220);
    expect(projection.points).toHaveLength(61);
    expect(projection.points[0]).toMatchObject({ date: "2026-11-01", actual: 80, projected: null, spentOnDay: 80 });
    expect(projection.points[6]).toMatchObject({ date: "2026-11-07", actual: 80, projected: null, spentOnDay: 0 });
    expect(projection.points[7]).toMatchObject({ date: "2026-11-08", actual: 160, projected: 160, spentOnDay: 80 });
    expect(projection.points[8]).toMatchObject({ date: "2026-11-09", actual: null, projected: 180 });
    expect(projection.points[projection.points.length - 1]).toMatchObject({
      date: "2026-12-31",
      actual: null,
      projected: 1220,
    });
  });

  it("uses an uneven pace and still lands on the end of next month", () => {
    const projection = buildSpendingProjection([entry("2026-11-03", -100)], today);

    expect(projection.actualSpend).toBe(100);
    expect(projection.dailyPace).toBe(12.5);
    expect(projection.projectedTotal).toBe(762.5);
    expect(projection.points[0]).toMatchObject({ date: "2026-11-01", actual: 0, spentOnDay: 0 });
    expect(projection.points[2]).toMatchObject({ date: "2026-11-03", actual: 100, spentOnDay: 100 });
    expect(projection.points[7]).toMatchObject({ date: "2026-11-08", actual: 100, projected: 100 });
  });

  it("projects zero when nothing has been spent this month", () => {
    const projection = buildSpendingProjection([entry("2026-10-02", -400)], today);

    expect(projection.actualSpend).toBe(0);
    expect(projection.dailyPace).toBe(0);
    expect(projection.projectedTotal).toBe(0);
    expect(projection.points.every((point) => point.projected == null || point.projected === 0)).toBe(true);
    expect(projection.points.every((point) => point.actual == null || point.actual === 0)).toBe(true);
  });

  it("counts the first day of the month as one elapsed day", () => {
    const first = new Date(2026, 10, 1, 9, 0, 0);
    const projection = buildSpendingProjection([entry("2026-11-01", -50)], first);

    expect(projection.daysElapsed).toBe(1);
    expect(format(projection.nextMonthEnd, "yyyy-MM-dd")).toBe("2026-12-31");
    expect(projection.daysRemaining).toBe(60);
    expect(projection.projectedTotal).toBe(3050);
    expect(projection.points[0]).toMatchObject({ actual: 50, projected: 50 });
  });

  it("ends on the real last day of next month, including February", () => {
    const january = buildSpendingProjection([], new Date(2026, 0, 31));
    expect(format(january.nextMonthEnd, "yyyy-MM-dd")).toBe("2026-02-28");

    const leap = buildSpendingProjection([], new Date(2024, 0, 15));
    expect(format(leap.nextMonthEnd, "yyyy-MM-dd")).toBe("2024-02-29");
  });
});
