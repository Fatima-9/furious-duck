const express = require("express");
const cors = require("cors");
const { pool } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", profileRoutes);

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

app.use(errorMiddleware);

module.exports = app;
