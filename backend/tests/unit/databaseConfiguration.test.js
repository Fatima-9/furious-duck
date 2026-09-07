function loadWithMissingDatabase(modulePath) {
  jest.resetModules();
  jest.doMock("../../config/db", () => ({ pool: null }));
  return require(modulePath);
}

describe("database configuration", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }

    jest.dontMock("pg");
    jest.dontMock("dotenv");
    jest.resetModules();
  });

  test("does not create a pool when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    jest.doMock("dotenv", () => ({
      config: jest.fn(),
    }));
    jest.doMock("pg", () => ({
      Pool: jest.fn(),
    }));

    const { Pool } = require("pg");
    const { pool } = require("../../config/db");

    expect(pool).toBeNull();
    expect(Pool).not.toHaveBeenCalled();
  });

  test("creates a pool with sslmode removed from DATABASE_URL", () => {
    const Pool = jest.fn();
    process.env.DATABASE_URL =
      "postgresql://user:pass@example.com:5432/app?sslmode=require&schema=public";
    jest.doMock("dotenv", () => ({
      config: jest.fn(),
    }));
    jest.doMock("pg", () => ({ Pool }));

    require("../../config/db");

    expect(Pool).toHaveBeenCalledWith({
      connectionString: "postgresql://user:pass@example.com:5432/app?schema=public",
      ssl: {
        rejectUnauthorized: false,
      },
    });
  });

  test("keeps an invalid DATABASE_URL unchanged", () => {
    const Pool = jest.fn();
    process.env.DATABASE_URL = "not a valid url";
    jest.doMock("dotenv", () => ({
      config: jest.fn(),
    }));
    jest.doMock("pg", () => ({ Pool }));

    require("../../config/db");

    expect(Pool).toHaveBeenCalledWith({
      connectionString: "not a valid url",
      ssl: {
        rejectUnauthorized: false,
      },
    });
  });
});

describe("missing database configuration", () => {
  afterEach(() => {
    jest.dontMock("../../config/db");
    jest.resetModules();
  });

  test("BaseModel rejects queries without DATABASE_URL", async () => {
    const BaseModel = loadWithMissingDatabase("../../models/BaseModel");
    const model = new BaseModel({
      tableName: "tests",
      primaryKey: "id_test",
      columns: ["nom"],
    });

    await expect(model.findAll()).rejects.toThrow("DATABASE_URL is not configured");
  });

  test("services reject database access without DATABASE_URL", async () => {
    const adminEmployeeService = loadWithMissingDatabase(
      "../../services/adminEmployeeService"
    );
    await expect(adminEmployeeService.listActiveBoutiques()).rejects.toMatchObject({
      statusCode: 500,
      message: "DATABASE_URL is not configured",
    });

    const adminStatsService = loadWithMissingDatabase("../../services/adminStatsService");
    await expect(adminStatsService.getTicketStats()).rejects.toMatchObject({
      statusCode: 500,
      message: "DATABASE_URL is not configured",
    });

    const boutiqueService = loadWithMissingDatabase("../../services/boutiqueService");
    await expect(boutiqueService.findGainByTicketCode("ABCDEFGH12")).rejects.toMatchObject({
      statusCode: 500,
      message: "DATABASE_URL is not configured",
    });

    const ticketService = loadWithMissingDatabase("../../services/ticketService");
    await expect(ticketService.verifyTicket("ABCDEFGH12")).rejects.toMatchObject({
      statusCode: 500,
      message: "DATABASE_URL is not configured",
    });

    const exportService = loadWithMissingDatabase("../../services/exportService");
    await expect(exportService.getEmailingExport()).rejects.toMatchObject({
      statusCode: 500,
      message: "DATABASE_URL is not configured",
    });
  });
});
