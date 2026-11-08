import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, CardContent, Checkbox, Divider, Stack, TextField, Typography } from "@mui/material";
import { updatePageState } from "../redux/slicePage";
import { RootState } from "../redux/store";
import { filterExpenseEntries, parseAmountBound } from "../utils/filterExpenses";

export default function Processes() {
  const dispatch = useDispatch();
  const expenses = useSelector((state: RootState) => state.expenses);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [
          { icon: "List", link: "./daily" },
          { icon: "Category", link: "./categories" },
          { icon: "Process", link: "./processes" },
          { icon: "Info", link: "./about" },
        ],
        title: "processes",
      })
    );
  }, [dispatch]);

  const negativeEntries = expenses.entries.filter((entry) => entry.amount < 0);
  const filtersActive = Boolean(dateFrom || dateTo || amountMin.trim() || amountMax.trim());
  const filteredEntries = filterExpenseEntries(negativeEntries, {
    dateFrom,
    dateTo,
    amountMin: parseAmountBound(amountMin),
    amountMax: parseAmountBound(amountMax),
  });

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
  };

  const byProcess = filteredEntries.reduce<Record<string, { total: number; count: number }>>((acc, entry) => {
    const key = entry.process || "Unspecified";
    const current = acc[key] ?? { total: 0, count: 0 };
    current.total += Math.abs(entry.amount);
    current.count += 1;
    acc[key] = current;
    return acc;
  }, {});

  const sortedByProcess = Object.entries(byProcess)
    .map(([process, values]) => ({ process, total: values.total, count: values.count }))
    .sort((a, b) => b.total - a.total);

  const totalNegative = filteredEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  const visibleSelected = sortedByProcess.filter((item) => selectedProcesses.includes(item.process));
  const selectedTotal = visibleSelected.reduce((sum, item) => sum + item.total, 0);
  const summaryTotal = visibleSelected.length > 0 ? selectedTotal : totalNegative;
  const summaryLabel =
    visibleSelected.length > 0 ? "Selected total" : filtersActive ? "Filtered total" : "Total negative expense";

  const toggleProcess = (process: string) => {
    setSelectedProcesses((current) =>
      current.includes(process) ? current.filter((item) => item !== process) : [...current, process]
    );
  };

  if (!negativeEntries.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">No negative expenses found</Typography>
          <Typography color="text.secondary">
            Only negative transactions are shown here because positive values are treated as incoming or bill payments.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6">All processes</Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
            {summaryTotal.toFixed(2)}
          </Typography>
          <Typography color="text.secondary">{summaryLabel}</Typography>
          <Divider sx={{ my: 1.5 }} />
          <Stack spacing={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                label="From date"
                type="date"
                size="small"
                fullWidth
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="To date"
                type="date"
                size="small"
                fullWidth
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                label="Min amount"
                type="number"
                size="small"
                fullWidth
                value={amountMin}
                onChange={(event) => setAmountMin(event.target.value)}
                inputProps={{ step: "0.01", inputMode: "decimal" }}
              />
              <TextField
                label="Max amount"
                type="number"
                size="small"
                fullWidth
                value={amountMax}
                onChange={(event) => setAmountMax(event.target.value)}
                inputProps={{ step: "0.01", inputMode: "decimal" }}
              />
            </Stack>
            <Button variant="outlined" onClick={clearFilters} disabled={!filtersActive}>
              Clear filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="600">Process breakdown</Typography>
          <Divider sx={{ my: 1 }} />
          {sortedByProcess.length === 0 ? (
            <Typography color="text.secondary">No processes match these filters.</Typography>
          ) : null}
          <Stack spacing={1.5}>
            {sortedByProcess.map((item) => {
              const percentage = totalNegative > 0 ? (item.total / totalNegative) * 100 : 0;
              const checked = selectedProcesses.includes(item.process);
              return (
                <div key={item.process} className="rounded border border-gray-200 p-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={checked} onChange={() => toggleProcess(item.process)} size="small" />
                      <Typography fontWeight={600}>{item.process}</Typography>
                    </div>
                    <Typography color="text.secondary">{percentage.toFixed(1)}%</Typography>
                  </div>
                  <Typography variant="body2" color="text.secondary" style={{ marginLeft: "2.9rem" }}>
                    {item.count} expenses · {item.total.toFixed(2)} total
                  </Typography>
                </div>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
