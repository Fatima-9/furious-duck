require("dotenv").config();

const { Pool } = require("pg");

function normalizeDatabaseUrl(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return value;
  }
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : null;

module.exports = {
  pool,
};
