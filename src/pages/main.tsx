import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { UploadFile } from "@mui/icons-material";
import { read, utils } from "xlsx";
import { updatePageState } from "../redux/slicePage";
import {
  clearExpenses,
  setExpensesError,
  setExpensesLoading,
  setParsedExpenses,
} from "../redux/sliceExpenses";
import { parseExpenseRows } from "../utils/expenses";
import { RootState } from "../redux/store";

export default function Main() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const expenses = useSelector((state: RootState) => state.expenses);
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [
          { icon: "Info", link: "./about" },
          { icon: "ImportExport", link: "./importexport" },
        ],
        title: "",
      })
    );
  }, [dispatch]);

  const handleFiles = async (files: File[]) => {
    setError("");
    dispatch(setExpensesLoading(true));
    dispatch(clearExpenses());

    try {
      const allEntries = [] as Array<ReturnType<typeof parseExpenseRows>[number]>;
      for (const file of files) {
        const data = await file.arrayBuffer();
        const workbook = read(data);
        const sheets = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name];
          const matrix = utils.sheet_to_json(sheet, {
            header: 1,
            raw: false,
            defval: "",
          }) as string[][];
          return { name, rows: matrix };
        });

        const entries = sheets.flatMap(({ name, rows }) =>
          parseExpenseRows(rows, file.name, name)
        );
        allEntries.push(...entries);
      }

      dispatch(setParsedExpenses({ fileName: files.map((file) => file.name).join(", "), entries: allEntries }));
      if (!allEntries.length) {
        setError("No expense rows could be detected in the uploaded files.");
      }
    } catch {
      dispatch(
        setExpensesError(
          "Could not read these files. Please try valid xlsx, xls or csv files."
        )
      );
      setError("Could not read these files. Please try valid xlsx, xls or csv files.");
    }
  };

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6">Upload expense files</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Upload CSV, XLS, or XLSX files. The app will scan each sheet and row to find a date, amount, and category.
          </Typography>
          <Button
            component="label"
            variant="outlined"
            sx={{ mt: 2 }}
            fullWidth
            startIcon={<UploadFile />}
          >
            {expenses.fileName || "Upload expenses"}
            <input
              type="file"
              hidden
              accept=".xlsx,.xls,.csv"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) {
                  return;
                }
                handleFiles(files).finally(() => {
                  e.target.value = "";
                });
              }}
            />
          </Button>
          {error ? (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          ) : null}
          {expenses.entries.length ? (
            <Typography color="primary" sx={{ mt: 1 }}>
              Parsed {expenses.entries.length} expenses from {expenses.fileName}.
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      <Button variant="contained" fullWidth onClick={() => navigate("./dashboard")} disabled={!expenses.entries.length}>
        View dashboard
      </Button>
    </Stack>
  );
}