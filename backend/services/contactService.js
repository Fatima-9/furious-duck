const { sendMail } = require("./emailService");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildContactEmailContent({ prenom, nom, email, motif, message }) {
  const subject = `[The Tip Top] ${motif}`;
  const safePrenom = escapeHtml(prenom);
  const safeNom = escapeHtml(nom);
  const safeEmail = escapeHtml(email);
  const safeMotif = escapeHtml(motif);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const text = `Nouveau message de contact

Prenom: ${prenom}
Nom: ${nom}
Email: ${email}
Motif: ${motif}

Message:
${message}`;

  const html = `<p>Nouveau message de contact</p>
<ul>
  <li><strong>Prenom :</strong> ${safePrenom}</li>
  <li><strong>Nom :</strong> ${safeNom}</li>
  <li><strong>Email :</strong> ${safeEmail}</li>
  <li><strong>Motif :</strong> ${safeMotif}</li>
</ul>
<p><strong>Message :</strong></p>
<p>${safeMessage}</p>`;

  return { subject, text, html };
}

async function sendContactMessage(payload) {
  const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
  const { subject, text, html } = buildContactEmailContent(payload);

  return sendMail({
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendContactMessage,
  buildContactEmailContent,
};
