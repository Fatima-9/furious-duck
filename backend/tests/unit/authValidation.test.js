const {
  validateRegisterPayload,
  validateLoginPayload,
  validateOAuthPayload,
} = require("../../validations/authValidation");

describe("authValidation", () => {
  test("normalizes a valid register payload", () => {
    const payload = validateRegisterPayload({
      nom: "  Duck ",
      prenom: " Furious ",
      email: " USER@Example.COM ",
      password: "Password123!",
      role_id: "1",
      boutique_id: "2",
    });

    expect(payload).toMatchObject({
      nom: "Duck",
      prenom: "Furious",
      email: "user@example.com",
      mot_de_passe: "Password123!",
      role_id: 1,
      boutique_id: 2,
      type_inscription: "email",
    });
  });

  test("rejects an invalid email", () => {
    expect(() =>
      validateLoginPayload({
        email: "not-an-email",
        mot_de_passe: "Password123!",
      })
    ).toThrow("email must be valid");
  });

  test("rejects a short password on register", () => {
    expect(() =>
      validateRegisterPayload({
        nom: "Duck",
        prenom: "Furious",
        email: "user@example.com",
        mot_de_passe: "short",
        role_id: 1,
        boutique_id: 1,
      })
    ).toThrow("mot_de_passe must contain at least 8 characters");
  });

  test("normalizes a valid oauth payload", () => {
    const payload = validateOAuthPayload({
      provider: " Google ",
      token: " token-value ",
      role_id: "1",
      boutique_id: "2",
    });

    expect(payload).toEqual({
      provider: "google",
      token: "token-value",
      role_id: 1,
      boutique_id: 2,
    });
  });

  test("rejects an unknown oauth provider", () => {
    expect(() =>
      validateOAuthPayload({
        provider: "github",
        token: "token-value",
      })
    ).toThrow("provider must be google or facebook");
  });
});
