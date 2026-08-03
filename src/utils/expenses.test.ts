import { parseExpenseRows } from "./expenses";

describe("parseExpenseRows", () => {
  it("extracts date, amount and category from a simple row set", () => {
    const rows = [
      ["Date", "Amount", "Category"],
      ["2024-01-03", "22.50", "Groceries"],
      ["2024/01/04", "5.00", "Transport"],
    ];

    const result = parseExpenseRows(rows, "report.csv", "Sheet1");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      date: "2024-01-03",
      amount: 22.5,
      category: "Groceries",
      source: "report.csv",
      sheet: "Sheet1",
    });
    expect(result[1]).toMatchObject({
      date: "2024-01-04",
      amount: 5,
      category: "Transport",
    });
  });

  it("finds rows even when the sheet begins with empty rows", () => {
    const rows = [
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["21/08/2026", "H&M HILLTOWN (3/3) İSTANBUL", "Giyim / Aksesuar", "", "-1.159,64"],
    ];

    const result = parseExpenseRows(rows, "report.csv", "Sheet1");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: "2026-08-21",
      amount: -1159.64,
      category: "Giyim / Aksesuar",
      source: "report.csv",
      sheet: "Sheet1",
    });
  });
});
