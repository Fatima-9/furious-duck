jest.mock("../../config/db", () => ({
  pool: null,
}));

const request = require("supertest");
const app = require("../../app");

describe("app database health without database configuration", () => {
  test("returns a clear error when DATABASE_URL is missing", async () => {
    await request(app)
      .get("/api/db/health")
      .expect(500)
      .expect({
        status: "error",
        message: "DATABASE_URL is not configured",
      });
  });
});
