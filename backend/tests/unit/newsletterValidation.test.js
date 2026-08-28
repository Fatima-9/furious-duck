const {
  validateNewsletterPayload,
} = require("../../validations/newsletterValidation");

describe("newsletterValidation", () => {
  test("normalizes newsletter email", () => {
    expect(validateNewsletterPayload({ email: " USER@example.com " })).toEqual({
      email: "user@example.com",
    });
  });

  test("rejects invalid newsletter email", () => {
    expect(() => validateNewsletterPayload({ email: "invalid" })).toThrow(
      "email must be valid"
    );
  });
});
