const {
  validateContactPayload,
} = require("../../validations/contactValidation");

describe("contactValidation", () => {
  test("normalizes a valid contact payload", () => {
    expect(
      validateContactPayload({
        prenom: " Alice ",
        nom: " Dupont ",
        email: "ALICE@example.com",
        motif: "Question sur le jeu",
        message: "Bonjour, je souhaite poser une question.",
        turnstile_token: "token-value",
      })
    ).toEqual({
      prenom: "Alice",
      nom: "Dupont",
      email: "alice@example.com",
      motif: "Question sur le jeu",
      message: "Bonjour, je souhaite poser une question.",
      turnstile_token: "token-value",
    });
  });

  test("rejects invalid reason", () => {
    expect(() =>
      validateContactPayload({
        prenom: "Alice",
        nom: "Dupont",
        email: "alice@example.com",
        motif: "Spam",
        message: "Bonjour, je souhaite poser une question.",
        turnstile_token: "token-value",
      })
    ).toThrow("motif is invalid");
  });

  test("rejects short message", () => {
    expect(() =>
      validateContactPayload({
        prenom: "Alice",
        nom: "Dupont",
        email: "alice@example.com",
        motif: "Autre",
        message: "Salut",
        turnstile_token: "token-value",
      })
    ).toThrow("message must contain at least 10 characters");
  });
});
