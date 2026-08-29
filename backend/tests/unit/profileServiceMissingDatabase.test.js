jest.mock("../../config/db", () => ({
  pool: null,
}));

jest.mock("../../models/Utilisateur", () => ({
  findById: jest.fn(),
}));

jest.mock("../../services/emailService", () => ({
  sendPasswordChangedEmail: jest.fn(),
}));

const Utilisateur = require("../../models/Utilisateur");
const profileService = require("../../services/profileService");

describe("profileService without database configuration", () => {
  beforeEach(() => {
    Utilisateur.findById.mockReset();
  });

  test("rejects hard deletion when DATABASE_URL is missing", async () => {
    Utilisateur.findById.mockResolvedValue({
      id_user: 11,
      role_id: 1,
      statut: "actif",
    });

    await expect(profileService.deleteProfile(11)).rejects.toMatchObject({
      statusCode: 500,
      message: "DATABASE_URL is not configured",
    });
  });
});
