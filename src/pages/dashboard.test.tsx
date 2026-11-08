import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { format, startOfMonth } from "date-fns";
import { Provider } from "react-redux";
import expensesReducer from "../redux/sliceExpenses";
import pageReducer from "../redux/slicePage";
import type { ExpenseEntry } from "../utils/expenses";
import { buildSpendingProjection } from "../utils/spendingProjection";
import Dashboard from "./dashboard";

jest.mock("@mui/x-charts", () => ({
  ChartContainer: ({
    series,
    xAxis,
    sx,
    children,
  }: {
    series?: Array<{ id?: string; label?: string; data?: Array<number | null> }>;
    xAxis?: Array<{ data?: string[] }>;
    sx?: { [key: string]: { strokeDasharray?: string } };
    children?: ReactNode;
  }) => (
    <div data-testid="chart">
      {series?.map((item) => (
        <div key={item.id || item.label} data-series={item.id || ""} data-label={item.label}>
          {(item.data || []).map((value) => (value == null ? "null" : String(value))).join(",")}
        </div>
      ))}
      <div data-testid="xaxis">{(xAxis?.[0]?.data || []).join(",")}</div>
      <div data-testid="chart-style">{JSON.stringify(sx ?? {})}</div>
      {children}
    </div>
  ),
  ChartsLegend: () => null,
  ChartsXAxis: () => null,
  ChartsYAxis: () => null,
  LinePlot: () => null,
  BarPlot: () => null,
}));

const entry = (date: string, amount: number): ExpenseEntry => ({
  date,
  amount,
  category: "Food",
  process: "Market",
  source: "statement.csv",
  sheet: "Sheet1",
});

describe("Dashboard spending projection", () => {
  it("shows the projected total and a dashed forecast through the end of next month", () => {
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const entries = [entry("2020-01-02", -9999), entry(monthStart, -200), entry(monthStart, 80)];
    const projection = buildSpendingProjection(entries.filter((item) => item.amount < 0));

    const store = configureStore({
      reducer: { page: pageReducer, expenses: expensesReducer },
      preloadedState: {
        expenses: { fileName: "statement.csv", entries, isLoading: false, error: "" },
        page: { navItems: [], title: "" },
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );

    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(projection.projectedTotal.toFixed(2));
    expect(screen.getByText(/Projected /)).toHaveTextContent(format(projection.monthStart, "MMM d"));
    expect(screen.getByText(/Projected /)).toHaveTextContent(format(projection.nextMonthEnd, "MMM d, yyyy"));
    expect(screen.getByText(`${projection.actualSpend.toFixed(2)} spent so far · ${projection.dailyPace.toFixed(2)} per day`)).toBeInTheDocument();
    const spendingSeries = container.querySelector("[data-series='actual']");
    const projectionSeries = container.querySelector("[data-series='projection']");
    expect(spendingSeries).toHaveAttribute("data-label", "Spending");
    expect(projectionSeries).toHaveAttribute("data-label", "Projection");

    const actualValues = spendingSeries?.textContent?.split(",") ?? [];
    const projectedValues = projectionSeries?.textContent?.split(",") ?? [];
    const dates = container.querySelector("[data-testid='xaxis']")?.textContent?.split(",") ?? [];

    const todayIndex = dates.indexOf(format(projection.today, "yyyy-MM-dd"));

    expect(dates[0]).toBe(format(projection.monthStart, "yyyy-MM-dd"));
    expect(dates[dates.length - 1]).toBe(format(projection.nextMonthEnd, "yyyy-MM-dd"));
    expect(todayIndex).toBeGreaterThanOrEqual(0);
    expect(actualValues[todayIndex]).toBe(String(projection.actualSpend));
    expect(actualValues[actualValues.length - 1]).toBe("null");
    expect(projectedValues[todayIndex]).toBe(String(projection.actualSpend));
    expect(projectedValues[projectedValues.length - 1]).toBe(String(projection.projectedTotal));
    expect(Number(projectedValues[projectedValues.length - 1])).toBeGreaterThan(projection.actualSpend);
    expect(container.querySelector("[data-testid='chart-style']")?.textContent).toContain("strokeDasharray");
    expect(container.querySelector("[data-testid='chart-style']")?.textContent).toContain("6 4");
  });
});
