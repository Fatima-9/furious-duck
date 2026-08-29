const {
  validateForgotPasswordPayload,
  validateResetPasswordPayload,
} = require("../../validations/passwordResetValidation");

describe("passwordResetValidation", () => {
  test("normalizes forgot password emails", () => {
    expect(
      validateForgotPasswordPayload({ email: " USER@Example.COM " })
    ).toEqual({ email: "user@example.com" });
  });

  test("rejects invalid forgot password emails", () => {
    expect(() => validateForgotPasswordPayload({ email: "" })).toThrow(
      "email is required"
    );
    expect(() => validateForgotPasswordPayload({ email: "bad" })).toThrow(
      "email must be valid"
    );
  });

  test("normalizes reset password payloads", () => {
    expect(
      validateResetPasswordPayload({
        token: " token ",
        password: "Password123!",
      })
    ).toEqual({
      token: "token",
      mot_de_passe: "Password123!",
    });
  });

  test("rejects invalid reset password payloads", () => {
    expect(() =>
      validateResetPasswordPayload({
        token: "",
        mot_de_passe: "Password123!",
      })
    ).toThrow("token is required");

    expect(() =>
      validateResetPasswordPayload({
        token: "token",
        mot_de_passe: "",
      })
    ).toThrow("mot_de_passe is required");

    expect(() =>
      validateResetPasswordPayload({
        token: "token",
        mot_de_passe: "short",
      })
    ).toThrow("mot_de_passe must contain at least 8 characters");
  });
});
