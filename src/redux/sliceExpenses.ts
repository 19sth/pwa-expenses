import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { ExpenseEntry } from "../utils/expenses";

export interface ExpensesState {
  fileName: string;
  entries: ExpenseEntry[];
  isLoading: boolean;
  error: string;
}

const initialState: ExpensesState = {
  fileName: "",
  entries: [],
  isLoading: false,
  error: "",
};

export const expensesSlice = createSlice({
  name: "expenses",
  initialState: initialState,
  reducers: {
    setExpensesLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setExpensesError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setParsedExpenses: (
      state,
      action: PayloadAction<{ fileName: string; entries: ExpenseEntry[] }>
    ) => {
      const { fileName, entries } = action.payload;
      state.fileName = fileName;
      state.entries = entries;
      state.error = "";
      state.isLoading = false;
    },
    clearExpenses: (state) => {
      state.fileName = "";
      state.entries = [];
      state.error = "";
      state.isLoading = false;
    },
  },
});

export const {
  setExpensesLoading,
  setExpensesError,
  setParsedExpenses,
  clearExpenses,
} = expensesSlice.actions;

export default expensesSlice.reducer;
