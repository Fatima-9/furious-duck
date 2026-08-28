require("dotenv").config();

process.env.JWT_SECRET = process.env.JWT_SECRET || "integration-test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

const request = require("supertest");
const app = require("../../app");
const { pool } = require("../../config/db");

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase("auth and profile API flow", () => {
  let email;

  async function cleanupUser() {
    if (email && pool) {
      await pool.query("DELETE FROM utilisateurs WHERE email = $1", [email]);
    }
  }

  async function getExistingRoleAndBoutique() {
    const roles = await pool.query("SELECT id_role FROM roles ORDER BY id_role LIMIT 1");
    const boutiques = await pool.query(
      "SELECT id_boutique FROM boutiques ORDER BY id_boutique LIMIT 1"
    );

    if (!roles.rows[0] || !boutiques.rows[0]) {
      throw new Error("Integration tests require at least one role and one boutique");
    }

    return {
      role_id: roles.rows[0].id_role,
      boutique_id: boutiques.rows[0].id_boutique,
    };
  }

  beforeEach(async () => {
    email = `codex-it-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
    await cleanupUser();
  });

  afterEach(async () => {
    await cleanupUser();
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  test("health endpoints respond", async () => {
    await request(app).get("/api/health").expect(200).expect({
      status: "ok",
    });

    const response = await request(app).get("/api/db/health").expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.databaseTime).toBeDefined();
  });

  test("register, login, profile update, password change and reset password work", async () => {
    const { role_id, boutique_id } = await getExistingRoleAndBoutique();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        nom: "Codex",
        prenom: "Test",
        email,
        mot_de_passe: "Password123!",
        date_de_naissance: "1990-01-01",
        role_id,
        boutique_id,
      })
      .expect(201);

    expect(registerResponse.body.data.token).toEqual(expect.any(String));
    expect(registerResponse.body.data.user.mot_de_passe).toBeUndefined();

    const token = registerResponse.body.data.token;

    const meResponse = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(meResponse.body.data.user.email).toBe(email);

    const profileResponse = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ prenom: "Updated" })
      .expect(200);

    expect(profileResponse.body.data.user.prenom).toBe("Updated");

    await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        mot_de_passe_actuel: "Password123!",
        mot_de_passe: "NewPassword123!",
      })
      .expect(200);

    await request(app)
      .post("/api/auth/login")
      .send({
        email,
        mot_de_passe: "NewPassword123!",
      })
      .expect(200);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email })
      .expect(200);

    const resetLog = logSpy.mock.calls
      .map((call) => call.join(" "))
      .find((message) => message.includes(`[reset] token for ${email}:`));

    logSpy.mockRestore();

    expect(resetLog).toBeDefined();

    const resetToken = resetLog.split(": ").at(-1);

    await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: resetToken,
        mot_de_passe: "FinalPassword123!",
      })
      .expect(200);

    await request(app)
      .post("/api/auth/login")
      .send({
        email,
        mot_de_passe: "FinalPassword123!",
      })
      .expect(200);
  });

  test("protected profile route rejects missing token", async () => {
    const response = await request(app).get("/api/users/me").expect(401);

    expect(response.body).toEqual({
      status: "error",
      message: "authentication token is required",
    });
  });
});
