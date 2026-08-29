jest.mock("../../services/emailService", () => ({
  sendMail: jest.fn(),
}));

const { sendMail } = require("../../services/emailService");
const { sendContactMessage } = require("../../services/contactService");

describe("sendContactMessage", () => {
  const originalContactTo = process.env.CONTACT_TO_EMAIL;
  const originalSmtpUser = process.env.SMTP_USER;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONTACT_TO_EMAIL = "contact@example.com";
    process.env.SMTP_USER = "smtp@example.com";
  });

  afterEach(() => {
    process.env.CONTACT_TO_EMAIL = originalContactTo;
    process.env.SMTP_USER = originalSmtpUser;
  });

  test("sends the contact email to the configured contact address", async () => {
    sendMail.mockResolvedValue({ messageId: "1" });

    await expect(
      sendContactMessage({
        prenom: "Alice",
        nom: "Dupont",
        email: "alice@example.com",
        motif: "Autre",
        message: "Bonjour, j'ai une question.",
      })
    ).resolves.toEqual({ messageId: "1" });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "contact@example.com",
        subject: "[The Tip Top] Autre",
      })
    );
  });

  test("falls back to SMTP_USER when CONTACT_TO_EMAIL is missing", async () => {
    delete process.env.CONTACT_TO_EMAIL;
    sendMail.mockResolvedValue({ messageId: "2" });

    await sendContactMessage({
      prenom: "Alice",
      nom: "Dupont",
      email: "alice@example.com",
      motif: "Autre",
      message: "Bonjour, j'ai une question.",
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "smtp@example.com" })
    );
  });
});
