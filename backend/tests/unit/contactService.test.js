const {
  buildContactEmailContent,
} = require("../../services/contactService");

describe("contactService", () => {
  test("builds contact email content and escapes html", () => {
    const content = buildContactEmailContent({
      prenom: "Alice",
      nom: "Dupont",
      email: "alice@example.com",
      motif: "Autre",
      message: "<script>alert('x')</script>",
    });

    expect(content.subject).toBe("[The Tip Top] Autre");
    expect(content.text).toContain("<script>alert('x')</script>");
    expect(content.html).toContain("&lt;script&gt;");
    expect(content.html).not.toContain("<script>");
  });
});
