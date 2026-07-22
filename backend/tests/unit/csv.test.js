const { toCsv, escapeCsvValue } = require("../../utils/csv");

describe("escapeCsvValue", () => {
  test("leaves a simple value untouched", () => {
    expect(escapeCsvValue("Dupont")).toBe("Dupont");
  });

  test("returns an empty string for null and undefined", () => {
    expect(escapeCsvValue(null)).toBe("");
    expect(escapeCsvValue(undefined)).toBe("");
  });

  test("quotes a value containing a comma", () => {
    expect(escapeCsvValue("Dupont, Marie")).toBe('"Dupont, Marie"');
  });

  test("doubles inner quotes", () => {
    expect(escapeCsvValue('Marie "La Rouge"')).toBe('"Marie ""La Rouge"""');
  });

  test("quotes a value containing a line break", () => {
    expect(escapeCsvValue("ligne1\nligne2")).toBe('"ligne1\nligne2"');
  });

  test("neutralizes a formula so Excel does not execute it", () => {
    expect(escapeCsvValue("=1+1")).toBe("'=1+1");
    expect(escapeCsvValue("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  test("serializes dates in ISO format", () => {
    expect(escapeCsvValue(new Date("2026-07-21T10:00:00Z"))).toBe(
      "2026-07-21T10:00:00.000Z"
    );
  });
});

describe("toCsv", () => {
  test("writes a header row followed by the data", () => {
    const csv = toCsv(
      [
        { nom: "Dupont", email: "marie@example.com" },
        { nom: "Martin", email: "paul@example.com" },
      ],
      ["nom", "email"]
    );

    expect(csv).toBe(
      "nom,email\nDupont,marie@example.com\nMartin,paul@example.com"
    );
  });

  test("only exports the requested columns", () => {
    const csv = toCsv(
      [{ nom: "Dupont", mot_de_passe: "secret", email: "marie@example.com" }],
      ["nom", "email"]
    );

    expect(csv).not.toContain("secret");
    expect(csv).toBe("nom,email\nDupont,marie@example.com");
  });

  test("handles an empty dataset", () => {
    expect(toCsv([], ["nom", "email"])).toBe("nom,email");
  });

  test("fills missing fields with an empty value", () => {
    expect(toCsv([{ nom: "Dupont" }], ["nom", "email"])).toBe(
      "nom,email\nDupont,"
    );
  });
});
