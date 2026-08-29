jest.mock("../../services/exportService", () => ({
  EMAILING_COLUMNS: ["email", "nom"],
  getEmailingExport: jest.fn(),
  getUserPersonalExport: jest.fn(),
}));

const exportService = require("../../services/exportService");
const exportController = require("../../controllers/exportController");

function createResponse() {
  return {
    setHeader: jest.fn(),
    send: jest.fn(),
    json: jest.fn(),
  };
}

describe("exportController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("exports emailing data as json", async () => {
    const res = createResponse();
    const utilisateurs = [{ email: "client@example.com", nom: "Client" }];
    exportService.getEmailingExport.mockResolvedValue(utilisateurs);

    await exportController.exportEmailing({ query: {} }, res);

    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: {
        total: 1,
        utilisateurs,
      },
    });
  });

  test("exports emailing data as csv", async () => {
    const res = createResponse();
    exportService.getEmailingExport.mockResolvedValue([
      { email: "client@example.com", nom: "Client" },
    ]);

    await exportController.exportEmailing({ query: { format: "csv" } }, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "text/csv; charset=utf-8"
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="export-emailing.csv"'
    );
    expect(res.send.mock.calls[0][0]).toContain("client@example.com");
  });

  test("exports personal data for the authenticated user", async () => {
    const res = createResponse();
    const donnees = { profil: { id_user: 7 }, participations: [] };
    exportService.getUserPersonalExport.mockResolvedValue(donnees);

    await exportController.exportMyData({ user: { id_user: 7 } }, res);

    expect(exportService.getUserPersonalExport).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: donnees,
    });
  });
});
