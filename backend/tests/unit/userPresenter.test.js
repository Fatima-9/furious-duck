const { sanitizeUser } = require("../../utils/userPresenter");

describe("userPresenter", () => {
  test("removes the password hash from a user", () => {
    const safeUser = sanitizeUser({
      id_user: 1,
      email: "user@example.com",
      mot_de_passe: "hashed-password",
    });

    expect(safeUser).toEqual({
      id_user: 1,
      email: "user@example.com",
    });
  });

  test("returns null for an empty user", () => {
    expect(sanitizeUser(null)).toBeNull();
  });
});
