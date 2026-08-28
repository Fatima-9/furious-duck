const { sendMail } = require("./emailService");

async function subscribeToNewsletter({ email }) {
  const to = process.env.NEWSLETTER_TO_EMAIL || process.env.SMTP_USER || email;

  await sendMail({
    to,
    subject: "[The Tip Top] Nouvelle inscription newsletter",
    text: `Nouvelle inscription newsletter : ${email}`,
    html: `<p>Nouvelle inscription newsletter : <strong>${email}</strong></p>`,
  });

  return { email };
}

module.exports = {
  subscribeToNewsletter,
};
