jest.mock("../../services/emailService", () => ({
  sendMail: jest.fn(),
}));

const { sendMail } = require("../../services/emailService");
const {
  subscribeToNewsletter,
} = require("../../services/newsletterService");

describe("newsletterService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sends a newsletter subscription notification", async () => {
    sendMail.mockResolvedValue({ sent: true });

    const result = await subscribeToNewsletter({
      email: "client@example.com",
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "[The Tip Top] Nouvelle inscription newsletter",
        text: expect.stringContaining("client@example.com"),
      })
    );
    expect(result).toEqual({ email: "client@example.com" });
  });
});
