import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Card, CardContent, Typography } from "@mui/material";
import { updatePageState } from "../redux/slicePage";

export default function About() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [{ icon: "Info", link: "./" }],
        title: "about",
      })
    );
  }, [dispatch]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">About this app</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Expenses is a browser-first PWA that helps you upload CSV, XLS, or
          XLSX files and turn them into a simple expense dashboard. It scans
          each sheet and row to identify dates, amounts, and categories, then
          aggregates them locally in memory.
        </Typography>
      </CardContent>
    </Card>
  );
}