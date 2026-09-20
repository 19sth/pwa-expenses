import { format, isValid, parseISO, parse } from "date-fns";

export interface ExpenseEntry {
  date: string;
  amount: number;
  category: string;
  process: string;
  source: string;
  sheet: string;
}

const DATE_FORMATS = [
  "yyyy-MM-dd",
  "yyyy/MM/dd",
  "dd/MM/yyyy",
  "MM/dd/yyyy",
  "dd-MM-yyyy",
  "MM-dd-yyyy",
  "P",
  "PP",
];

const toDateValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsedIso = parseISO(trimmed);
  if (isValid(parsedIso)) {
    return parsedIso;
  }

  for (const fmt of DATE_FORMATS) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }

  return null;
};

const toAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9,.-]/g, "");
  if (!cleaned) {
    return 0;
  }

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  const normalized = hasComma && hasDot
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : hasComma
    ? cleaned.replace(/,/g, ".")
    : cleaned;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCategory = (value: string) => {
  const trimmed = value.trim();
  return trimmed || "Uncategorized";
};

const normalizeProcess = (value: string) => {
  const trimmed = value.trim();
  return trimmed || "Unspecified";
};

export const parseExpenseRows = (
  rows: string[][],
  source: string,
  sheet: string
): ExpenseEntry[] => {
  if (!rows.length) {
    return [];
  }

  const allRows = rows.filter((row) => row.some((cell) => Boolean(cell?.toString().trim())));
  if (!allRows.length) {
    return [];
  }

  const headerRow = allRows.find((row) =>
    row.some((cell) => /date|amount|category|type|description|merchant|total|value|cost|işlem|islem|açıklama|tutar|kategori|sektör/i.test(String(cell)))
  );
  const dataRows = headerRow ? allRows.filter((row) => row !== headerRow) : allRows;

  const headers = headerRow?.map((header) => String(header).toLowerCase().trim()) ?? [];

  const dateIndex = headers.findIndex((header) =>
    ["date", "spent on", "transaction date", "posting date", "tarih"].includes(header)
  );
  const amountIndex = headers.findIndex((header) =>
    ["amount", "price", "total", "value", "cost", "tutar", "miktar"].includes(header)
  );
  const matchedProcessIndex = headers.findIndex((header) =>
    ["process", "işlem", "islem", "açıklama", "aciklama", "description", "merchant", "details"].includes(header)
  );
  const matchedCategoryIndex = headers.findIndex((header) =>
    ["category", "type", "kategori", "tür", "tur", "sektör", "sektor"].includes(header)
  );

  // 2. sütun (index 1) işlem, 3. sütun (index 2) kategori
  const processIndex =
    matchedProcessIndex >= 0
      ? matchedProcessIndex
      : (amountIndex !== 1 && dateIndex !== 1) ? 1 : -1;

  const categoryIndex =
    matchedCategoryIndex >= 0
      ? matchedCategoryIndex
      : (amountIndex !== 2 && dateIndex !== 2) ? 2 : -1;

  const inferredRows = dataRows.map((row) => {
    const rowCells = row.map((cell) => String(cell).trim());
    const dateValue =
      dateIndex >= 0
        ? rowCells[dateIndex] ?? ""
        : rowCells.find((cell) => toDateValue(cell) !== null) ?? "";
    const amountValue =
      amountIndex >= 0
        ? rowCells[amountIndex] ?? ""
        : rowCells
            .slice()
            .reverse()
            .find((cell) => {
              const value = cell.trim();
              if (!value || toDateValue(value) !== null) {
                return false;
              }
              const parsed = toAmount(value);
              return parsed !== 0 && Math.abs(parsed) > 0.01;
            }) ?? "";
    const processValue =
      processIndex >= 0
        ? rowCells[processIndex] ?? ""
        : "";
    const categoryValue =
      categoryIndex >= 0
        ? rowCells[categoryIndex] ?? ""
        : "";

    const parsedDate = toDateValue(String(dateValue));
    const amount = toAmount(String(amountValue));
    const category = normalizeCategory(String(categoryValue));
    const process = normalizeProcess(String(processValue));

    return {
      date: parsedDate ? format(parsedDate, "yyyy-MM-dd") : "",
      amount,
      category,
      process,
      source,
      sheet,
    };
  });

  return inferredRows.filter((entry) => entry.amount !== 0 && entry.date);
};
