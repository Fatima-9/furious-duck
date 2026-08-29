function loadWithMissingDatabase(modulePath) {
  jest.resetModules();
  jest.doMock("../../config/db", () => ({ pool: null }));
  return require(modulePath);
}

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
