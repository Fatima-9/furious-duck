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
      date_de_naissance: "1990-01-01",
      turnstile_token: "test-turnstile-token",
    });

    expect(payload).toMatchObject({
      nom: "Duck",
      prenom: "Furious",
      email: "user@example.com",
      mot_de_passe: "Password123!",
      date_de_naissance: "1990-01-01",
      type_inscription: "email",
      turnstile_token: "test-turnstile-token",
    });
  });

  test("rejects an invalid email", () => {
    expect(() =>
      validateLoginPayload({
        email: "not-an-email",
        mot_de_passe: "Password123!",
        turnstile_token: "test-turnstile-token",
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
        date_de_naissance: "1990-01-01",
        turnstile_token: "test-turnstile-token",
      })
    ).toThrow("mot_de_passe must contain at least 8 characters");
  });

  test("rejects a password without uppercase lowercase number and special character", () => {
    const basePayload = {
      nom: "Duck",
      prenom: "Furious",
      email: "user@example.com",
      date_de_naissance: "1990-01-01",
      turnstile_token: "test-turnstile-token",
    };

    expect(() =>
      validateRegisterPayload({ ...basePayload, mot_de_passe: "password123!" })
    ).toThrow("mot_de_passe must contain at least one uppercase letter");

    expect(() =>
      validateRegisterPayload({ ...basePayload, mot_de_passe: "PASSWORD123!" })
    ).toThrow("mot_de_passe must contain at least one lowercase letter");

    expect(() =>
      validateRegisterPayload({ ...basePayload, mot_de_passe: "Password!" })
    ).toThrow("mot_de_passe must contain at least one number");

    expect(() =>
      validateRegisterPayload({ ...basePayload, mot_de_passe: "Password123" })
    ).toThrow("mot_de_passe must contain at least one special character");
  });

  test("rejects register payload when user is under 18", () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 17);

    expect(() =>
      validateRegisterPayload({
        nom: "Duck",
        prenom: "Furious",
        email: "user@example.com",
        mot_de_passe: "Password123!",
        date_de_naissance: birthDate.toISOString().slice(0, 10),
        turnstile_token: "test-turnstile-token",
      })
    ).toThrow("Vous devez avoir au moins 18 ans pour participer.");
  });

  test("normalizes a valid oauth payload", () => {
    const payload = validateOAuthPayload({
      provider: " Google ",
      token: " token-value ",
    });

    expect(payload).toEqual({
      provider: "google",
      token: "token-value",
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
