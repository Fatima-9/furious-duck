jest.mock("../../models/Utilisateur", () => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../services/emailService", () => ({
  sendPasswordChangedEmail: jest.fn(),
}));

const Utilisateur = require("../../models/Utilisateur");
const profileService = require("../../services/profileService");
const emailService = require("../../services/emailService");
const bcrypt = require("bcrypt");

describe("profileService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("soft deletes a non-admin profile", async () => {
    Utilisateur.findById.mockResolvedValue({
      id_user: 1,
      email: "client@example.com",
      role_id: 1,
      statut: "actif",
    });
    Utilisateur.update.mockResolvedValue({
      id_user: 1,
      email: "client@example.com",
      role_id: 1,
      statut: "supprime",
    });

    const result = await profileService.deleteProfile(1);

    expect(Utilisateur.update).toHaveBeenCalledWith(1, { statut: "supprime" });
    expect(result.statut).toBe("supprime");
  });

  test("rejects admin profile deletion", async () => {
    Utilisateur.findById.mockResolvedValue({
      id_user: 2,
      email: "admin@example.com",
      role_id: 2,
      statut: "actif",
    });

    await expect(profileService.deleteProfile(2)).rejects.toThrow(
      "admin account cannot be deleted"
    );
    expect(Utilisateur.update).not.toHaveBeenCalled();
  });

  test("rejects deletion when the user does not exist", async () => {
    Utilisateur.findById.mockResolvedValue(null);

    await expect(profileService.deleteProfile(404)).rejects.toMatchObject({
      statusCode: 404,
      message: "user not found",
    });
    expect(Utilisateur.update).not.toHaveBeenCalled();
  });

  test("returns a sanitized profile", async () => {
    Utilisateur.findById.mockResolvedValue({
      id_user: 3,
      email: "client@example.com",
      mot_de_passe: "hashed",
      reset_token_hash: "secret",
    });

    const result = await profileService.getProfile(3);

    expect(result.email).toBe("client@example.com");
    expect(result.mot_de_passe).toBeUndefined();
  });

  test("rejects missing profiles", async () => {
    Utilisateur.findById.mockResolvedValue(null);

    await expect(profileService.getProfile(404)).rejects.toMatchObject({
      statusCode: 404,
      message: "user not found",
    });
  });

  test("updates a profile when the email is available", async () => {
    Utilisateur.findByEmail.mockResolvedValue(null);
    Utilisateur.update.mockResolvedValue({
      id_user: 4,
      email: "new@example.com",
      mot_de_passe: "hashed",
    });

    const result = await profileService.updateProfile(4, {
      email: "new@example.com",
      prenom: "Alice",
    });

    expect(Utilisateur.update).toHaveBeenCalledWith(4, {
      email: "new@example.com",
      prenom: "Alice",
    });
    expect(result.mot_de_passe).toBeUndefined();
  });

  test("allows updating with the current email", async () => {
    Utilisateur.findByEmail.mockResolvedValue({
      id_user: 5,
      email: "same@example.com",
    });
    Utilisateur.update.mockResolvedValue({
      id_user: 5,
      email: "same@example.com",
    });

    await expect(
      profileService.updateProfile(5, { email: "same@example.com" })
    ).resolves.toMatchObject({ email: "same@example.com" });
  });

  test("rejects profile update when another user owns the email", async () => {
    Utilisateur.findByEmail.mockResolvedValue({
      id_user: 9,
      email: "used@example.com",
    });

    await expect(
      profileService.updateProfile(5, { email: "used@example.com" })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "email is already used",
    });
  });

  test("rejects profile update for unknown users", async () => {
    Utilisateur.update.mockResolvedValue(null);

    await expect(profileService.updateProfile(404, { prenom: "Alice" })).rejects.toMatchObject({
      statusCode: 404,
      message: "user not found",
    });
  });

  test("changes the password and sends a best-effort email", async () => {
    const hashedPassword = await bcrypt.hash("OldPassword123!", 4);
    Utilisateur.findById.mockResolvedValue({
      id_user: 6,
      email: "client@example.com",
      mot_de_passe: hashedPassword,
    });
    Utilisateur.update.mockResolvedValue({ id_user: 6 });
    emailService.sendPasswordChangedEmail.mockResolvedValue();

    await profileService.changePassword(6, {
      mot_de_passe_actuel: "OldPassword123!",
      mot_de_passe: "NewPassword123!",
    });

    expect(Utilisateur.update).toHaveBeenCalledWith(6, {
      mot_de_passe: expect.any(String),
    });
    expect(emailService.sendPasswordChangedEmail).toHaveBeenCalledWith(
      "client@example.com"
    );
  });

  test("does not block password change when the email fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const hashedPassword = await bcrypt.hash("OldPassword123!", 4);
    Utilisateur.findById.mockResolvedValue({
      id_user: 7,
      email: "client@example.com",
      mot_de_passe: hashedPassword,
    });
    Utilisateur.update.mockResolvedValue({ id_user: 7 });
    emailService.sendPasswordChangedEmail.mockRejectedValue(new Error("SMTP down"));

    await expect(
      profileService.changePassword(7, {
        mot_de_passe_actuel: "OldPassword123!",
        mot_de_passe: "NewPassword123!",
      })
    ).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });

  test("rejects password change for an unknown user or invalid current password", async () => {
    Utilisateur.findById.mockResolvedValueOnce(null);
    await expect(
      profileService.changePassword(404, {
        mot_de_passe_actuel: "OldPassword123!",
        mot_de_passe: "NewPassword123!",
      })
    ).rejects.toMatchObject({ statusCode: 404 });

    const hashedPassword = await bcrypt.hash("OldPassword123!", 4);
    Utilisateur.findById.mockResolvedValueOnce({
      id_user: 8,
      mot_de_passe: hashedPassword,
    });
    await expect(
      profileService.changePassword(8, {
        mot_de_passe_actuel: "WrongPassword123!",
        mot_de_passe: "NewPassword123!",
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
