jest.mock("../../models/Utilisateur", () => ({
  findByEmail: jest.fn(),
  findByResetTokenHash: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../services/emailService", () => ({
  sendPasswordResetEmail: jest.fn(),
  sendPasswordChangedEmail: jest.fn(),
}));

const bcrypt = require("bcrypt");
const Utilisateur = require("../../models/Utilisateur");
const emailService = require("../../services/emailService");
const passwordResetService = require("../../services/passwordResetService");

describe("passwordResetService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not reveal missing or inactive accounts", async () => {
    Utilisateur.findByEmail.mockResolvedValueOnce(null);
    await expect(
      passwordResetService.requestPasswordReset({ email: "missing@example.com" })
    ).resolves.toEqual({ resetToken: null });

    Utilisateur.findByEmail.mockResolvedValueOnce({ statut: "bloque" });
    await expect(
      passwordResetService.requestPasswordReset({ email: "blocked@example.com" })
    ).resolves.toEqual({ resetToken: null });
  });

  test("creates a reset token and stores its hash", async () => {
    Utilisateur.findByEmail.mockResolvedValue({
      id_user: 7,
      email: "client@example.com",
      statut: "actif",
    });
    Utilisateur.update.mockResolvedValue({});
    emailService.sendPasswordResetEmail.mockResolvedValue();

    const result = await passwordResetService.requestPasswordReset({
      email: "client@example.com",
    });

    expect(result.resetToken).toEqual(expect.any(String));
    expect(Utilisateur.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        reset_token_hash: expect.any(String),
        reset_token_expires: expect.any(Date),
      })
    );
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      "client@example.com",
      result.resetToken
    );
  });

  test("does not fail when reset email sending fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    Utilisateur.findByEmail.mockResolvedValue({
      id_user: 7,
      email: "client@example.com",
      statut: "actif",
    });
    Utilisateur.update.mockResolvedValue({});
    emailService.sendPasswordResetEmail.mockRejectedValue(new Error("SMTP down"));

    await expect(
      passwordResetService.requestPasswordReset({ email: "client@example.com" })
    ).resolves.toEqual({ resetToken: expect.any(String) });

    consoleSpy.mockRestore();
  });

  test("rejects invalid or expired reset tokens", async () => {
    Utilisateur.findByResetTokenHash.mockResolvedValueOnce(null);
    await expect(
      passwordResetService.resetPassword({
        token: "bad-token",
        mot_de_passe: "NewPassword123!",
      })
    ).rejects.toMatchObject({ statusCode: 400 });

    Utilisateur.findByResetTokenHash.mockResolvedValueOnce({
      id_user: 7,
      reset_token_expires: new Date(Date.now() - 1000),
    });
    await expect(
      passwordResetService.resetPassword({
        token: "expired-token",
        mot_de_passe: "NewPassword123!",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("resets a password and clears the token", async () => {
    Utilisateur.findByResetTokenHash.mockResolvedValue({
      id_user: 7,
      email: "client@example.com",
      reset_token_expires: new Date(Date.now() + 60_000),
    });
    Utilisateur.update.mockResolvedValue({});
    emailService.sendPasswordChangedEmail.mockResolvedValue();

    await passwordResetService.resetPassword({
      token: "valid-token",
      mot_de_passe: "NewPassword123!",
    });

    expect(Utilisateur.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        mot_de_passe: expect.any(String),
        reset_token_hash: null,
        reset_token_expires: null,
      })
    );
    expect(
      await bcrypt.compare(
        "NewPassword123!",
        Utilisateur.update.mock.calls[0][1].mot_de_passe
      )
    ).toBe(true);
  });

  test("does not fail when password changed email fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    Utilisateur.findByResetTokenHash.mockResolvedValue({
      id_user: 7,
      email: "client@example.com",
      reset_token_expires: new Date(Date.now() + 60_000),
    });
    Utilisateur.update.mockResolvedValue({});
    emailService.sendPasswordChangedEmail.mockRejectedValue(new Error("SMTP down"));

    await expect(
      passwordResetService.resetPassword({
        token: "valid-token",
        mot_de_passe: "NewPassword123!",
      })
    ).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });
});
