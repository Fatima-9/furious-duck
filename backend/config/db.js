require("dotenv").config();

const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;

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
