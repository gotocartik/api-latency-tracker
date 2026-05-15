import express from "express";
import { latencyTracker } from "./index.js";

const app = express();
const PORT = process.env.PORT || 3000;

const { middleware, getMetrics } = latencyTracker({
  slowThreshold: 300,
  showTimestamp: true,
});

app.use(middleware);

app.get("/", (req, res) => {
  res.json({ message: "RoutePulse is running" });
});

app.get("/fast", (req, res) => {
  res.json({ message: "This is fast" });
});

app.get("/slow", (req, res) => {
  setTimeout(() => {
    res.json({ message: "This was slow" });
  }, 500);
});

app.get("/very-slow", (req, res) => {
  setTimeout(() => {
    res.json({ message: "This was very slow" });
  }, 1000);
});

app.get("/metrics", (req, res) => {
  res.json(getMetrics());
});

app.listen(PORT, () => {
  console.log(`\n  RoutePulse test server running on http://localhost:${PORT}\n`);
  console.log(`  Try these routes:`);
  console.log(`    curl http://localhost:${PORT}/fast`);
  console.log(`    curl http://localhost:${PORT}/slow`);
  console.log(`    curl http://localhost:${PORT}/very-slow`);
  console.log(`    curl http://localhost:${PORT}/metrics\n`);
});
