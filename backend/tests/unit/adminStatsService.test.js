jest.mock("../../config/db", () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require("../../config/db");
const adminStatsService = require("../../services/adminStatsService");

describe("adminStatsService", () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test("toCount converts postgres bigint strings to numbers", () => {
    expect(adminStatsService.toCount("500000")).toBe(500000);
    expect(adminStatsService.toCount(12)).toBe(12);
  });

  test("toCount falls back to 0 for null or invalid values", () => {
    expect(adminStatsService.toCount(null)).toBe(0);
    expect(adminStatsService.toCount(undefined)).toBe(0);
    expect(adminStatsService.toCount("abc")).toBe(0);
  });

  test("getTicketStats returns numbers, not strings", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          total: "500000",
          utilises: "12",
          restants: "499988",
          remis: "5",
          a_remettre: "7",
        },
      ],
    });

    const stats = await adminStatsService.getTicketStats();

    expect(stats).toEqual({
      total: 500000,
      utilises: 12,
      restants: 499988,
      remis: 5,
      a_remettre: 7,
    });
  });

  test("getGainStats keeps prizes nobody has won yet", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          id_gain: 1,
          libelle: "Infuseur a the",
          pourcentage_distribution: "60.00",
          quantite_total: "300000",
          quantite_restante: "300000",
          tickets_gagnes: "0",
          lots_remis: "0",
        },
      ],
    });

    const gains = await adminStatsService.getGainStats();

    expect(gains).toHaveLength(1);
    expect(gains[0]).toMatchObject({
      libelle: "Infuseur a the",
      pourcentage_distribution: 60,
      tickets_gagnes: 0,
      lots_remis: 0,
    });
  });

  test("getUserStats groups by sexe, age range and signup type", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ total: "3", actifs: "2", participants: "1" }],
      })
      .mockResolvedValueOnce({
        rows: [
          { sexe: "F", total: "2" },
          { sexe: "non_renseigne", total: "1" },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ tranche: "25_34", total: "3" }] })
      .mockResolvedValueOnce({ rows: [{ type_inscription: "email", total: "3" }] });

    const stats = await adminStatsService.getUserStats();

    expect(stats.total).toBe(3);
    expect(stats.actifs).toBe(2);
    expect(stats.participants).toBe(1);
    expect(stats.par_sexe).toEqual([
      { sexe: "F", total: 2 },
      { sexe: "non_renseigne", total: 1 },
    ]);
    expect(stats.par_tranche_age).toEqual([{ tranche: "25_34", total: 3 }]);
    expect(stats.par_type_inscription).toEqual([
      { type_inscription: "email", total: 3 },
    ]);
  });
});
