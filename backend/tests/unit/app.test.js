jest.mock("../../config/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const request = require("supertest");
const { pool } = require("../../config/db");
const { client } = require("../../config/metrics");
const app = require("../../app");

describe("app health and metrics routes", () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test("returns api health", async () => {
    await request(app)
      .get("/api/health")
      .expect(200)
      .expect({ status: "ok" });
  });

  test("returns database health when the database responds", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ now: "2026-09-01T00:00:00.000Z" }],
    });

    const response = await request(app).get("/api/db/health").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      databaseTime: "2026-09-01T00:00:00.000Z",
    });
  });

  test("returns database health failure when the database rejects", async () => {
    pool.query.mockRejectedValueOnce(new Error("database down"));

    await request(app)
      .get("/api/db/health")
      .expect(500)
      .expect({
        status: "error",
        message: "Database connection failed",
      });
  });

  test("exposes prometheus metrics", async () => {
    const response = await request(app).get("/metrics").expect(200);

    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.text).toContain("nodejs");
  });

  test("forwards prometheus metrics errors to the error middleware", async () => {
    const originalMetrics = client.register.metrics;
    client.register.metrics = jest.fn().mockRejectedValue(new Error("metrics down"));

    try {
      await request(app).get("/metrics").expect(500);
    } finally {
      client.register.metrics = originalMetrics;
    }
  });
});
