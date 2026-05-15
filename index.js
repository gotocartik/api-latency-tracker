const IGNORED_PATHS = [
  /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/,
  /^\/favicon\./,
];

function isIgnored(path) {
  return IGNORED_PATHS.some((re) => re.test(path));
}

function colorize(text, code) {
  return `\x1b[${code}m${text}\x1b[0m`;
}

function gray(text) {
  return colorize(text, 2);
}

function green(text) {
  return colorize(text, 32);
}

function yellow(text) {
  return colorize(text, 33);
}

function red(text) {
  return colorize(text, 31);
}

function bold(text) {
  return colorize(text, 1);
}

export class RoutePulse {
  constructor(options = {}) {
    this.slowThreshold = options.slowThreshold || 300;
    this.showTimestamp = options.showTimestamp || false;
    this.history = [];
    this.maxHistory = options.maxHistory || 1000;
  }

  getMetrics() {
    if (this.history.length === 0) {
      return {
        total: 0,
        average: 0,
        slow: 0,
        slowest: null,
        routes: {},
        statusBreakdown: {},
      };
    }

    const routes = {};
    const statusBreakdown = {};
    let totalTime = 0;
    let slowCount = 0;
    let slowest = null;

    for (const entry of this.history) {
      totalTime += entry.duration;
      if (entry.duration > this.slowThreshold) slowCount++;

      if (!slowest || entry.duration > slowest.duration) {
        slowest = entry;
      }

      const routeKey = `${entry.method} ${entry.path}`;
      if (!routes[routeKey]) {
        routes[routeKey] = { count: 0, totalTime: 0, avgTime: 0, slow: 0 };
      }
      routes[routeKey].count++;
      routes[routeKey].totalTime += entry.duration;
      routes[routeKey].avgTime = Math.round(routes[routeKey].totalTime / routes[routeKey].count);
      if (entry.duration > this.slowThreshold) routes[routeKey].slow++;

      const status = String(entry.status);
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    }

    return {
      total: this.history.length,
      average: Math.round(totalTime / this.history.length),
      slow: slowCount,
      slowest: slowest ? { method: slowest.method, path: slowest.path, duration: slowest.duration } : null,
      routes,
      statusBreakdown,
      threshold: this.slowThreshold,
    };
  }

  middleware(req, res, next) {
    if (isIgnored(req.path)) return next();

    const start = process.hrtime.bigint();

    const originalEnd = res.end.bind(res);
    res.end = (...args) => {
      const duration = Number(process.hrtime.bigint() - start) / 1e6;
      const rounded = Math.round(duration);

      const entry = {
        method: req.method,
        path: req.originalUrl || req.url,
        duration: rounded,
        status: res.statusCode,
        timestamp: new Date().toISOString(),
      };

      this.history.push(entry);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      if (rounded > this.slowThreshold) {
        console.log(
          `${this.showTimestamp ? gray(new Date().toLocaleTimeString()) + " " : ""}` +
            `${bold(req.method)} ${req.originalUrl || req.url} ` +
            `${red(rounded + "ms")} ${red("⚠ SLOW")}`
        );
      } else {
        console.log(
          `${this.showTimestamp ? gray(new Date().toLocaleTimeString()) + " " : ""}` +
            `${bold(req.method)} ${req.originalUrl || req.url} ` +
            `${rounded > this.slowThreshold * 0.7 ? yellow(rounded + "ms") : green(rounded + "ms")}`
        );
      }

      originalEnd(...args);
    };

    next();
  }
}

export function latencyTracker(options = {}) {
  const pulse = new RoutePulse(options);
  return {
    middleware: pulse.middleware.bind(pulse),
    getMetrics: pulse.getMetrics.bind(pulse),
  };
}

export default latencyTracker;
