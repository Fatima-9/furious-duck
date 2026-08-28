jest.mock("../../services/adminStatsService", () => ({
  getTicketStats: jest.fn(),
  getGainStats: jest.fn(),
  getUserStats: jest.fn(),
  getOverview: jest.fn(),
}));

jest.mock("../../services/adminEmployeeService", () => ({
  listEmployees: jest.fn(),
  listActiveBoutiques: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
}));

jest.mock("../../services/boutiqueService", () => ({
  findGainByTicketCode: jest.fn(),
  findGainsByWinner: jest.fn(),
  listClientParticipations: jest.fn(),
  markTicketAsRemis: jest.fn(),
}));

jest.mock("../../services/ticketService", () => ({
  verifyTicket: jest.fn(),
  participateWithTicket: jest.fn(),
  getUserGainHistory: jest.fn(),
}));

jest.mock("../../services/contactService", () => ({
  sendContactMessage: jest.fn(),
}));

jest.mock("../../services/newsletterService", () => ({
  subscribeToNewsletter: jest.fn(),
}));

jest.mock("../../services/turnstileService", () => ({
  verifyTurnstileToken: jest.fn(),
}));

const adminStatsService = require("../../services/adminStatsService");
const adminEmployeeService = require("../../services/adminEmployeeService");
const boutiqueService = require("../../services/boutiqueService");
const ticketService = require("../../services/ticketService");
const { sendContactMessage } = require("../../services/contactService");
const { subscribeToNewsletter } = require("../../services/newsletterService");
const { verifyTurnstileToken } = require("../../services/turnstileService");

const adminController = require("../../controllers/adminController");
const adminEmployeeController = require("../../controllers/adminEmployeeController");
const boutiqueController = require("../../controllers/boutiqueController");
const ticketController = require("../../controllers/ticketController");
const contactController = require("../../controllers/contactController");
const newsletterController = require("../../controllers/newsletterController");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns admin stats", async () => {
    const res = createResponse();
    adminStatsService.getTicketStats.mockResolvedValue([{ total: 10 }]);
    adminStatsService.getGainStats.mockResolvedValue([{ gain: "the" }]);
    adminStatsService.getUserStats.mockResolvedValue([{ utilisateurs: 3 }]);
    adminStatsService.getOverview.mockResolvedValue({ totalTickets: 10 });

    await adminController.getTicketStats({}, res);
    expect(res.json).toHaveBeenLastCalledWith({
      status: "success",
      data: { tickets: [{ total: 10 }] },
    });

    await adminController.getGainStats({}, res);
    expect(res.json).toHaveBeenLastCalledWith({
      status: "success",
      data: { gains: [{ gain: "the" }] },
    });

    await adminController.getUserStats({}, res);
    expect(res.json).toHaveBeenLastCalledWith({
      status: "success",
      data: { utilisateurs: [{ utilisateurs: 3 }] },
    });

    await adminController.getOverview({}, res);
    expect(res.json).toHaveBeenLastCalledWith({
      status: "success",
      data: { totalTickets: 10 },
    });
  });

  test("returns admin employee payloads", async () => {
    const res = createResponse();
    adminEmployeeService.listEmployees.mockResolvedValue({ employees: [] });
    adminEmployeeService.listActiveBoutiques.mockResolvedValue([{ id_boutique: 1 }]);
    adminEmployeeService.createEmployee.mockResolvedValue({ id_user: 2 });
    adminEmployeeService.updateEmployee.mockResolvedValue({ id_user: 2, nom: "Durand" });
    adminEmployeeService.deleteEmployee.mockResolvedValue({ id_user: 2, statut: "supprime" });

    await adminEmployeeController.listEmployees({ query: { page: "1" } }, res);
    expect(res.json).toHaveBeenLastCalledWith({
      status: "success",
      data: { employees: [] },
    });

    await adminEmployeeController.listBoutiques({}, res);
    expect(res.json).toHaveBeenLastCalledWith({
      status: "success",
      data: { boutiques: [{ id_boutique: 1 }] },
    });

    await adminEmployeeController.createEmployee(
      {
        body: {
          nom: "Durand",
          prenom: "Alice",
          email: "alice@example.com",
          password: "Password123!",
          boutique_id: 1,
        },
      },
      res
    );
    expect(res.status).toHaveBeenLastCalledWith(201);

    await adminEmployeeController.updateEmployee(
      { params: { id: "2" }, body: { nom: "Durand" } },
      res
    );
    expect(adminEmployeeService.updateEmployee).toHaveBeenCalledWith(2, {
      nom: "Durand",
    });

    await adminEmployeeController.deleteEmployee({ params: { id: "2" } }, res);
    expect(adminEmployeeService.deleteEmployee).toHaveBeenCalledWith(2);
  });

  test("returns boutique and ticket controller payloads", async () => {
    const res = createResponse();
    boutiqueService.findGainByTicketCode.mockResolvedValue({ id_ticket: 1 });
    boutiqueService.findGainsByWinner.mockResolvedValue([{ id_ticket: 2 }]);
    boutiqueService.listClientParticipations.mockResolvedValue({ participations: [] });
    boutiqueService.markTicketAsRemis.mockResolvedValue({ remis: true });
    ticketService.verifyTicket.mockResolvedValue({ exists: true });
    ticketService.participateWithTicket.mockResolvedValue({ id_ticket: 3 });
    ticketService.getUserGainHistory.mockResolvedValue([{ id_ticket: 4 }]);

    await boutiqueController.findGainByTicket({ params: { code: "ABC123DEF4" } }, res);
    expect(boutiqueService.findGainByTicketCode).toHaveBeenCalledWith("ABC123DEF4");

    await boutiqueController.findGainsByWinner(
      { query: { email: "client@example.com" } },
      res
    );
    expect(res.json).toHaveBeenLastCalledWith({
      status: "success",
      data: { gains: [{ id_ticket: 2 }] },
    });

    await boutiqueController.listClientParticipations({ query: { page: "1" } }, res);
    expect(res.json).toHaveBeenLastCalledWith({
      status: "success",
      data: { participations: [] },
    });

    await boutiqueController.markAsRemis(
      { params: { code: "ABC123DEF4" }, user: { id_user: 9 } },
      res
    );
    expect(boutiqueService.markTicketAsRemis).toHaveBeenCalledWith("ABC123DEF4", 9);

    await ticketController.verifyTicket({ params: { code: "ABC123DEF4" } }, res);
    expect(ticketService.verifyTicket).toHaveBeenCalledWith("ABC123DEF4");

    await ticketController.participate(
      { params: { code: "ABC123DEF4" }, user: { id_user: 9 } },
      res
    );
    expect(res.status).toHaveBeenLastCalledWith(201);

    await ticketController.getMyGainHistory({ user: { id_user: 9 } }, res);
    expect(ticketService.getUserGainHistory).toHaveBeenCalledWith(9);
  });

  test("sends contact and newsletter requests", async () => {
    const res = createResponse();
    sendContactMessage.mockResolvedValue();
    subscribeToNewsletter.mockResolvedValue({ email: "client@example.com" });
    verifyTurnstileToken.mockResolvedValue(true);

    await contactController.sendMessage(
      {
        ip: "127.0.0.1",
        body: {
          nom: "Dupont",
          prenom: "Alice",
          email: "alice@example.com",
          motif: "Question sur le jeu",
          message: "Bonjour, j'ai une question.",
          turnstile_token: "captcha-token",
        },
      },
      res
    );
    expect(verifyTurnstileToken).toHaveBeenCalledWith("captcha-token", "127.0.0.1");
    expect(res.status).toHaveBeenLastCalledWith(202);

    await newsletterController.subscribe(
      { body: { email: "client@example.com" } },
      res
    );
    expect(subscribeToNewsletter).toHaveBeenCalledWith({
      email: "client@example.com",
    });
    expect(res.status).toHaveBeenLastCalledWith(202);
  });
});
