import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, Checkbox, Divider, Stack, Typography } from "@mui/material";
import { updatePageState } from "../redux/slicePage";
import { RootState } from "../redux/store";

export default function Categories() {
  const dispatch = useDispatch();
  const expenses = useSelector((state: RootState) => state.expenses);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [
          { icon: "List", link: "./daily" },
          { icon: "Category", link: "./categories" },
          { icon: "Info", link: "./about" },
        ],
        title: "categories",
      })
    );
  }, [dispatch]);

  const negativeEntries = expenses.entries.filter((entry) => entry.amount < 0);

  const byCategory = negativeEntries.reduce<Record<string, { total: number; count: number }>>((acc, entry) => {
    const key = entry.category || "Uncategorized";
    const current = acc[key] ?? { total: 0, count: 0 };
    current.total += Math.abs(entry.amount);
    current.count += 1;
    acc[key] = current;
    return acc;
  }, {});

  const sortedByCategory = Object.entries(byCategory)
    .map(([category, values]) => ({ category, total: values.total, count: values.count }))
    .sort((a, b) => b.total - a.total);

  const totalNegative = negativeEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  const selectedTotal = sortedByCategory
    .filter((item) => selectedCategories.includes(item.category))
    .reduce((sum, item) => sum + item.total, 0);
  const summaryTotal = selectedCategories.length > 0 ? selectedTotal : totalNegative;
  const summaryLabel = selectedCategories.length > 0 ? "Selected total" : "Total negative expense";

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
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
          <Typography variant="h6">All categories</Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
            {summaryTotal.toFixed(2)}
          </Typography>
          <Typography color="text.secondary">{summaryLabel}</Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="600">Category breakdown</Typography>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1.5}>
            {sortedByCategory.map((item) => {
              const percentage = totalNegative > 0 ? (item.total / totalNegative) * 100 : 0;
              const checked = selectedCategories.includes(item.category);
              return (
                <div key={item.category} className="rounded border border-gray-200 p-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={checked} onChange={() => toggleCategory(item.category)} size="small" />
                      <Typography fontWeight={600}>{item.category}</Typography>
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
