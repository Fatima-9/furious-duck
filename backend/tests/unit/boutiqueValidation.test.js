const { validateWinnerSearch } = require("../../validations/boutiqueValidation");

describe("validateWinnerSearch", () => {
  test("accepts a numeric user id", () => {
    expect(validateWinnerSearch({ utilisateur_id: "12" })).toEqual({
      type: "id",
      value: 12,
    });
  });

  test("normalizes an email to lowercase", () => {
    expect(validateWinnerSearch({ email: "  Gagnant@Example.COM " })).toEqual({
      type: "email",
      value: "gagnant@example.com",
    });
  });

  test("accepts a name search", () => {
    expect(validateWinnerSearch({ recherche: " Dupont " })).toEqual({
      type: "nom",
      value: "Dupont",
    });
  });

  test("rejects an empty search", () => {
    expect(() => validateWinnerSearch({})).toThrow(
      "one search criteria is required"
    );
  });

  test("rejects several criteria at once", () => {
    expect(() =>
      validateWinnerSearch({ email: "a@b.com", recherche: "Dupont" })
    ).toThrow("only one search criteria is allowed at a time");
  });

  test("rejects an invalid email", () => {
    expect(() => validateWinnerSearch({ email: "pas-un-email" })).toThrow(
      "email must be valid"
    );
  });

  test("rejects a too short name search", () => {
    expect(() => validateWinnerSearch({ recherche: "D" })).toThrow(
      "recherche must contain at least 2 characters"
    );
  });

  test("rejects a non numeric user id", () => {
    expect(() => validateWinnerSearch({ utilisateur_id: "abc" })).toThrow(
      "utilisateur_id must be a positive integer"
    );
  });
});
