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
});
