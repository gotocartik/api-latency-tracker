# routepulse-monitor

![npm](https://img.shields.io/npm/dt/routepulse-monitor)
![npm](https://img.shields.io/npm/dw/routepulse-monitor)
![npm version](https://img.shields.io/npm/v/routepulse-monitor)
![license](https://img.shields.io/npm/l/routepulse-monitor)

> Lightweight Express.js middleware for API response time tracking, slow route detection, and real-time request metrics.

**Why routepulse-monitor?** — Strong, short, memorable, modern, not over-generic, and expandable later for dashboards, metrics, analytics, and monitoring.

## Installation

```bash
npm install routepulse-monitor
```

## Quick Start

```js
import express from "express";
import { latencyTracker } from "routepulse-monitor";

const app = express();

const { middleware, getMetrics } = latencyTracker({
  slowThreshold: 300,
  showTimestamp: true,
});

app.use(middleware);

app.get("/fast", (req, res) => {
  res.json({ ok: true });
});

app.get("/slow", (req, res) => {
  setTimeout(() => res.json({ ok: true }), 500);
});

app.get("/metrics", (req, res) => {
  res.json(getMetrics());
});

app.listen(3000);
```

## Output

```
GET /fast 2ms
GET /users 32ms
POST /login 120ms
GET /dashboard 420ms ⚠ SLOW
GET /slow 502ms ⚠ SLOW
```

Colors indicate:
- **Green** — fast (≤ 70% of threshold)
- **Yellow** — moderate (> 70% of threshold)
- **Red** — slow (exceeds threshold)

## Options

| Option         | Type    | Default | Description                        |
| -------------- | ------- | ------- | ---------------------------------- |
| slowThreshold  | number  | 300     | Threshold in ms for slow warning   |
| showTimestamp  | boolean | false   | Show timestamp in log output       |
| maxHistory     | number  | 1000    | Max stored request entries         |

## Metrics Dashboard

Access real-time analytics via `getMetrics()`:

```js
const metrics = getMetrics();
// {
//   total: 150,
//   average: 45,
//   slow: 3,
//   slowest: { method: "GET", path: "/slow", duration: 502 },
//   routes: {
//     "GET /fast": { count: 100, totalTime: 200, avgTime: 2, slow: 0 },
//     "GET /slow": { count: 50, totalTime: 25000, avgTime: 500, slow: 50 }
//   },
//   statusBreakdown: { "200": 140, "404": 10 },
//   threshold: 300
// }
```

## Ignored Assets

Static files are automatically skipped:
- `.css`, `.js`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.ico`, `.svg`
- `.woff`, `.woff2`, `.ttf`, `.eot`
- `favicon.ico`

## Test

```bash
node test.js
```

## License

MIT
