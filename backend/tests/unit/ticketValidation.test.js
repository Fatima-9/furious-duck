const { normalizeTicketCode } = require("../../validations/ticketValidation");

describe("ticketValidation", () => {
  test("normalizes a valid ticket code", () => {
    expect(normalizeTicketCode(" ab12cd34ef ")).toBe("AB12CD34EF");
  });

  test("rejects a code that is not 10 characters", () => {
    expect(() => normalizeTicketCode("ABC123")).toThrow(
      "code_ticket must contain 10 letters or digits"
    );
  });

  test("rejects a missing code", () => {
    expect(() => normalizeTicketCode(" ")).toThrow("code_ticket is required");
  });

  test("rejects special characters", () => {
    expect(() => normalizeTicketCode("ABC12345!?")).toThrow(
      "code_ticket must contain 10 letters or digits"
    );
  });
});
