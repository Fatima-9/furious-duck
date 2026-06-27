const express = require("express");
const cors = require("cors");
const { pool } = require("./config/db");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
