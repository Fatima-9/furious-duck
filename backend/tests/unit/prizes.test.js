const { getPrizeQuantities } = require("../../config/prizes");

describe("prizes", () => {
  test("computes the expected distribution for 500000 tickets", () => {
    const prizes = getPrizeQuantities(500000);

    expect(prizes.map((prize) => prize.quantite_total)).toEqual([
      300000,
      100000,
      50000,
      30000,
      20000,
    ]);

    expect(prizes.reduce((sum, prize) => sum + prize.quantite_total, 0)).toBe(
      500000
    );
  });

  test("keeps the total exact when the ticket count does not divide evenly", () => {
    const prizes = getPrizeQuantities(11);

    expect(prizes.reduce((sum, prize) => sum + prize.quantite_total, 0)).toBe(11);
  });
});
