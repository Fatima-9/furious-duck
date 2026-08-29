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
