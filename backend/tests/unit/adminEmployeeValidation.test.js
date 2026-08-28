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
    expect(validateCreateEmployeePayload(validPayload)).toEqual({
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
        nom: " Martin ",
        email: "MARTIN@example.com",
        boutique_id: 3,
        statut: "inactif",
      })
    ).toEqual({
      nom: "Martin",
      email: "martin@example.com",
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
    ).toThrow("statut must be actif, inactif or supprime");
  });

  test("rejects empty update payload", () => {
    expect(() => validateUpdateEmployeePayload({})).toThrow(
      "at least one field must be provided"
    );
  });
});
