const express = require("express");
const cors = require("cors");
const { pool } = require("./config/db");
const { client, metricsMiddleware } = require("./config/metrics");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/users", profileRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/db/health", async (req, res) => {
  if (!pool) {
    return res.status(500).json({
      status: "error",
      message: "DATABASE_URL is not configured",
    });
  }

  try {
    const result = await pool.query("SELECT NOW() AS now");
    return res.json({
      status: "ok",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

app.get("/metrics", async (req, res, next) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    next(error);
  }
});

app.use(errorMiddleware);

module.exports = app;
