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
      date_de_naissance: "1990-01-01",
      sexe: "  autre ",
    });

    expect(payload).toEqual({
      nom: "Duck",
      prenom: "Furious",
      email: "user@example.com",
      date_de_naissance: "1990-01-01",
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

  test("rejects empty profile update and invalid profile fields", () => {
    expect(() => validateUpdateProfilePayload({})).toThrow("no field to update");
    expect(() => validateUpdateProfilePayload({ nom: " " })).toThrow("nom is required");
    expect(() => validateUpdateProfilePayload({ prenom: " " })).toThrow("prenom is required");
    expect(() => validateUpdateProfilePayload({ email: "bad" })).toThrow("email must be valid");
    expect(() =>
      validateUpdateProfilePayload({ date_de_naissance: "not-a-date" })
    ).toThrow("date_de_naissance must be a valid date");
    expect(() => validateUpdateProfilePayload({ sexe: " " })).toThrow("sexe is required");
  });

  test("validates password change aliases and minimum length", () => {
    expect(
      validateChangePasswordPayload({
        mot_de_passe_actuel: "OldPassword123!",
        password: "NewPassword123!",
      })
    ).toEqual({
      mot_de_passe_actuel: "OldPassword123!",
      mot_de_passe: "NewPassword123!",
    });

    expect(() =>
      validateChangePasswordPayload({
        mot_de_passe_actuel: "OldPassword123!",
        mot_de_passe: "short",
      })
    ).toThrow("mot_de_passe must contain at least 8 characters");
  });
});
