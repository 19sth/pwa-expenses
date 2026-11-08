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

  it("starts at the earliest imported date and ends one calendar month later", () => {
    const projection = buildSpendingProjection(
      [
        entry("2026-11-01", -1500),
        entry("2026-10-20", -300),
        entry("2026-11-02", -120.5),
        entry("2026-11-08", -600),
        entry("2026-11-08", 5000),
        entry("2026-11-21", -999),
      ],
      today
    );

    expect(format(projection.windowStart, "yyyy-MM-dd")).toBe("2026-10-20");
    expect(format(projection.windowEnd, "yyyy-MM-dd")).toBe("2026-11-20");
    expect(projection.daysElapsed).toBe(20);
    expect(projection.daysRemaining).toBe(12);
    expect(projection.actualSpend).toBe(2520.5);
    expect(projection.dailyPace).toBe(126.025);
    expect(projection.projectedTotal).toBe(4032.8);
    expect(projection.points[0]).toMatchObject({ date: "2026-10-20", actual: 300, projected: null });
    expect(projection.points[projection.points.length - 1]).toMatchObject({
      date: "2026-11-20",
      actual: null,
      projected: 4032.8,
    });
    const todayPoint = projection.points.find((point) => point.date === "2026-11-08");
    expect(todayPoint).toMatchObject({ actual: 2520.5, projected: 2520.5 });
  });

  it("uses an earlier incoming transaction as the document start", () => {
    const projection = buildSpendingProjection(
      [entry("2026-10-20", 5000), entry("2026-10-25", -100)],
      today
    );

    expect(format(projection.windowStart, "yyyy-MM-dd")).toBe("2026-10-20");
    expect(format(projection.windowEnd, "yyyy-MM-dd")).toBe("2026-11-20");
    expect(projection.daysElapsed).toBe(20);
    expect(projection.actualSpend).toBe(100);
    expect(projection.dailyPace).toBe(5);
    expect(projection.projectedTotal).toBe(160);
  });

  it("keeps the pace flat when the first date is still ahead", () => {
    const projection = buildSpendingProjection([entry("2026-12-01", -80)], today);

    expect(format(projection.windowStart, "yyyy-MM-dd")).toBe("2026-12-01");
    expect(format(projection.windowEnd, "yyyy-MM-dd")).toBe("2027-01-01");
    expect(projection.daysElapsed).toBe(0);
    expect(projection.actualSpend).toBe(0);
    expect(projection.projectedTotal).toBe(0);
  });

  it("does not project past the window when today is already beyond it", () => {
    const projection = buildSpendingProjection(
      [entry("2026-08-21", -400), entry("2026-09-21", -50), entry("2026-10-01", -25)],
      today
    );

    expect(format(projection.windowStart, "yyyy-MM-dd")).toBe("2026-08-21");
    expect(format(projection.windowEnd, "yyyy-MM-dd")).toBe("2026-09-21");
    expect(projection.daysRemaining).toBe(0);
    expect(projection.actualSpend).toBe(450);
    expect(projection.projectedTotal).toBe(450);
    expect(projection.points.every((point) => point.projected == null)).toBe(true);
    expect(projection.points[projection.points.length - 1]).toMatchObject({ date: "2026-09-21", actual: 450 });
  });

  it("clamps a 31st to the last real day when the next month is shorter", () => {
    const january = buildSpendingProjection([entry("2026-01-31", -31)], new Date(2026, 0, 31));
    expect(format(january.windowStart, "yyyy-MM-dd")).toBe("2026-01-31");
    expect(format(january.windowEnd, "yyyy-MM-dd")).toBe("2026-02-28");
    expect(january.daysElapsed).toBe(1);
    expect(january.daysRemaining).toBe(28);
    expect(january.projectedTotal).toBe(899);

    const leap = buildSpendingProjection([entry("2024-01-31", -10)], new Date(2024, 0, 31));
    expect(format(leap.windowEnd, "yyyy-MM-dd")).toBe("2024-02-29");
  });
});
