import { fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import expensesReducer from "../redux/sliceExpenses";
import pageReducer from "../redux/slicePage";
import type { ExpenseEntry } from "../utils/expenses";
import Processes from "./processes";

const entry = (date: string, amount: number, process: string): ExpenseEntry => ({
  date,
  amount,
  category: "Food",
  process,
  source: "statement.csv",
  sheet: "Sheet1",
});

const entries = [
  entry("2026-10-15", -50, "Bus"),
  entry("2026-11-01", -100, "Market"),
  entry("2026-11-02", -400, "Market"),
  entry("2026-11-03", -20, "Cafe"),
];

const renderProcesses = () => {
  const store = configureStore({
    reducer: { page: pageReducer, expenses: expensesReducer },
    preloadedState: {
      expenses: { fileName: "statement.csv", entries, isLoading: false, error: "" },
      page: { navItems: [], title: "" },
    },
  });

  return render(
    <Provider store={store}>
      <Processes />
    </Provider>
  );
};

const checkboxFor = (name: string) => {
  const row = screen.getByText(name).closest(".rounded");
  const input = row?.querySelector("input");
  if (!input) {
    throw new Error(`Missing checkbox for ${name}`);
  }
  return input;
};

describe("Processes filters", () => {
  it("filters the list by a date range and an amount range together, then clears them", () => {
    renderProcesses();

    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("570.00");
    expect(screen.getByText("Total negative expense")).toBeInTheDocument();
    expect(screen.getByText("Bus")).toBeInTheDocument();
    expect(screen.getByText("Market")).toBeInTheDocument();
    expect(screen.getByText("Cafe")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-11-01" } });
    fireEvent.change(screen.getByLabelText("To date"), { target: { value: "2026-11-02" } });

    expect(screen.queryByText("Bus")).not.toBeInTheDocument();
    expect(screen.queryByText("Cafe")).not.toBeInTheDocument();
    expect(screen.getByText("Market")).toBeInTheDocument();
    expect(screen.getByText("2 expenses · 500.00 total")).toBeInTheDocument();
    expect(screen.getByText("Filtered total")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("500.00");

    fireEvent.change(screen.getByLabelText("Min amount"), { target: { value: "200" } });
    fireEvent.change(screen.getByLabelText("Max amount"), { target: { value: "400" } });

    expect(screen.getByText("1 expenses · 400.00 total")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("400.00");

    fireEvent.click(checkboxFor("Market"));
    expect(screen.getByText("Selected total")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("400.00");

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByLabelText("From date")).toHaveValue("");
    expect(screen.getByLabelText("To date")).toHaveValue("");
    expect(screen.getByLabelText("Min amount")).toHaveValue(null);
    expect(screen.getByLabelText("Max amount")).toHaveValue(null);
    expect(screen.getByText("Bus")).toBeInTheDocument();
    expect(screen.getByText("Cafe")).toBeInTheDocument();
    expect(screen.getByText("Market")).toBeInTheDocument();
    expect(screen.getByText("Selected total")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("500.00");
  });

  it("filters by amount alone and by an open-ended date", () => {
    renderProcesses();

    fireEvent.change(screen.getByLabelText("Max amount"), { target: { value: "50" } });
    expect(screen.queryByText("Market")).not.toBeInTheDocument();
    expect(screen.getByText("Bus")).toBeInTheDocument();
    expect(screen.getByText("Cafe")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("70.00");

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-11-03" } });

    expect(screen.getByText("Cafe")).toBeInTheDocument();
    expect(screen.queryByText("Market")).not.toBeInTheDocument();
    expect(screen.queryByText("Bus")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("20.00");
  });

  it("shows an empty state when nothing matches, without hiding the filters", () => {
    renderProcesses();

    fireEvent.change(screen.getByLabelText("Min amount"), { target: { value: "1000" } });

    expect(screen.getByText("No processes match these filters.")).toBeInTheDocument();
    expect(screen.getByLabelText("Min amount")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("0.00");
  });
});
