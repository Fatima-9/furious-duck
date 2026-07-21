const {
  validateUpdateProfilePayload,
  validateChangePasswordPayload,
} = require("../../validations/profileValidation");

describe("profileValidation", () => {
  test("keeps only editable profile fields", () => {
    const payload = validateUpdateProfilePayload({
      nom: "  Duck ",
      prenom: " Furious ",
      email: " USER@Example.COM ",
      sexe: "  autre ",
    });

    expect(payload).toEqual({
      nom: "Duck",
      prenom: "Furious",
      email: "user@example.com",
      sexe: "autre",
    });
  });

  test("rejects forbidden profile fields", () => {
    expect(() =>
      validateUpdateProfilePayload({
        role_id: 1,
      })
    ).toThrow("these fields cannot be updated: role_id");
  });

  test("rejects a password change with the same password", () => {
    expect(() =>
      validateChangePasswordPayload({
        mot_de_passe_actuel: "Password123!",
        mot_de_passe: "Password123!",
      })
    ).toThrow("new password must be different from the current one");
  });
});
