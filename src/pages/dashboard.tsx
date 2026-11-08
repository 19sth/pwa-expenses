import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import {
  ChartContainer,
  ChartsLegend,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  BarPlot,
} from "@mui/x-charts";
import { format, parseISO } from "date-fns";
import { updatePageState } from "../redux/slicePage";
import { RootState } from "../redux/store";
import { buildSpendingProjection } from "../utils/spendingProjection";

export default function Dashboard() {
  const dispatch = useDispatch();
  const expenses = useSelector((state: RootState) => state.expenses);

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [
          { icon: "List", link: "./daily" },
          { icon: "Category", link: "./categories" },
          { icon: "Process", link: "./processes" },
          { icon: "Info", link: "./about" },
        ],
        title: "dashboard",
      })
    );
  }, [dispatch]);

  const negativeEntries = expenses.entries.filter((entry) => entry.amount < 0);

  const byDay = negativeEntries.reduce<Record<string, number>>((acc, entry) => {
    const key = entry.date || "Unknown";
    acc[key] = (acc[key] || 0) + Math.abs(entry.amount);
    return acc;
  }, {});

  const byCategory = negativeEntries.reduce<Record<string, { total: number; count: number }>>((acc, entry) => {
    const key = entry.category || "Uncategorized";
    const current = acc[key] ?? { total: 0, count: 0 };
    current.total += Math.abs(entry.amount);
    current.count += 1;
    acc[key] = current;
    return acc;
  }, {});

  const byProcess = negativeEntries.reduce<Record<string, { total: number; count: number }>>((acc, entry) => {
    const key = entry.process || "Unspecified";
    const current = acc[key] ?? { total: 0, count: 0 };
    current.total += Math.abs(entry.amount);
    current.count += 1;
    acc[key] = current;
    return acc;
  }, {});

  const sortedByDay = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));
  const sortedByCategory = Object.entries(byCategory)
    .map(([category, values]) => ({ category, total: values.total, count: values.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const sortedByProcess = Object.entries(byProcess)
    .map(([process, values]) => ({ process, total: values.total, count: values.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const dailyLabels = sortedByDay.map(([day]) => day);
  const dailyValues = sortedByDay.map(([, total]) => Number(total.toFixed(2)));
  const totalNegative = negativeEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  const projection = buildSpendingProjection(negativeEntries);
  const trendDates = projection.points.map((point) => point.date);
  const labelEvery = Math.max(1, Math.ceil(trendDates.length / 6));

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
          <Typography variant="h6">Negative spending trend</Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
            {projection.projectedTotal.toFixed(2)}
          </Typography>
          <Typography color="text.secondary">
            Projected {format(projection.monthStart, "MMM d")} to {format(projection.nextMonthEnd, "MMM d, yyyy")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {projection.actualSpend.toFixed(2)} spent so far · {projection.dailyPace.toFixed(2)} per day
          </Typography>
          <Divider sx={{ my: 1 }} />
          <ChartContainer
            series={[
              {
                type: "line",
                id: "actual",
                label: "Spending",
                data: projection.points.map((point) => point.actual),
                curve: "linear",
                connectNulls: false,
                showMark: ({ index }) => projection.points[index]?.spentOnDay > 0,
              },
              {
                type: "line",
                id: "projection",
                label: "Projection",
                data: projection.points.map((point) => point.projected),
                curve: "linear",
                connectNulls: false,
                showMark: ({ index }) => index === projection.points.length - 1,
              },
            ]}
            xAxis={[
              {
                scaleType: "point",
                data: trendDates,
                valueFormatter: (value) => format(parseISO(String(value)), "MMM d"),
                tickLabelInterval: (_value, index) => {
                  const last = trendDates.length - 1;
                  if (index === 0 || index === last) {
                    return true;
                  }
                  if (last - index < Math.ceil(labelEvery / 2)) {
                    return false;
                  }
                  return index % labelEvery === 0;
                },
              },
            ]}
            yAxis={[{ valueFormatter: (value) => `${(value / 1000).toFixed(0)}K` }]}
            sx={{
              "& .MuiLineElement-series-projection": {
                strokeDasharray: "6 4",
              },
            }}
            width={Math.min(560, window.innerWidth - 40)}
            height={240}
          >
            <LinePlot />
            <ChartsXAxis />
            <ChartsYAxis />
            <ChartsLegend />
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="600">Daily negative totals</Typography>
          <Divider sx={{ my: 1 }} />
          <ChartContainer
            series={[{ type: "bar", label: "Daily", data: dailyValues }]}
            xAxis={[{ scaleType: "band", data: dailyLabels.map((value) => format(new Date(value), "MMM d")) }]}
            yAxis={[{ valueFormatter: (value) => `${(value / 1000).toFixed(0)}K` }]}
            width={Math.min(560, window.innerWidth - 40)}
            height={220}
          >
            <BarPlot />
            <ChartsXAxis />
            <ChartsYAxis />
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="600">Negative by category</Typography>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1.5}>
            {sortedByCategory.map((item) => {
              const percentage = totalNegative > 0 ? (item.total / totalNegative) * 100 : 0;
              return (
                <div key={item.category} className="rounded border border-gray-200 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <Typography fontWeight={600}>{item.category}</Typography>
                    <Typography color="text.secondary">{percentage.toFixed(1)}%</Typography>
                  </div>
                  <Typography variant="body2" color="text.secondary">
                    {item.count} expenses · {item.total.toFixed(2)} total
                  </Typography>
                </div>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="600">Negative by process</Typography>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1.5}>
            {sortedByProcess.map((item) => {
              const percentage = totalNegative > 0 ? (item.total / totalNegative) * 100 : 0;
              return (
                <div key={item.process} className="rounded border border-gray-200 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <Typography fontWeight={600}>{item.process}</Typography>
                    <Typography color="text.secondary">{percentage.toFixed(1)}%</Typography>
                  </div>
                  <Typography variant="body2" color="text.secondary">
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
