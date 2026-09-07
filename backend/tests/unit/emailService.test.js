const emailService = require("../../services/emailService");

describe("emailService content builders", () => {
  test("the reset email contains a link with the token", () => {
    const { subject, text, html, link } =
      emailService.buildPasswordResetContent("abc123");

    expect(subject).toMatch(/einitialisation/);
    expect(link).toContain("token=abc123");
    expect(text).toContain(link);
    expect(html).toContain(link);
  });

  test("the reset link url-encodes the token", () => {
    const { link } = emailService.buildPasswordResetContent("a b/c+d");

    expect(link).toContain("token=a%20b%2Fc%2Bd");
  });

  test("normalizes links when APP_URL ends with a slash", () => {
    const originalAppUrl = process.env.APP_URL;

    jest.resetModules();
    process.env.APP_URL = "http://localhost:5173/";
    const serviceWithTrailingSlash = require("../../services/emailService");

    expect(serviceWithTrailingSlash.buildAppLink("/reset-password?token=abc")).toBe(
      "http://localhost:5173/reset-password?token=abc"
    );

    if (originalAppUrl === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = originalAppUrl;
    }
    jest.resetModules();
  });

  test("the password-changed email confirms the change", () => {
    const { subject, text } = emailService.buildPasswordChangedContent();

    expect(subject).toMatch(/modifi/);
    expect(text).toMatch(/modifi/);
  });
});

describe("emailService dev fallback", () => {
  const OLD_ENV = process.env.SMTP_HOST;

  afterEach(() => {
    if (OLD_ENV === undefined) {
      delete process.env.SMTP_HOST;
    } else {
      process.env.SMTP_HOST = OLD_ENV;
    }
  });

  test("without SMTP configured, it logs instead of sending and does not throw", async () => {
    delete process.env.SMTP_HOST;
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const result = await emailService.sendPasswordResetEmail(
      "user@example.com",
      "tok123"
    );

    expect(result).toEqual({ sent: false, dev: true });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});

describe("emailService SMTP transport", () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
    jest.dontMock("nodemailer");
    jest.resetModules();
  });

  test("sends emails with SMTP authentication when SMTP_USER is configured", async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: "mail-1" });
    const createTransport = jest.fn(() => ({ sendMail }));

    jest.doMock("nodemailer", () => ({ createTransport }));

    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_SECURE = "true";
    process.env.SMTP_USER = "smtp-user";
    process.env.SMTP_PASS = "smtp-pass";
    process.env.SMTP_FROM = "The Tip Top <contact@example.com>";

    const smtpEmailService = require("../../services/emailService");

    const result = await smtpEmailService.sendMail({
      to: "client@example.com",
      subject: "Bonjour",
      text: "Message",
      html: "<p>Message</p>",
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: { user: "smtp-user", pass: "smtp-pass" },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: "The Tip Top <contact@example.com>",
      to: "client@example.com",
      subject: "Bonjour",
      text: "Message",
      html: "<p>Message</p>",
    });
    expect(result).toEqual({ sent: true, dev: false });
  });

  test("creates an SMTP transport without auth when SMTP_USER is absent", async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: "mail-2" });
    const createTransport = jest.fn(() => ({ sendMail }));

    jest.doMock("nodemailer", () => ({ createTransport }));

    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "";
    process.env.SMTP_SECURE = "false";
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const smtpEmailService = require("../../services/emailService");

    await smtpEmailService.sendPasswordChangedEmail("client@example.com");

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: undefined,
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "The Tip Top <no-reply@thetiptop.fr>",
        to: "client@example.com",
        subject: "Votre mot de passe a ete modifie",
      })
    );
  });
});
