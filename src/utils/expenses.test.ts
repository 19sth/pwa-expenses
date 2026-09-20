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
      process: "H&M HILLTOWN (3/3) İSTANBUL",
      source: "report.csv",
      sheet: "Sheet1",
    });
  });

  it("extracts 2nd column as process and 3rd column as category with Turkish headers", () => {
    const rows = [
      ["Tarih", "İşlem Açıklaması", "Kategori", "Tutar"],
      ["2024-05-10", "Starbucks Kadıköy", "Yeme / İçme", "-120,50"],
      ["2024-05-11", "Migros Market", "Market", "-450,00"],
    ];

    const result = parseExpenseRows(rows, "statement.csv", "Sheet1");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      date: "2024-05-10",
      amount: -120.5,
      process: "Starbucks Kadıköy",
      category: "Yeme / İçme",
    });
    expect(result[1]).toMatchObject({
      date: "2024-05-11",
      amount: -450,
      process: "Migros Market",
      category: "Market",
    });
  });
});
