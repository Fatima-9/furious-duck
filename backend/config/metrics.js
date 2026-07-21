const client = require("prom-client");

client.collectDefaultMetrics({
  prefix: "furious_duck_backend_",
});

const httpRequestDuration = new client.Histogram({
  name: "furious_duck_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    });
  });

  next();
}

module.exports = {
  client,
  metricsMiddleware,
};
