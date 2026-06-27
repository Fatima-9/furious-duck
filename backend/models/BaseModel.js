const { pool } = require("../config/db");

class BaseModel {
  constructor({ tableName, primaryKey, columns }) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.columns = columns;
  }

  ensureDatabaseConfigured() {
    if (!pool) {
      throw new Error("DATABASE_URL is not configured");
    }
  }

  async findAll() {
    this.ensureDatabaseConfigured();

    const query = `SELECT * FROM ${this.tableName} ORDER BY ${this.primaryKey} ASC`;
    const result = await pool.query(query);

    return result.rows;
  }

  async findById(id) {
    this.ensureDatabaseConfigured();

    const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  }

  async create(data) {
    this.ensureDatabaseConfigured();

    const fields = this.columns.filter((column) => data[column] !== undefined);
    const values = fields.map((field) => data[field]);
    const placeholders = fields.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${this.tableName} (${fields.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  async update(id, data) {
    this.ensureDatabaseConfigured();

    const fields = this.columns.filter((column) => data[column] !== undefined);
    const values = fields.map((field) => data[field]);
    const assignments = fields.map((field, index) => `${field} = $${index + 1}`);

    const query = `
      UPDATE ${this.tableName}
      SET ${assignments.join(", ")}
      WHERE ${this.primaryKey} = $${fields.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, [...values, id]);

    return result.rows[0] || null;
  }

  async delete(id) {
    this.ensureDatabaseConfigured();

    const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  }
}

module.exports = BaseModel;
