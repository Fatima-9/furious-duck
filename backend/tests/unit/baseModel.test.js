jest.mock("../../config/db", () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require("../../config/db");
const BaseModel = require("../../models/BaseModel");

describe("BaseModel", () => {
  const model = new BaseModel({
    tableName: "tests",
    primaryKey: "id_test",
    columns: ["nom", "email", "statut"],
  });

  beforeEach(() => {
    pool.query.mockReset();
  });

  test("findAll returns ordered rows", async () => {
    pool.query.mockResolvedValue({ rows: [{ id_test: 1 }] });

    await expect(model.findAll()).resolves.toEqual([{ id_test: 1 }]);
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM tests ORDER BY id_test ASC"
    );
  });

  test("findById returns the first row or null", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_test: 1 }] });
    await expect(model.findById(1)).resolves.toEqual({ id_test: 1 });

    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(model.findById(2)).resolves.toBeNull();
  });

  test("create builds an insert from defined fields only", async () => {
    pool.query.mockResolvedValue({ rows: [{ id_test: 1, nom: "Alice" }] });

    await expect(
      model.create({ nom: "Alice", email: undefined, statut: "actif" })
    ).resolves.toEqual({ id_test: 1, nom: "Alice" });

    expect(pool.query.mock.calls[0][0]).toContain(
      "INSERT INTO tests (nom, statut)"
    );
    expect(pool.query.mock.calls[0][1]).toEqual(["Alice", "actif"]);
  });

  test("update builds an update from defined fields only", async () => {
    pool.query.mockResolvedValue({ rows: [{ id_test: 1, nom: "Alice" }] });

    await expect(
      model.update(1, { nom: "Alice", email: undefined })
    ).resolves.toEqual({ id_test: 1, nom: "Alice" });

    expect(pool.query.mock.calls[0][0]).toContain("UPDATE tests");
    expect(pool.query.mock.calls[0][0]).toContain("SET nom = $1");
    expect(pool.query.mock.calls[0][1]).toEqual(["Alice", 1]);
  });

  test("update and delete return null when no row is returned", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(model.update(1, { nom: "Alice" })).resolves.toBeNull();
    await expect(model.delete(1)).resolves.toBeNull();
  });

  test("delete returns the deleted row", async () => {
    pool.query.mockResolvedValue({ rows: [{ id_test: 1 }] });

    await expect(model.delete(1)).resolves.toEqual({ id_test: 1 });
    expect(pool.query).toHaveBeenCalledWith(
      "DELETE FROM tests WHERE id_test = $1 RETURNING *",
      [1]
    );
  });
});
