const {
  verifyGoogleToken,
  verifyFacebookToken,
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
});
