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

jest.mock("../../services/authService", () => ({
  register: jest.fn(),
  login: jest.fn(),
  oauthLogin: jest.fn(),
}));

jest.mock("../../services/passwordResetService", () => ({
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
}));

jest.mock("../../services/profileService", () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  deleteProfile: jest.fn(),
}));

const adminStatsService = require("../../services/adminStatsService");
const adminEmployeeService = require("../../services/adminEmployeeService");
const boutiqueService = require("../../services/boutiqueService");
const ticketService = require("../../services/ticketService");
const { sendContactMessage } = require("../../services/contactService");
const { subscribeToNewsletter } = require("../../services/newsletterService");
const { verifyTurnstileToken } = require("../../services/turnstileService");
const authService = require("../../services/authService");
const passwordResetService = require("../../services/passwordResetService");
const profileService = require("../../services/profileService");

const adminController = require("../../controllers/adminController");
const adminEmployeeController = require("../../controllers/adminEmployeeController");
const authController = require("../../controllers/authController");
const boutiqueController = require("../../controllers/boutiqueController");
const ticketController = require("../../controllers/ticketController");
const contactController = require("../../controllers/contactController");
const newsletterController = require("../../controllers/newsletterController");
const profileController = require("../../controllers/profileController");

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

  test("handles auth flows", async () => {
    const res = createResponse();
    verifyTurnstileToken.mockResolvedValue(true);
    authService.register.mockResolvedValue({ token: "register-token" });
    authService.login.mockResolvedValue({ token: "login-token" });
    authService.oauthLogin.mockResolvedValue({ token: "oauth-token" });
    passwordResetService.requestPasswordReset.mockResolvedValue({
      resetToken: "reset-token",
    });
    passwordResetService.resetPassword.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await authController.register(
      {
        ip: "127.0.0.1",
        body: {
          nom: "Duck",
          prenom: "Furious",
          email: "user@example.com",
          mot_de_passe: "Password123!",
          date_de_naissance: "1990-01-01",
          sexe: "N",
          turnstile_token: "captcha-token",
        },
      },
      res
    );
    expect(res.status).toHaveBeenLastCalledWith(201);

    await authController.login(
      {
        ip: "127.0.0.1",
        body: {
          email: "user@example.com",
          mot_de_passe: "Password123!",
          turnstile_token: "captcha-token",
        },
      },
      res
    );
    expect(res.json).toHaveBeenLastCalledWith({
      status: "success",
      data: { token: "login-token" },
    });

    await authController.forgotPassword(
      { body: { email: "user@example.com" } },
      res
    );
    expect(passwordResetService.requestPasswordReset).toHaveBeenCalledWith({
      email: "user@example.com",
    });

    await authController.resetPassword(
      { body: { token: "token", mot_de_passe: "Password123!" } },
      res
    );
    expect(passwordResetService.resetPassword).toHaveBeenCalled();

    await authController.oauth(
      { body: { provider: "google", token: "oauth-token" } },
      res
    );
    expect(authService.oauthLogin).toHaveBeenCalledWith({
      provider: "google",
      token: "oauth-token",
    });

    consoleSpy.mockRestore();
  });

  test("handles profile flows", async () => {
    const res = createResponse();
    profileService.getProfile.mockResolvedValue({ id_user: 7 });
    profileService.updateProfile.mockResolvedValue({ id_user: 7, nom: "Duck" });
    profileService.changePassword.mockResolvedValue();
    profileService.deleteProfile.mockResolvedValue({ id_user: 7, statut: "supprime" });

    await profileController.getMyProfile({ user: { id_user: 7 } }, res);
    expect(profileService.getProfile).toHaveBeenCalledWith(7);

    await profileController.updateMyProfile(
      { user: { id_user: 7 }, body: { nom: "Duck" } },
      res
    );
    expect(profileService.updateProfile).toHaveBeenCalledWith(7, { nom: "Duck" });

    await profileController.changeMyPassword(
      {
        user: { id_user: 7 },
        body: {
          mot_de_passe_actuel: "OldPassword123!",
          mot_de_passe: "NewPassword123!",
        },
      },
      res
    );
    expect(profileService.changePassword).toHaveBeenCalledWith(7, {
      mot_de_passe_actuel: "OldPassword123!",
      mot_de_passe: "NewPassword123!",
    });

    await profileController.deleteMyProfile({ user: { id_user: 7 } }, res);
    expect(profileService.deleteProfile).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenLastCalledWith({
      status: "success",
      data: { user: { id_user: 7, statut: "supprime" } },
    });
  });
});
