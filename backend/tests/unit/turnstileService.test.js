describe("turnstileService", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.TURNSTILE_SECRET_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "production";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.TURNSTILE_SECRET_KEY = originalSecret;
    global.fetch = originalFetch;
  });

  test("bypasses verification in test environment", async () => {
    process.env.NODE_ENV = "test";
    const { verifyTurnstileToken } = require("../../services/turnstileService");

    await expect(verifyTurnstileToken()).resolves.toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("requires a secret key outside test environment", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const { verifyTurnstileToken } = require("../../services/turnstileService");

    await expect(verifyTurnstileToken("token")).rejects.toMatchObject({
      statusCode: 500,
      message: "TURNSTILE_SECRET_KEY is not configured",
    });
  });

  test("requires a token", async () => {
    const { verifyTurnstileToken } = require("../../services/turnstileService");

    await expect(verifyTurnstileToken()).rejects.toMatchObject({
      statusCode: 400,
      message: "Verification captcha requise.",
    });
  });

  test("rejects when Cloudflare cannot be reached", async () => {
    global.fetch.mockResolvedValue({ ok: false });
    const { verifyTurnstileToken } = require("../../services/turnstileService");

    await expect(verifyTurnstileToken("token")).rejects.toMatchObject({
      statusCode: 502,
      message: "Impossible de verifier le captcha.",
    });
  });

  test("rejects an invalid captcha response", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: false }),
    });
    const { verifyTurnstileToken } = require("../../services/turnstileService");

    await expect(verifyTurnstileToken("token")).rejects.toMatchObject({
      statusCode: 400,
      message: "Captcha invalide ou expire.",
    });
  });

  test("accepts a valid captcha response and forwards the remote ip", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
    const { verifyTurnstileToken } = require("../../services/turnstileService");

    await expect(verifyTurnstileToken("token", "127.0.0.1")).resolves.toBe(true);
    const options = global.fetch.mock.calls[0][1];
    expect(options.headers).toEqual({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    const body = options.body;
    expect(body.get("secret")).toBe("secret");
    expect(body.get("response")).toBe("token");
    expect(body.get("remoteip")).toBe("127.0.0.1");
  });

  test("throws structured application errors", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const { verifyTurnstileToken } = require("../../services/turnstileService");

    await expect(verifyTurnstileToken("token")).rejects.toMatchObject({
      statusCode: 500,
      message: "TURNSTILE_SECRET_KEY is not configured",
    });
  });
});
