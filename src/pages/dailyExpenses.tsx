import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { updatePageState } from "../redux/slicePage";
import { RootState } from "../redux/store";

export default function DailyExpenses() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { day } = useParams();
  const expenses = useSelector((state: RootState) => state.expenses);

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [{ icon: "Info", link: "../about" }],
        title: day ? `expenses ${day}` : "daily expenses",
      })
    );
  }, [dispatch, day]);

  const negativeEntries = expenses.entries.filter((entry) => entry.amount < 0);
  const selectedDayEntries = day
    ? negativeEntries.filter((entry) => entry.date === day)
    : negativeEntries;

  const byDay = negativeEntries.reduce<Record<string, number>>((acc, entry) => {
    const key = entry.date || "Unknown";
    acc[key] = (acc[key] || 0) + Math.abs(entry.amount);
    return acc;
  }, {});

  const sortedByDay = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));

  if (!day) {
    return (
      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Typography variant="h6">Daily expenses</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
              {negativeEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0).toFixed(2)}
            </Typography>
            <Typography color="text.secondary">Total negative expense</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="600">Day by day</Typography>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={1.2}>
              {sortedByDay.map(([dayValue, total]) => (
                <Link key={dayValue} to={`../daily/${dayValue}`} className="flex items-center justify-between rounded border border-gray-200 px-2 py-2">
                  <Typography>{dayValue}</Typography>
                  <Typography fontWeight={600}>{total.toFixed(2)}</Typography>
                </Link>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  if (!selectedDayEntries.length) {
    navigate("../daily");
    return null;
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6">Expenses for {day}</Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
            {selectedDayEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0).toFixed(2)}
          </Typography>
          <Typography color="text.secondary">Total negative expense</Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="600">Transactions</Typography>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1.2}>
            {selectedDayEntries.map((entry, index) => (
              <div key={`${entry.date}-${index}`} className="rounded border border-gray-200 px-2 py-2">
                <div className="flex items-center justify-between gap-2">
                  <Typography fontWeight={600}>{entry.category || "Uncategorized"}</Typography>
                  <Typography fontWeight={600}>{Math.abs(entry.amount).toFixed(2)}</Typography>
                </div>
                <Typography variant="body2" color="text.secondary">
                  {entry.source} · {entry.sheet}
                </Typography>
              </div>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
