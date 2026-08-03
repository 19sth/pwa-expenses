import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import {
  ChartContainer,
  ChartsLegend,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  BarPlot,
} from "@mui/x-charts";
import { format } from "date-fns";
import { updatePageState } from "../redux/slicePage";
import { RootState } from "../redux/store";

export default function Dashboard() {
  const dispatch = useDispatch();
  const expenses = useSelector((state: RootState) => state.expenses);

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [
          { icon: "List", link: "./daily" },
          { icon: "Category", link: "./categories" },
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

  const sortedByDay = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));
  const sortedByCategory = Object.entries(byCategory)
    .map(([category, values]) => ({ category, total: values.total, count: values.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const dailyLabels = sortedByDay.map(([day]) => day);
  const dailyValues = sortedByDay.map(([, total]) => Number(total.toFixed(2)));
  const cumulativeValues = dailyValues.reduce<number[]>((acc, value, index) => {
    const running = (acc[index - 1] ?? 0) + value;
    acc.push(running);
    return acc;
  }, []);
  const latestValue = cumulativeValues[cumulativeValues.length - 1] ?? 0;
  const totalNegative = negativeEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

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
            {latestValue.toFixed(2)}
          </Typography>
          <Typography color="text.secondary">Latest cumulative value</Typography>
          <Divider sx={{ my: 1 }} />
          <ChartContainer
            series={[{ type: "line", label: "Spending", data: cumulativeValues }]}
            xAxis={[{ scaleType: "point", data: dailyLabels.map((value) => format(new Date(value), "MMM d")) }]}
            yAxis={[{ valueFormatter: (value) => `${(value / 1000).toFixed(0)}K` }]}
            width={Math.min(560, window.innerWidth - 40)}
            height={220}
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
    </Stack>
  );
}
