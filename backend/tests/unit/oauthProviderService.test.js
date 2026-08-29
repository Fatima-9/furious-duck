const {
  verifyGoogleToken,
  verifyFacebookToken,
  verifyOAuthToken,
} = require("../../services/oauthProviderService");

describe("oauthProviderService", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    process.env.GOOGLE_CLIENT_ID = "google-client-id";
  });

  afterEach(() => {
    delete global.fetch;
    delete process.env.GOOGLE_CLIENT_ID;
  });

  test("verifyGoogleToken returns a normalized profile", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: "google-subject",
        aud: "google-client-id",
        email: "USER@Example.COM",
        email_verified: "true",
        given_name: "Furious",
        family_name: "Duck",
      }),
    });

    await expect(verifyGoogleToken("id-token")).resolves.toEqual({
      subject: "google-subject",
      email: "user@example.com",
      nom: "Duck",
      prenom: "Furious",
    });
  });

  test("verifyGoogleToken rejects a wrong audience", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: "google-subject",
        aud: "another-client-id",
        email: "user@example.com",
        email_verified: "true",
      }),
    });

    await expect(verifyGoogleToken("id-token")).rejects.toMatchObject({
      statusCode: 401,
      message: "invalid oauth audience",
    });
  });

  test("verifyGoogleToken rejects failed fetch and unverified email", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    await expect(verifyGoogleToken("bad-token")).rejects.toMatchObject({
      statusCode: 401,
      message: "invalid oauth token",
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: "google-subject",
        aud: "google-client-id",
        email: "user@example.com",
        email_verified: false,
      }),
    });
    await expect(verifyGoogleToken("id-token")).rejects.toMatchObject({
      statusCode: 401,
      message: "oauth email is not verified",
    });
  });

  test("verifyGoogleToken derives fallback names from full name", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: "google-subject",
        email: "USER@Example.COM",
        email_verified: true,
        name: "Furious Duck",
      }),
    });

    await expect(verifyGoogleToken("id-token")).resolves.toMatchObject({
      email: "user@example.com",
      nom: "Duck",
      prenom: "Furious",
    });
  });

  test("verifyGoogleToken requires an email", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: "google-subject",
        aud: "google-client-id",
        email_verified: true,
      }),
    });

    await expect(verifyGoogleToken("id-token")).rejects.toMatchObject({
      statusCode: 400,
      message: "oauth account email is required",
    });
  });

  test("verifyFacebookToken returns a normalized profile", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "facebook-subject",
        email: "USER@Example.COM",
        first_name: "Furious",
        last_name: "Duck",
      }),
    });

    await expect(verifyFacebookToken("access-token")).resolves.toEqual({
      subject: "facebook-subject",
      email: "user@example.com",
      nom: "Duck",
      prenom: "Furious",
    });
  });

  test("verifyFacebookToken derives fallback names and requires email", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "facebook-subject",
        email: "USER@Example.COM",
        name: "Furious Duck",
      }),
    });

    await expect(verifyFacebookToken("access-token")).resolves.toMatchObject({
      email: "user@example.com",
      nom: "Duck",
      prenom: "Furious",
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "facebook-subject" }),
    });
    await expect(verifyFacebookToken("access-token")).rejects.toMatchObject({
      statusCode: 400,
      message: "oauth account email is required",
    });
  });

  test("verifyOAuthToken dispatches providers and rejects unknown providers", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: "google-subject",
        aud: "google-client-id",
        email: "user@example.com",
        email_verified: true,
      }),
    });
    await expect(verifyOAuthToken("google", "id-token")).resolves.toMatchObject({
      subject: "google-subject",
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "facebook-subject",
        email: "user@example.com",
      }),
    });
    await expect(verifyOAuthToken("facebook", "access-token")).resolves.toMatchObject({
      subject: "facebook-subject",
    });

    await expect(verifyOAuthToken("github", "token")).rejects.toMatchObject({
      statusCode: 400,
      message: "provider must be google or facebook",
    });
  });
});
