const {
  validateCreateEmployeePayload,
  validateUpdateEmployeePayload,
} = require("../../validations/adminEmployeeValidation");

describe("adminEmployeeValidation", () => {
  const validPayload = {
    nom: "Dupont",
    prenom: "Alice",
    email: "Alice.Dupont@example.com",
    mot_de_passe: "Password1!",
    boutique_id: "2",
  };

  test("normalizes create employee payload", () => {
    expect(validateCreateEmployeePayload({ ...validPayload, password: "Ignored1!" })).toEqual({
      nom: "Dupont",
      prenom: "Alice",
      email: "alice.dupont@example.com",
      mot_de_passe: "Password1!",
      boutique_id: 2,
      statut: "actif",
    });
  });

  test("accepts valid update fields", () => {
    expect(
      validateUpdateEmployeePayload({
        prenom: " Alice ",
        nom: " Martin ",
        email: "MARTIN@example.com",
        password: "Password2!",
        boutique_id: 3,
        statut: "inactif",
      })
    ).toEqual({
      prenom: "Alice",
      nom: "Martin",
      email: "martin@example.com",
      mot_de_passe: "Password2!",
      boutique_id: 3,
      statut: "inactif",
    });
  });

  test("rejects invalid boutique id", () => {
    expect(() =>
      validateCreateEmployeePayload({
        ...validPayload,
        boutique_id: 0,
      })
    ).toThrow("boutique_id must be a positive integer");
  });

  test("rejects invalid status", () => {
    expect(() =>
      validateUpdateEmployeePayload({
        statut: "archive",
      })
    ).toThrow("statut must be actif or inactif");
    expect(() =>
      validateUpdateEmployeePayload({
        statut: "supprime",
      })
    ).toThrow("statut must be actif or inactif");
  });

  test("rejects empty update payload", () => {
    expect(() => validateUpdateEmployeePayload({})).toThrow(
      "at least one field must be provided"
    );
  });

  test("rejects invalid create and update fields", () => {
    expect(() =>
      validateUpdateEmployeePayload({ prenom: " " })
    ).toThrow("prenom is required");
    expect(() =>
      validateUpdateEmployeePayload({ mot_de_passe: "short" })
    ).toThrow("mot_de_passe must contain at least 8 characters");
    expect(() =>
      validateUpdateEmployeePayload({ boutique_id: "bad" })
    ).toThrow("boutique_id must be a positive integer");
  });
});
